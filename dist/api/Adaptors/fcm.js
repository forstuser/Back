'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var fcmManager = function() {
  function fcmManager(fcmModal) {
    _classCallCheck(this, fcmManager);

    this.fcmModal = fcmModal;
  }

  _createClass(fcmManager, [
    {
      key: 'insertFcmDetails',
      value: function insertFcmDetails(userId, fcmId, platformId) {
        if (!fcmId || fcmId === '') {
          return Promise.resolve('NULL FCMID');
        }
        var defaults = {
          user_id: userId,
          fcm_id: fcmId,
        };

        if (platformId) {
          defaults.platform_id = platformId;
        }

        return this.fcmModal.findCreateFind({
          where: defaults,
          defaults: defaults,
        }).then(function(data) {
          return data;
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' + userId +
              ' is as follow: \n \n ' + err);
        });
      },
    }, {
      key: 'deleteFcmDetails',
      value: function deleteFcmDetails(userId, fcmId) {
        return this.fcmModal.destroy({
          where: {
            user_id: userId,
            fcm_id: fcmId,
          },
        }).then(function(rows) {
          return rows;
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' + userId +
              ' is as follow: \n \n ' + err);
        });
      },
    }]);

  return fcmManager;
}();

exports.default = fcmManager;