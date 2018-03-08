/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('./shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _main = require('../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODAL = void 0;


var checkAppVersion = function checkAppVersion(request, reply) {
  if (request.headers.app_version !== undefined || request.headers.ios_app_version !== undefined) {
    var appVersion = request.headers.ios_app_version || request.headers.app_version;
    var id = request.headers.ios_app_version ? 2 : 1;
    var currentAppVersion = !isNaN(parseInt(appVersion)) ? parseInt(appVersion) : null;
    console.log('CURRENT APP VERSION = ' + currentAppVersion);

    MODAL.appVersion.findOne({
      where: {
        id: id
      },
      order: [['updatedAt', 'DESC']],
      attributes: [['recommended_version', 'recommendedVersion'], ['force_version', 'forceVersion']]
    }).then(function (results) {
      if (results && currentAppVersion) {
        var FORCE_VERSION = results.dataValues.forceVersion;
        var RECOMMENDED_VERSION = results.dataValues.recommendedVersion;

        console.log('FORCE APP VERSION = ' + FORCE_VERSION);
        console.log('RECOMMENDED APP VERSION = ' + RECOMMENDED_VERSION);

        if (currentAppVersion < FORCE_VERSION) {
          console.log('current < force');
          return reply(true);
        } else if (currentAppVersion >= FORCE_VERSION && currentAppVersion < RECOMMENDED_VERSION) {
          console.log('force < current < recommended');
          return reply(false);
        } else {
          return reply(null);
        }
      } else {
        return reply(null);
      }
    });
  } else {
    console.log('App Version not in Headers');
    return reply(null);
  }
};

var updateUserActiveStatus = function updateUserActiveStatus(request, reply) {
  var user = _shared2.default.verifyAuthorization(request.headers);
  var supportedLanguages = _main2.default.SUPPORTED_LANGUAGES.split(',');
  var language = (request.headers.language || '').split('-')[0];
  request.language = supportedLanguages.indexOf(language) >= 0 ? language : '';
  if (!user) {
    return reply(null);
  } else {
    return MODAL.users.findOne({
      where: {
        id: user.id || user.ID
      }
    }).then(function (userResult) {
      var userDetail = userResult ? userResult.toJSON() : userResult;
      console.log('Last route ' + request.url.pathname + ' accessed by user id ' + (user.id || user.ID) + ' from ' + (request.headers.ios_app_version ? 'iOS' : 'android'));
      if (userDetail) {
        return Promise.all([MODAL.users.update({
          last_active_date: _moment2.default.utc(),
          last_api: request.url.pathname
        }, {
          where: {
            id: user.id || user.ID
          }
        }), MODAL.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 1,
          user_id: user.id || user.ID
        })]).then(function (item) {
          console.log('User updated detail is as follow ' + JSON.stringify(item[0]));
          return reply(true);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + user.mobile_no + ' is as follow: \n \n ' + err);
          MODAL.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: err
          });
          return reply(false);
        });
      } else {
        console.log('User ' + user.mobile_no + ' doesn\'t exist');
        return reply(null);
      }
    }).catch(function (err) {
      console.log('Error on ' + new Date() + ' for user ' + user.mobile_no + ' is as follow: \n \n ' + err);
      return reply(false);
    });
  }
};

exports.default = function (models) {
  MODAL = models;
  return {
    checkAppVersion: checkAppVersion,
    updateUserActiveStatus: updateUserActiveStatus
  };
};