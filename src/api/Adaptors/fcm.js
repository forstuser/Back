class FCMManager {
  constructor(fcmModal) {
    this.fcmModal = fcmModal;
  }

  insertFcmDetails(parameters) {
    let {userId, fcmId, platformId, selected_language} = parameters;
    if (!fcmId || fcmId === '') {
      return Promise.resolve('NULL FCM ID');
    }
    const defaults = {
      user_id: userId,
      fcm_id: fcmId,
      platform_id: 1,
    };

    const where = {
      user_id: userId,
      platform_id: 1,
    };

    if (platformId) {
      defaults.platform_id = platformId;
      where.platform_id = platformId;
    }

    return Promise.all([
      this.fcmModal.destroy({
        where: {
          user_id: {
            $not: userId,
          },
          fcm_id: fcmId,
        },
      }), this.fcmModal.findCreateFind({
        where,
        defaults,
      })]).then((data) => {
      const fcmDetail = data[1][0].toJSON();
      selected_language = selected_language || fcmDetail.selected_language ||
          'en';
      data[1][0].updateAttributes({
        selected_language,
        fcm_id: fcmId,
      });
      return data;
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${userId} is as follow: \n \n ${err}`);
    });
  }

  deleteFcmDetails(parameters) {
    let {user_id, fcm_id, platform_id} = parameters;
    return this.fcmModal.destroy({
      where: {
        user_id,
        fcm_id,
        platform_id,
      },
    }).then((rows) => {
      return rows;
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${userId} is as follow: \n \n ${err}`);
    });
  }
}

export default FCMManager;