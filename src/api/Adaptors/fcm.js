class fcmManager {
  constructor(fcmModal) {
    this.fcmModal = fcmModal;
  }

  insertFcmDetails(userId, fcmId, platformId) {
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

  deleteFcmDetails(userId, fcmId) {
    return this.fcmModal.destroy({
      where: {
        user_id: userId,
        fcm_id: fcmId,
      },
    }).then((rows) => {
      return rows;
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${userId} is as follow: \n \n ${err}`);
    });
  }
}

export default fcmManager;