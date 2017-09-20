/*jshint esversion: 6 */
'use strict';

const bCrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const config = require('../../config/main');
// const fs = require('fs');
const authentication = require('./authentication');
const shared = require('../../helpers/shared');
const roles = require('../constants');
const requestPromise = require('request-promise');
const S3FS = require('s3fs');
const RSA = require('node-rsa');
const moment = require('moment');
const uuid = require('uuid');

const PUBLIC_KEY = new RSA(config.TRUECALLER_PUBLIC_KEY, {signingScheme: 'sha512'});

const DashboardAdaptor = require('../Adaptors/dashboard');
const UserAdaptor = require('../Adaptors/user');
const NearByAdaptor = require('../Adaptors/nearby');
const NotificationAdaptor = require('../Adaptors/notification');
const OTPHelper = require("../../helpers/otp");
const Bluebird = require("bluebird");
const trackingHelper = require('../../helpers/tracking');


const AWS = require('../../config/main').AWS;

const fsImplUser = new S3FS(`${AWS.S3.BUCKET}/${AWS.S3.USER_IMAGE}`, AWS.ACCESS_DETAILS);

let userModel;
let userRelationModel;
let modals;
let dashboardAdaptor;
let userAdaptor;
let nearByAdaptor;
let notificationAdaptor;
let fcmModel;

function isValidPassword(userpass, passwordValue) {
	return bCrypt.compareSync(passwordValue, userpass);
}

const generateRandomString = (len, charArray = null) => {
	const choice = charArray || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

	const round = crypto.randomBytes(len);
	const value = new Array(len);
	const arrLen = choice.length;

	for (let i = 0; i < len; i += 1) {
		value[i] = choice[round[i] % arrLen];
	}

	return value.join('');
};

const isValid = (tokenDb, token) => {
	const now = moment.utc();
	const otpCreatedAt = moment(tokenDb.token_updated).utc();

	const diff = now.diff(otpCreatedAt, 'minutes');

	return (tokenDb.OTP === token.toString() && diff <= 5 && tokenDb.valid_turns < 4);
};

const validatePayloadSignature = function (payload, signature) {
	return PUBLIC_KEY.verify(payload, signature, '', 'base64');
};

const insertFcmDetails = function (userId, fcmId) {
	if (!fcmId || fcmId === "") {
		return Promise.resolve("NULL FCMID");
	}
	return fcmModel.create({
		user_id: userId,
		fcm_id: fcmId
	}).then((data) => {
		return data;
	}).catch((err) => {
		console.log(err);
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
		console.log(err);
	});
};

class UserController {
	constructor(modal) {
		userModel = modal.table_users;
		userRelationModel = modal.table_users_temp;
		modals = modal;
		fcmModel = modal.fcmDetails;
		dashboardAdaptor = new DashboardAdaptor(modals);
		userAdaptor = new UserAdaptor(modals);
		nearByAdaptor = new NearByAdaptor(modals);
		notificationAdaptor = new NotificationAdaptor(modals);
	}

	static dispatchOTP(request, reply) {
		// console.log("PREEEEE");
		// console.log(request.pre);
		// const otp = generateRandomString(6);
		// const options = {
		// 	uri: 'http://api.msg91.com/api/sendhttp.php',
		// 	qs: {
		// 		authkey: config.SMS.AUTH_KEY,
		// 		sender: 'BinBill',
		// 		// channel: 2,
		// 		// DCS: 0,
		// 		flash: 0,
		// 		mobiles: request.payload.PhoneNo,
		// 		message: `Your verification code is "${otp}". Please enter this code to login your account.`,
		// 		route: 4,
		// 		country: 91,
		// 		response: 'json'
		// 	},
		// 	timeout: 170000,
		// 	json: true // Automatically parses the JSON string in the response
		// };

		// if (!request.pre.forceUpdate) {
		Promise.all([OTPHelper.sendOTPToUser(request.payload.PhoneNo), userModel.findOne({
			where: {
				mobile_no: request.payload.PhoneNo
			},
			attributes: {
				exclude: ['UserTypeID']
			}
		})]).then((response) => {
			console.log(response);
			if (response[0].type === 'success') {
				console.log("SMS SENT WITH ID: ", response[0].message);
				if (response[1] && response[1][1]) {
					response[1][0].updateAttributes({
						last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss')
					});
					reply({
						Status: true,
						Name: response[1][0].Name,
						PhoneNo: request.payload.PhoneNo,
						// forceUpdate: request.pre.forceUpdate
					}).code(201);
				} else {
					reply({
						Status: true,
						PhoneNo: request.payload.PhoneNo,
						// forceUpdate: request.pre.forceUpdate
					}).code(201);
				}
				// userRelationModel.findOrCreate({
				// 	where: {
				// 		PhoneNo: request.payload.PhoneNo
				// 	},
				// 	defaults: {
				// 		PhoneNo: request.payload.PhoneNo,
				// 		OTP: otp,
				// 		token_updated: shared.formatDate(moment().utc(), 'yyyy-mm-dd HH:MM:ss'),
				// 		valid_turns: 0
				// 	}
				// }).then((result) => {
				// 	// console.log("RESULT 0: ", result[0]);
				// 	// console.log("RESULT 1: ", result[1]);
				//
				//
				// 	if (!result[1]) {
				// 		result[0].updateAttributes({
				// 			OTP: otp,
				// 			token_updated: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
				// 			valid_turns: 0
				// 		});
				// 	}


				// }).catch((err) => {
				// 	console.log(err);
				// 	reply({
				// 		status: false,
				// 		err
				// 	});
				// });
			} else {
				reply({error: response.ErrorMessage}).code(403);  //, forceUpdate: request.pre.forceUpdate}).code(403);
			}
		}).catch((err) => {
			console.log(err);
			reply({
				status: false,
				err,
				// forceUpdate: request.pre.forceUpdate
			});
		});
		// } else {
		// 	reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		// }
	}

	static validateOTP(request, reply) {
		if (!request.pre.forceUpdate) {
			const trueObject = request.payload.TrueObject;
			if (request.payload.BBLogin_Type === 1) {
				return Bluebird.try(() => {
					return OTPHelper.verifyOTPForUser(trueObject.PhoneNo, request.payload.Token);
				}).then((data) => {
					console.log("VALIDATE OTP RESPONSE: ", data);
					if (data.type === "success") {
						userModel.findOrCreate({
							where: {
								mobile_no: trueObject.PhoneNo,
								status_id: 1
							},
							defaults: {
								user_type_id: 5,
								mobile_no: trueObject.PhoneNo,
								status_id: 1,
								// gcm_id: request.payload.fcmId
							},
							attributes: ['ID', ['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'], ['professional_description', 'description'], ['gcm_id', 'fcmId']]
						}).then((userData) => {
							userData[0].updateAttributes({
								last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
								// gcm_id: request.payload.fcmId
							});

							insertFcmDetails(userData[0].ID, request.payload.fcmId).then((data) => {
								console.log(data);
							});

							reply(dashboardAdaptor.prepareDashboardResult(userData[1], userData[0], `bearer ${authentication.generateToken(userData[0]).token}`, request)).code(201).header('authorization', `bearer ${authentication.generateToken(userData[0]).token}`);

							if (request.payload.transactionId && request.payload.transactionId !== '') {
								trackingHelper.postbackTracking(request.payload.transactionId, userData[0].ID).then((response) => {
									console.log("SUCCESSFULLY SENT ICUBESWIRE POSTBACK");
									console.log(response);
								}).catch((err) => {
									console.log("Error in sending iCUBESWIRE POSTBACK");
									console.log(err);
								});
							}
						}).catch((err) => {
							console.log(err);
							reply({
								message: 'Issue in updating data',
								status: false,
								err,
								forceUpdate: request.pre.forceUpdate
							});
						});
					} else {
						reply({
							status: false,
							message: 'Invalid/Expired OTP',
							forceUpdate: request.pre.forceUpdate
						}).code(401);
					}
				}).catch((err) => {
					console.log(err);
					reply({
						message: 'Issue in updating data',
						status: false,
						err,
						forceUpdate: request.pre.forceUpdate
					});
				});
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
						user_type_id: 5,
						email_id: trueObject.EmailAddress,
						fullname: trueObject.Name,
						Password: bCrypt.hashSync(trueObject.Password, bCrypt.genSaltSync(8), null),
						location: trueObject.Location,
						latitude: trueObject.Latitude,
						longitude: trueObject.Longitude,
						image: trueObject.ImageLink,
						accessLevel: trueObject.accessLevel ? trueObject.accessLevel : roles.ROLE_MEMBER,
						email_secret: uuid.v4(),
						last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
						mobile_no: trueObject.PhoneNo,
						status_id: 1,
						// gcm_id: trueObject.fcmId
					};

					userModel.findOrCreate({
						where: {
							mobile_no: trueObject.PhoneNo,
							status_id: 1
						},
						defaults: userItem,
						attributes: ['ID', ['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'], ['professional_description', 'description']]
					})
						.then((userData) => {
							if (!userData[1]) {
								userData[0].updateAttributes({
									email_secret: uuid.v4(),
									email_id: trueObject.EmailAddress,
									fullname: trueObject.Name,
									last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
									// gcm_id: trueObject.fcmId
								});
							}

							const updatedUser = userData[0].toJSON();
							if (!updatedUser.email_verified) {
								NotificationAdaptor.sendVerificationMail(trueObject.EmailAddress, updatedUser);
							}

							UserController.uploadTrueCallerImage(trueObject, userData[0]);

							insertFcmDetails(userData[0].ID, request.payload.fcmId).then((data) => {
								console.log(data);
							});

							reply(dashboardAdaptor.prepareDashboardResult(userData[1], userData[0], `bearer ${authentication.generateToken(userData[0]).token}`, request)).code(201).header('authorization', `bearer ${authentication.generateToken(userData[0]).token}`);

							if (request.payload.transactionId && request.payload.transactionId !== '') {
								trackingHelper.postbackTracking(request.payload.transactionId, userData[0].ID).then((response) => {
									console.log("SUCCESSFULLY SENT ICUBESWIRE POSTBACK");
									console.log(response);
								}).catch((err) => {
									console.log("Error in sending iCUBESWIRE POSTBACK");
									console.log(err);
								});
							}
						});
				}
			}
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static register(request, reply) {
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

	static login(request, reply) {
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
			console.log(err);
			error.status = 401;
			error.message = 'Something went wrong, please try again.';
			error.raw = err;
			return reply(error);
		});
	}

	static logout(request, reply) {
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
					console.log("TOTAL FCM ID's DELETED: ", rows);
				});
			}

			reply({status: true, forceUpdate: request.pre.forceUpdate}).code(201);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveUserProfile(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
			reply(userAdaptor.retrieveUserProfile(user, request));
		} else if (!user) {
			reply({message: 'Invalid Token', forceUpdate: request.pre.forceUpdate}).code(401);
		} else {
			reply({message: "Forbidden", status: false, forceUpdate: request.pre.forceUpdate});
		}
	}

	static updateUserProfile(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
			userAdaptor.updateUser(user, request, reply);
		} else if (!user) {
			reply({message: 'Invalid Token', forceUpdate: request.pre.forceUpdate}).code(401);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveNearBy(request, reply) {
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
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static verifyEmailAddress(request, reply) {
		const emailSecret = request.params.token;
		reply(notificationAdaptor.verifyEmailAddress(emailSecret));
	}

	static uploadTrueCallerImage(trueObject, userData) {
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

	static uploadUserImage(user, result) {
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
