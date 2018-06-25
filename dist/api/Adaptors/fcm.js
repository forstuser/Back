'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
class FCMManager {
  constructor(fcmModal) {
    this.fcmModal = fcmModal;
  }

  async insertFcmDetails(parameters) {
    let { userId, fcmId, platformId, selected_language } = parameters;
    if (!fcmId || fcmId === '') {
      return await Promise.resolve('NULL FCM ID');
    }
    const defaults = {
      user_id: userId,
      fcm_id: fcmId,
      platform_id: 1
    };

    const where = {
      user_id: userId,
      platform_id: 1
    };

    if (platformId) {
      defaults.platform_id = platformId;
      where.platform_id = platformId;
    }

    const data = await Promise.all([this.fcmModal.destroy({ where: { user_id: { $not: userId }, fcm_id: fcmId } }), this.fcmModal.findCreateFind({ where, defaults })]);
    const fcmDetail = data[1][0].toJSON();
    selected_language = selected_language || fcmDetail.selected_language || 'en';
    data[1][0].updateAttributes({
      selected_language,
      fcm_id: fcmId
    });
    return data;
  }

  async deleteFcmDetails(parameters) {
    let { user_id, fcm_id, platform_id } = parameters;
    return await this.fcmModal.destroy({
      where: {
        user_id,
        fcm_id,
        platform_id
      }
    });
  }
}

exports.default = FCMManager;