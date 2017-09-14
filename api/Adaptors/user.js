/*jshint esversion: 6 */
'use strict';

const NotificationAdaptor = require('./notification');
const uuid = require('uuid');
const validator = require("validator");
const validateEmail = function (email) {
	if (validator.isEmail(email) || email === '') {
		return email;
	}

	return undefined;
};

class UserAdaptor {
	constructor(modals) {
		this.modals = modals;
	}

	retrieveUserProfile(user, request) {
		return this.modals.table_users.findById(user.ID, {
			attributes: [['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'], ['professional_description', 'description']],
			include: [{
				model: this.modals.userImages,
				as: 'userImages',
				attributes: [[this.modals.sequelize.fn('CONCAT', 'consumer/', this.modals.sequelize.col('user_image_id'), '/images'), 'imageUrl']]
			}]
		}).then(result => ({
			status: true,
			message: 'User Data retrieved',
			binBillDetail: {
				callUs: '+91-124-4343177',
				emailUs: 'info@binbill.com',
				aboutUs: 'http://www.binbill.com/homes/about',
				reportAnErrorOn: 'support@binbill.com',
				faqUrl: 'http://www.binbill.com/faqs'
			},
			userProfile: result,
			forceUpdate: request.pre.forceUpdate
		})).catch(err => ({
			status: false,
			message: 'User Data Retrieval Failed',
			err,
			forceUpdate: request.pre.forceUpdate
		}));
	}

	updateUser(user, request, reply) {
		const payload = request.payload;
		let emailID = null;

		if (payload.email !== undefined) {
			emailID = validateEmail(payload.email);

			if (emailID === undefined) {
				return reply({status: false}).code(400);
			}
		}

		const userUpdates = {
			mobile_no: payload.phoneNo,
			location: payload.location,
			longitude: payload.longitude,
			latitude: payload.latitude,
			os_type_id: payload.osTypeId,
			gcm_id: payload.gcmId,
			device_id: payload.deviceId,
			device_model: payload.deviceModel,
			apk_version: payload.apkVersion,
			fullname: payload.name,
			is_enrolled_professional: payload.isEnrolled,
			professional_category_id: payload.categoryId,
			share_mobile: payload.isPhoneAllowed,
			share_email: payload.isEmailAllowed,
			professional_description: payload.description,
			updated_by_user_id: user.ID,
			email_secret: payload.email !== payload.oldEmail ? uuid.v4() : undefined
		};

		if (emailID !== null) {
			userUpdates.email_id = emailID;
		}

		return this.modals.table_users.update(userUpdates, {
			where: {
				ID: user.ID
			}
		}).then(() => {
			if (payload.email) {
				this.modals.table_users.findOne({
					where: {
						status_id: {
							$ne: 3
						},
						ID: user.ID
					},
					attributes: {
						exclude: ['UserTypeID']
					}
				}).then((result) => {
					// console.log("EMAIL: ", payload.email);
					const updatedUser = result.toJSON();
					if (!updatedUser.email_verified) {
						NotificationAdaptor.sendVerificationMail(payload.email, updatedUser);
					} else if (updatedUser.email_id !== payload.oldEmail) {
						updatedUser.email_secret = uuid.v4();
						result.updateAttributes({
							email_verified: 0,
							email_secret: updatedUser.email_secret
						});
						NotificationAdaptor.sendVerificationMail(payload.email, updatedUser);
					}
				});
			}

			reply({
				status: true,
				message: 'User Details Updated Successfully',
				forceUpdate: request.pre.forceUpdate
			}).code(200);
		}).catch(err => reply({
			status: false,
			message: 'User Detail Update failed',
			err,
			forceUpdate: request.pre.forceUpdate
		}));
	}
}

module.exports = UserAdaptor;
