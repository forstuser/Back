class FCMManager {
  constructor(fcmModal) {
    this.fcmModal = fcmModal;
  }

  insertFcmDetails(parameters) {
    let {userId, fcmId, platformId} = parameters;
    if (!fcmId || fcmId === '') {
      return Promise.resolve('NULL FCMID');
    }
    const defaults = {
      user_id: userId,
      fcm_id: fcmId,
    };

    if (platformId) {
      defaults.platform_id = platformId;
    }

    return this.fcmModal.findCreateFind({
      where: defaults,
      defaults,
    }).then((data) => {
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