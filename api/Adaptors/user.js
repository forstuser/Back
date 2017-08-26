class UserAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveUserProfile(user) {
    return this.modals.table_users.findById(user.ID, {
      attributes: [['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'], ['professional_description', 'description']],
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
      mobile_no: payload.phoneNo,
      location: payload.location,
      longitude: payload.longitude,
      latitude: payload.latitude,
      os_type_id: payload.osTypeId,
      gcm_id: payload.gcmId,
      email_id: payload.email,
      device_id: payload.deviceId,
      device_model: payload.deviceModel,
      apk_version: payload.apkVersion,
      fullname: payload.name,
      is_enrolled_professional: payload.isEnrolled,
      professional_category_id: payload.categoryId,
      share_mobile: payload.isPhoneAllowed,
      share_email: payload.isEmailAllowed,
      professional_description: payload.description,
      updated_by_user_id: user.ID
    }, {
      where: {
        ID: user.ID
      }
    }).then(reply({
      status: true,
      message: 'User Details Updated Successfully'
    }).code(200)).catch(err => reply({
      status: false,
      message: 'User Detail Update failed',
      err
    }));
  }
}

module.exports = UserAdaptor;
