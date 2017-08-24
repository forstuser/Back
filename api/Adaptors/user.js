class UserAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveUserProfile(user) {
    return this.modals.table_users.findById(user.ID, {
      attributes: [['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified']],
      include: [{
        model: this.modals.userImages, as: 'userImages', attributes: [[this.modals.sequelize.fn('CONCAT', 'consumer/', this.modals.sequelize.col('user_image_id'), '/images'), 'imageUrl']]
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
      userProfile: result
    })).catch(err => ({
      status: false,
      message: 'User Data Retrieval Failed',
      err
    }));
  }

  updateUser(user, payload, reply) {
    return this.modals.table_users.update({
      mobile_no: payload.phoneNo || user.phoneNo,
      location: payload.location || user.location,
      longitude: payload.longitude || user.longitude,
      latitude: payload.latitude || user.latitude,
      os_type_id: payload.osTypeId || user.osTypeId,
      gcm_id: payload.gcmId || user.gcmId,
      email_id: payload.email || user.email,
      device_id: payload.deviceId || user.deviceId,
      device_model: payload.deviceModel || user.deviceModel,
      apk_version: payload.apkVersion || user.apkVersion,
      fullname: payload.name || user.name,
      is_enrolled_professional: payload.isEnrolled || user.isEnrolled,
      professional_category_id: payload.categoryId || user.categoryId,
      share_mobile: payload.isPhoneAllowed || user.isPhoneAllowed,
      share_email: payload.isEmailAllowed || user.isEmailAllowed,
      updated_by_user_id: user.ID
    }, {
      where: {
        ID: user.ID
      }
    }).then(reply({
      status: true,
      message: 'User Details Updated Successfully'
    }).code(204)).catch(err => reply({
      status: false,
      message: 'User Detail Update failed',
      err
    }));
  }
}

module.exports = UserAdaptor;
