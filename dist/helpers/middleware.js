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

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _password = require('./password');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let MODAL;


const checkAppVersion = async (request, reply) => {
  if (request.headers.app_version !== undefined || request.headers.ios_app_version !== undefined) {
    const appVersion = request.headers.ios_app_version || request.headers.app_version;
    const currentAppVersion = !isNaN(parseInt(appVersion)) ? parseInt(appVersion) : null;

    const appVersionDetail = request.headers.ios_app_version ? _main2.default.IOS : _main2.default.ANDROID;
    if (appVersionDetail && currentAppVersion) {
      const FORCE_VERSION = appVersionDetail.FORCE_VERSION;
      const RECOMMENDED_VERSION = appVersionDetail.RECOMMENDED_VERSION;

      console.log(`FORCE APP VERSION = ${FORCE_VERSION}`);
      console.log(`RECOMMENDED APP VERSION = ${RECOMMENDED_VERSION}`);

      return currentAppVersion < FORCE_VERSION ? true : currentAppVersion >= FORCE_VERSION && currentAppVersion < RECOMMENDED_VERSION ? false : null;
    }
    return null;
  }
  console.log('App Version not in Headers');
  return null;
};

const updateUserActiveStatus = async (request, reply) => {
  const user = _shared2.default.verifyAuthorization(request.headers);
  const supportedLanguages = _main2.default.SUPPORTED_LANGUAGES.split(',');
  const language = (request.headers.language || '').split('-')[0];
  request.language = supportedLanguages.indexOf(language) >= 0 ? language : '';
  if (!user) {
    return null;
  }
  try {
    const id = user.id || user.ID;
    const userResult = await retrieveUser(id);
    const userDetail = userResult ? userResult.toJSON() : userResult;
    request.user = userDetail || user;
    const { url, headers } = request;
    const { ios_app_version: ios_version } = headers;
    const { pathname } = url;
    const excludedPaths = ['/consumer/otp/send', '/consumer/otp/validate', '/consumer/validate', '/consumer/pin', '/consumer/pin/reset', '/consumer/subscribe'];
    console.log(`Last route ${pathname} accessed by user id ${id} from ${ios_version ? 'iOS' : 'android'}`);
    if (userDetail) {
      const last_active_date = _moment2.default.utc(userDetail.last_active_date, _moment2.default.ISO_8601);
      const timeDiffMin = _moment2.default.duration(_moment2.default.utc().diff(last_active_date)).asMinutes();

      console.log('\n\n\n\n\n', { timeDiffMin, last_active_date });
      if (userDetail.password && timeDiffMin <= 10 || !userDetail.password || excludedPaths.includes(pathname)) {
        const item = await _bluebird2.default.all([userResult.updateAttributes({
          last_active_date: _moment2.default.utc(),
          last_api: request.url.pathname
        })]);
        MODAL.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 1, user_id: id,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers
          })
        });
        console.log(`User updated detail is as follow ${JSON.stringify(item[0])}`);
        return true;
      }

      console.log(`User ${user.mobile_no} inactive for more than 10 minutes`);
      return 0;
    }

    console.log(`User ${user.mobile_no} doesn't exist`);
    return null;
  } catch (err) {
    console.log(`Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
    return false;
  }
};

const hasMultipleAccounts = async (request, reply) => {
  const user = _shared2.default.verifyAuthorization(request.headers);
  if (!user) {
    return false;
  }

  try {
    const userCounts = await MODAL.users.count({
      where: {
        $or: {
          id: user.id || user.ID,
          mobile_no: request.payload.mobile_no
        }
      }
    });

    return userCounts > 1;
  } catch (err) {
    console.log(`Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
    return false;
  }
};

const hasSellerMultipleAccounts = async (request, reply) => {
  const { mobile_no, email } = request.payload || {};
  try {
    const userCounts = await MODAL.seller_users.count(JSON.parse(JSON.stringify({ where: { $or: { mobile_no, email } } })));

    return userCounts > 1;
  } catch (err) {
    console.log(`Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
    return false;
  }
};

const updateUserPIN = async (request, reply) => {
  const user = _shared2.default.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  }
  try {
    request.hashedPassword = await _bluebird2.default.try(() => (0, _password.hashPassword)(request.payload.pin));

    const id = user.id || user.ID;
    const userResult = await retrieveUser(id);
    if (userResult) {
      console.log(`Last route ${request.url.pathname} accessed by user id ${id} from ${request.headers.ios_app_version ? 'iOS' : 'android'}`);
      request.user = userResult;
      const currentUser = request.user.toJSON();
      console.log(currentUser);
      if (request.payload.old_pin) {
        return await _bluebird2.default.try(() => (0, _password.comparePasswords)(request.payload.old_pin, currentUser.password));
      }

      return true;
    }

    return false;
  } catch (err) {
    console.log(`Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
    return false;
  }
};

const verifyUserPIN = async (request, reply) => {
  const user = _shared2.default.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  }
  try {
    request.hashedPassword = await _bluebird2.default.try(() => (0, _password.hashPassword)(request.payload.pin));
    const id = user.id || user.ID;
    const userResult = await retrieveUser(id);
    if (userResult) {
      console.log(`Last route ${request.url.pathname} accessed by user id ${id} from ${request.headers.ios_app_version ? 'iOS' : 'android'}`);
      request.user = userResult;
      const currentUser = request.user.toJSON();
      console.log(currentUser);
      if (!currentUser.password) {
        return true;
      } else if (request.payload.old_pin) {
        return await _bluebird2.default.try(() => (0, _password.comparePasswords)(request.payload.old_pin, currentUser.password));
      }

      return await _bluebird2.default.try(() => (0, _password.comparePasswords)(request.payload.pin, currentUser.password));
    }

    return false;
  } catch (err) {
    console.log(`Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
    return false;
  }
};

async function retrieveUser(id) {
  return await MODAL.users.findOne({ where: { id } });
}

const verifyUserOTP = async (request, reply) => {
  const user = _shared2.default.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  }
  try {
    const id = user.id || user.ID;
    const userResult = await retrieveUser(id);
    if (userResult) {
      console.log(`Last route ${request.url.pathname} accessed by user id ${user.id || user.ID} from ${request.headers.ios_app_version ? 'iOS' : 'android'}`);
      request.user = userResult;
      const currentUser = request.user.toJSON();
      console.log(currentUser);
      if (currentUser.email_secret) {
        console.log(currentUser.otp_created_at);
        const timeDiffMin = _moment2.default.duration(_moment2.default.utc().diff((0, _moment2.default)(currentUser.otp_created_at))).asMinutes();
        console.log(timeDiffMin);
        if (timeDiffMin > 5) {
          return null;
        }
        return await _bluebird2.default.try(() => (0, _password.comparePasswords)(request.payload.token, currentUser.email_secret));
      }
    }

    return false;
  } catch (err) {
    console.log(`Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
    return false;
  }
};

function isValidEmail(emailAddress) {
  const pattern = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  return pattern.test(emailAddress);
}

const verifyUserEmail = async (request, reply) => {
  const user = _shared2.default.verifyAuthorization(request.headers);
  if (user) {

    if (request.payload.email) {
      if (!isValidEmail(request.payload.email.toLowerCase())) {
        return false;
      }
      try {
        const userCounts = await MODAL.users.count({
          where: {
            $or: {
              id: user.id || user.ID,
              email: { $iLike: request.payload.email }
            }
          }
        });
        if (userCounts <= 1) {
          const userResult = await MODAL.users.findOne({
            where: { id: user.id || user.ID }
          });
          const userDetail = userResult ? userResult.toJSON() : userResult;
          console.log(`Last route ${request.url.pathname} accessed by user id ${user.id || user.ID} from ${request.headers.ios_app_version ? 'iOS' : 'android'}`);
          if (userDetail) {
            request.user = userDetail;
            if (userDetail.email_verified) {
              return (userDetail.email || '').toLowerCase() === (request.payload.email || '').toLowerCase();
            } else {
              await userResult.updateAttributes({ email: request.payload.email });
              return true;
            }
          } else {
            console.log(`User ${user.email} is invalid.`);
            return false;
          }
        } else {
          console.log(`User with ${request.params.email} already exist.`);
          return null;
        }
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return false;
      }
    }

    return true;
  }

  return null;
};

const checkForAppUpdate = async (request, reply) => {
  if (request.headers.app_version !== undefined || request.headers.ios_app_version !== undefined) {
    const id = request.headers.ios_app_version ? 2 : 1;
    const result = await MODAL.appVersion.findOne({
      where: { id }, order: [['updatedAt', 'DESC']],
      attributes: [['recommended_version', 'recommendedVersion'], ['force_version', 'forceVersion'], ['details', 'updateDetails']]
    });
    console.log(result);
    return result;
  } else {
    console.log('App Version not in Headers');
    return null;
  }
};

exports.default = models => {
  MODAL = models;
  return {
    checkAppVersion, updateUserActiveStatus,
    verifyUserPIN, updateUserPIN,
    hasMultipleAccounts, verifyUserEmail,
    verifyUserOTP, hasSellerMultipleAccounts,
    checkForAppUpdate
  };
};