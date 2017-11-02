class fcmManager {
  constructor(fcmModal) {
    this.fcmModal = fcmModal;
  }

  insertFcmDetails(userId, fcmId) {
    if (!fcmId || fcmId === '') {
      return Promise.resolve('NULL FCMID');
    }
    return this.fcmModal.create({
      user_id: userId,
      fcm_id: fcmId,
    }).then((data) => {
      return data;
    }).catch((err) => {
      console.log({API_Logs: err});
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
      console.log({API_Logs: err});
    });
  }
}

export default fcmManager;