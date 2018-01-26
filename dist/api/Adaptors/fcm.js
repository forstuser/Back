'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FCMManager = function() {
  function FCMManager(fcmModal) {
    _classCallCheck(this, FCMManager);

    this.fcmModal = fcmModal;
  }

  _createClass(FCMManager, [
    {
    key: 'insertFcmDetails',
      value: function insertFcmDetails(parameters) {
        var userId = parameters.userId,
            fcmId = parameters.fcmId,
            platformId = parameters.platformId;

      if (!fcmId || fcmId === '') {
        return Promise.resolve('NULL FCMID');
      }
      var defaults = {
        user_id: userId,
        fcm_id: fcmId
      };

      if (platformId) {
        defaults.platform_id = platformId;
      }

      return this.fcmModal.findCreateFind({
        where: defaults,
        defaults: defaults
      }).then(function (data) {
        return data;
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + userId + ' is as follow: \n \n ' + err);
      });
    }
  }, {
    key: 'deleteFcmDetails',
      value: function deleteFcmDetails(parameters) {
        var user_id = parameters.user_id,
            fcm_id = parameters.fcm_id,
            platform_id = parameters.platform_id;

      return this.fcmModal.destroy({
        where: {
          user_id: user_id,
          fcm_id: fcm_id,
          platform_id: platform_id,
        }
      }).then(function (rows) {
        return rows;
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + userId + ' is as follow: \n \n ' + err);
      });
    }
  }]);

  return FCMManager;
}();

exports.default = FCMManager;