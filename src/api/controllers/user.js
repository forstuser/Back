'use strict';
import bCrypt from 'bcrypt-nodejs';
import moment from 'moment';
import RSA from 'node-rsa';
import requestPromise from 'request-promise';
import S3FS from 's3fs';
import uuid from 'uuid';
import config from '../../config/main';
import GoogleHelper from '../../helpers/google';
import OTPHelper from '../../helpers/otp';
import shared from '../../helpers/shared';
// const fs = require('fs');
import trackingHelper from '../../helpers/tracking';
import DashboardAdaptor from '../Adaptors/dashboard';
import NearByAdaptor from '../Adaptors/nearby';
import NotificationAdaptor from '../Adaptors/notification';
import UserAdaptor from '../Adaptors/user';
import roles from '../constants';
import authentication from './authentication';

const PUBLIC_KEY = new RSA(config.TRUECALLER_PUBLIC_KEY, {signingScheme: 'sha512'});
const AWS = config.AWS;

const fsImplUser = new S3FS(`${AWS.S3.BUCKET}/${AWS.S3.USER_IMAGE}`, AWS.ACCESS_DETAILS);

let userModel;
let userRelationModel;
let modals;
let dashboardAdaptor;
let userAdaptor;
let nearByAdaptor;
let notificationAdaptor;
let fcmModel;

function isValidPassword (userpass, passwordValue) {
	return bCrypt.compareSync(passwordValue, userpass);
}

const validatePayloadSignature = function (payload, signature) {
	return PUBLIC_KEY.verify(payload, signature, '', 'base64');
};

const insertFcmDetails = function (userId, fcmId) {
	if (!fcmId || fcmId === '') {
		return Promise.resolve('NULL FCMID');
	}
	return fcmModel.create({
		user_id: userId,
		fcm_id: fcmId
	}).then((data) => {
		return data;
	}).catch((err) => {
		console.log({API_Logs: err});
	});
};

const deleteFcmDetails = function (userId, fcmId) {
	return fcmModel.destroy({
		where: {
			user_id: userId,
			fcm_id: fcmId
		}
	}).then((rows) => {
		return rows;
	}).catch((err) => {
		console.log({API_Logs: err});
	});
};

class UserController {
	constructor (modal) {
		userModel = modal.users;
		userRelationModel = modal.users_temp;
		modals = modal;
		fcmModel = modal.fcmDetails;
		dashboardAdaptor = new DashboardAdaptor(modals);
		userAdaptor = new UserAdaptor(modals);
		nearByAdaptor = new NearByAdaptor(modals);
		notificationAdaptor = new NotificationAdaptor(modals);
	}

	static subscribeUser (request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			if (request.payload && request.payload.fcmId) {
				insertFcmDetails(user.id, request.payload.fcmId).then((data) => {
					console.log(data);
				}).catch((err) => {
					console.log({API_Logs: err});
				});
			}

			reply({status: true, forceUpdate: request.pre.forceUpdate}).code(201);
		} else {
			reply({status: false, message: 'Forbidden', forceUpdate: request.pre.forceUpdate});
		}
	}

	static dispatchOTP (request, reply) {
		if (!GoogleHelper.isValidPhoneNumber(request.payload.PhoneNo)) {
			console.log(`Phone number: ${request.payload.PhoneNo} is not a valid phone number`);
			return reply({
				status: false,
				message: 'Invalid Phone number'
			});
		}

		Promise.all([OTPHelper.sendOTPToUser(request.payload.PhoneNo), userModel.findOne({
			where: {
				mobile_no: request.payload.PhoneNo
			}
		})]).then((response) => {
			console.log(response);
			if (response[0].type === 'success') {
				console.log('SMS SENT WITH ID: ', response[0].message);
				if (response[1] && response[1][1]) {
					response[1][0].updateAttributes({
						last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss')
					});
					reply({
						status: true,
						Name: response[1][0].Name,
						PhoneNo: request.payload.PhoneNo,
					}).code(201);
				} else {
					reply({
						status: true,
						PhoneNo: request.payload.PhoneNo,
						// forceUpdate: request.pre.forceUpdate
					}).code(201);
				}
			} else {
				reply({error: response.ErrorMessage}).code(403);  //, forceUpdate: request.pre.forceUpdate}).code(403);
			}
		}).catch((err) => {
			console.log({API_Logs: err});
			reply({
				status: false,
				err,
			});
		});
	}

	static validateOTP (request, reply) {
		console.log('REQUEST PAYLOAD FOR VALIDATE OTP: ');
		console.log(request.payload);
		if (!request.pre.forceUpdate) {
			const trueObject = request.payload.TrueObject;
			if (request.payload.BBLogin_Type === 1) {
				/*return Bluebird.try(() => {
					return OTPHelper.verifyOTPForUser(trueObject.PhoneNo, request.payload.Token);
				}).then((data) => {
					console.log('VALIDATE OTP RESPONSE: ', data);
					if (data.type === 'success') {*/
						userAdaptor.loginOrRegister({
							mobile_no: trueObject.PhoneNo,
							user_status_type: 1
						},{
							role_type: 5,
							mobile_no: trueObject.PhoneNo,
							user_status_type: 1,
							// gcm_id: request.payload.fcmId
						}).then((userData) => {
							userData[0].updateAttributes({
								last_login_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
								// gcm_id: request.payload.fcmId
							});

							const updatedUser = userData[0].toJSON();
							if ((!updatedUser.email_verified) && (updatedUser.email)) {
								NotificationAdaptor.sendVerificationMail(updatedUser.email, updatedUser);
							}
							insertFcmDetails(updatedUser.ID, request.payload.fcmId).then((data) => {
								console.log(data);
							}).catch(console.log);

							reply(/*dashboardAdaptor.prepareDashboardResult(userData[1], updatedUser, `bearer ${authentication.generateToken(userData[0]).token}`, request)*/).code(201).header('authorization', `bearer ${authentication.generateToken(userData[0]).token}`);

							if (request.payload.transactionId && request.payload.transactionId !== '') {
								trackingHelper.postbackTracking(request.payload.transactionId, updatedUser.ID).then((response) => {
									console.log('SUCCESSFULLY SENT ICUBESWIRE POSTBACK');
									console.log(response);
								}).catch((err) => {
									console.log('Error in sending iCUBESWIRE POSTBACK');
									console.log({API_Logs: err});
								});
							}
						}).catch((err) => {
							console.log({API_Logs: err});
							reply({
								message: 'Issue in updating data',
								status: false,
								err,
								forceUpdate: request.pre.forceUpdate
							});
						});
					/*} else {
						reply({
							status: false,
							message: 'Invalid/Expired OTP',
							forceUpdate: request.pre.forceUpdate
						}).code(401);
					}
				}).catch((err) => {
					console.log({API_Logs: err});
					reply({
						message: 'Issue in updating data',
						status: false,
						err,
						forceUpdate: request.pre.forceUpdate
					});
				});*/
			} else if (request.payload.BBLogin_Type === 2) {
				const TrueSecret = request.payload.TrueSecret;
				const TruePayload = request.payload.TruePayload;

				if (!validatePayloadSignature(TruePayload, TrueSecret)) {
					reply({
						message: 'Payload verification failed',
						status: false,
						forceUpdate: request.pre.forceUpdate
					});
				} else {
					const userItem = {
						role_type: 5,
						email: trueObject.EmailAddress,
						fullname: trueObject.Name,
						password: bCrypt.hashSync(trueObject.Password, bCrypt.genSaltSync(8), null),
						image: trueObject.ImageLink,
						accessLevel: trueObject.accessLevel ? trueObject.accessLevel : roles.ROLE_MEMBER,
						email_secret: uuid.v4(),
						last_login_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
						mobile_no: trueObject.PhoneNo,
						user_status_type: 1,
					};

					userAdaptor.loginOrRegister({
						mobile_no: trueObject.PhoneNo,
						user_status_type: 1
					},
						userItem).then((userData) => {
						if (!userData[1]) {
							userData[0].updateAttributes({
								email_secret: uuid.v4(),
								email_id: trueObject.EmailAddress,
								fullname: trueObject.Name,
								last_login_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
								// gcm_id: trueObject.fcmId
							});
						}

						const updatedUser = userData[0].toJSON();
						if (!updatedUser.email_verified) {
							NotificationAdaptor.sendVerificationMail(trueObject.EmailAddress, updatedUser);
						}

						UserController.uploadTrueCallerImage(trueObject, updatedUser);

						insertFcmDetails(updatedUser.ID, request.payload.fcmId).then((data) => {
							console.log(data);
						}).catch((err) => console.log({API_Logs: err}));

						reply(dashboardAdaptor.prepareDashboardResult(userData[1], updatedUser, `bearer ${authentication.generateToken(userData[0]).token}`, request)).code(201).header('authorization', `bearer ${authentication.generateToken(userData[0]).token}`);

						if (request.payload.transactionId && request.payload.transactionId !== '') {
							trackingHelper.postbackTracking(request.payload.transactionId, updatedUser.ID).then((response) => {
								console.log('SUCCESSFULLY SENT ICUBESWIRE POSTBACK');
								console.log(response);
							}).catch((err) => {
								console.log('Error in sending iCUBESWIRE POSTBACK');
								console.log({API_Logs: err});
							});
						}
					}).catch((err) => console.log({API_Logs: err}));
				}
			}
		} else {
			reply({status: false, message: 'Forbidden', forceUpdate: request.pre.forceUpdate});
		}
	}

	static register (request, reply) {
		const userItem = {
			EmailAddress: request.payload.emailAddress,
			Name: request.payload.fullName,
			Password: bCrypt.hashSync(request.payload.password, bCrypt.genSaltSync(8), null),
			Location: request.payload.location,
			Latitude: request.payload.latitude,
			Longitude: request.payload.longitude,
			ImageLink: request.payload.ImageLink,
			PhoneNo: request.payload.PhoneNo,
			accessLevel: request.payload.accessLevel ? request.payload.accessLevel : roles.ROLE_MEMBER
		};
		userModel.create(userItem).then((newUser) => {
			reply({statusCode: 201}).header('authorization', `bearer ${authentication.generateToken(newUser)}`);
		});
	}

	static login (request, reply) {
		const error = new Error();
		userModel.findOne({where: {emailAddress: request.payload.UserName}}).then((userItem) => {
			if (!userItem) {
				error.statusCode = 404;
				error.message = 'Email does not exist';
				return reply(error);
			}

			if (!isValidPassword(userItem.password, request.payload.Password)) {
				error.statusCode = 401;
				error.message = 'Incorrect password.';
				return reply(error);
			}
			let tokenDetail = userItem;
			if (!authentication.validateToken(userItem.expiresIn)) {
				tokenDetail = authentication.generateToken(userItem);
			}

			return reply({statusCode: 201}).header('authorization', `bearer ${tokenDetail.token}`).header('expiresIn', tokenDetail.expiresIn);
		}).catch((err) => {
			console.log({API_Logs: err});
			error.status = 401;
			error.message = 'Something went wrong, please try again.';
			error.raw = err;
			return reply(error);
		});
	}

	static logout (request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			if (request.payload && request.payload.fcmId) {
				deleteFcmDetails(user.ID, request.payload.fcmId).then((rows) => {
					console.log('TOTAL FCM ID\'s DELETED: ', rows);
				});
			}

			reply({status: true, forceUpdate: request.pre.forceUpdate}).code(201);
		} else {
			reply({status: false, message: 'Forbidden', forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveUserProfile (request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
			reply(userAdaptor.retrieveUserProfile(user, request));
		} else if (!user) {
			reply({message: 'Invalid Token', forceUpdate: request.pre.forceUpdate}).code(401);
		} else {
			reply({message: 'Forbidden', status: false, forceUpdate: request.pre.forceUpdate});
		}
	}

	static updateUserProfile (request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
			userAdaptor.updateUser(user, request, reply);
		} else if (!user) {
			reply({message: 'Invalid Token', forceUpdate: request.pre.forceUpdate}).code(401);
		} else {
			reply({status: false, message: 'Forbidden', forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveNearBy (request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			nearByAdaptor.retrieveNearBy(request.query.location || user.location, request.query.geolocation || `${user.latitude},${user.longitude}`,
				request.query.professionids || '[]', reply, user.ID, request);
		} else {
			reply({status: false, message: 'Forbidden', forceUpdate: request.pre.forceUpdate});
		}
	}

	static verifyEmailAddress (request, reply) {
		const emailSecret = request.params.token;
		notificationAdaptor.verifyEmailAddress(emailSecret, reply);
	}

	static uploadTrueCallerImage (trueObject, userData) {
		if (trueObject.ImageLink) {
			const options = {
				uri: trueObject.ImageLink,
				timeout: 170000,
				resolveWithFullResponse: true,
				encoding: null
			};
			modals.userImages.count({
				where: {
					user_id: userData.ID
				}
			}).then((imageCount) => {
				if (imageCount <= 0) {
					requestPromise(options).then((result) => {
						UserController.uploadUserImage(userData, result);
					});
				}
			});
		}
	}

	static uploadUserImage (user, result) {
		const fileType = result.headers['content-type'].split('/')[1];
		const fileName = `${user.ID}-${new Date().getTime()}.${fileType}`;
		// const file = fs.createReadStream();
		fsImplUser.writeFile(fileName, result.body, {ContentType: result.headers['content-type']})
			.then(() => {
				const ret = {
					user_id: user.ID,
					user_image_name: fileName,
					user_image_type: fileType,
					status_id: 1,
					updated_by_user_id: user.ID,
					uploaded_by_id: user.ID
				};
				modals.userImages.findOrCreate({
					where: {
						user_id: user.ID
					},
					defaults: ret
				}).then((userResult) => {
					if (!userResult[1]) {
						userResult[0].updateAttributes({
							user_image_name: fileName,
							user_image_type: fileType,
							status_id: 1,
							updated_by_user_id: user.ID,
							uploaded_by_id: user.ID
						});
					}

					return ({
						status: true,
						message: 'Uploaded Successfully',
						userResult: userResult[0]
					});
				}).catch((err) => {
					throw new Error('Upload Failed', err);
				});
			}).catch((err) => {
			throw new Error('Upload Failed', err);
		});
	}
}

module.exports = UserController;
