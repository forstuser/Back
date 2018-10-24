class FCMManager {
  constructor(fcmModal) {
    this.fcmModal = fcmModal;
  }

  async insertFcmDetails(parameters) {
    let {userId, fcmId, platformId, selected_language} = parameters;
    if (!fcmId || fcmId === '') {
      return await Promise.resolve('NULL FCM ID');
    }
    const defaults = {user_id: userId, fcm_id: fcmId, platform_id: 1};

    const where = {user_id: userId, platform_id: 1};

    if (platformId) {
      defaults.platform_id = platformId;
      where.platform_id = platformId;
    }

    const [, fcm_details] = await Promise.all([
      this.fcmModal.destroy(
          {where: {user_id: {$not: userId}, fcm_id: fcmId}}),
      this.findOrUpdateFCMDetails(where, defaults, selected_language)]);
    return fcm_details;
  }

  async insertSellerFcmDetails(parameters) {
    let {seller_user_id, fcm_id, platform_id, selected_language} = parameters;
    if (!fcm_id || fcm_id === '') {
      return await Promise.resolve('NULL FCM ID');
    }
    const defaults = {seller_user_id, fcm_id, platform_id};

    const where = {seller_user_id, platform_id};

    if (platform_id) {
      defaults.platform_id = platform_id;
      where.platform_id = platform_id;
    }

    const [, fcm_details] = await Promise.all([
      this.fcmModal.destroy(
          {where: {seller_user_id: {$not: seller_user_id}, fcm_id: fcm_id}}),
      this.findOrUpdateFCMDetails(where, defaults, selected_language)]);
    return fcm_details;
  }

  async deleteFcmDetails(parameters) {
    let {user_id, fcm_id, platform_id} = parameters;
    return await this.fcmModal.destroy({
      where: {
        user_id,
        fcm_id,
        platform_id,
      },
    });
  }

  async updateFcmDetails(parameters) {
    let {user_id, fcm_id, platform_id} = parameters;
    return await this.fcmModal.update({fcm_id: null}, {
      where: {user_id, fcm_id, platform_id},
    });
  }

  async findOrUpdateFCMDetails(where, defaults, selected_language) {
    let fcm_details = await this.fcmModal.findOne({where});
    const fcm_detail = fcm_details ? fcm_details.toJSON() : undefined;
    defaults.selected_language = selected_language ? selected_language :
        fcm_detail ? fcm_detail.selected_language : 'en';
    if (fcm_details) {
      await fcm_details.updateAttributes(defaults);
    } else {
      fcm_details = await this.fcmModal.create(defaults);
    }

    return fcm_details.toJSON();
  }
}

export default FCMManager;