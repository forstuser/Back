'use strict';
let MODAL;
import shared from './shared';
import moment from 'moment';
import config from '../config/main';
import Promise from 'bluebird';
import {comparePasswords, hashPassword} from './password';

const checkAppVersion = (request, reply) => {
  if (request.headers.app_version !== undefined ||
      request.headers.ios_app_version !== undefined) {
    const appVersion = request.headers.ios_app_version ||
        request.headers.app_version;
    const id = request.headers.ios_app_version ? 2 : 1;
    const currentAppVersion = (!isNaN(parseInt(appVersion)) ?
        parseInt(appVersion) :
        null);
    console.log(`CURRENT APP VERSION = ${currentAppVersion}`);

    return MODAL.appVersion.findOne({
      where: {
        id,
      },
      order: [['updatedAt', 'DESC']],
      attributes: [
        [
          'recommended_version',
          'recommendedVersion'],
        [
          'force_version',
          'forceVersion']],
    }).then((results) => {
      if (results && currentAppVersion) {
        const FORCE_VERSION = results.dataValues.forceVersion;
        const RECOMMENDED_VERSION = results.dataValues.recommendedVersion;

        console.log(`FORCE APP VERSION = ${FORCE_VERSION}`);
        console.log(`RECOMMENDED APP VERSION = ${RECOMMENDED_VERSION}`);

        if (currentAppVersion < FORCE_VERSION) {
          console.log('current < force');
          return true;
        } else if (currentAppVersion >= FORCE_VERSION &&
            currentAppVersion < RECOMMENDED_VERSION) {
          console.log('force < current < recommended');
          return false;
        } else {
          return null;
        }
      } else {
        return null;
      }
    });
  } else {
    console.log('App Version not in Headers');
    return null;
  }
};

const updateUserActiveStatus = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  const supportedLanguages = config.SUPPORTED_LANGUAGES.split(',');
  const language = (request.headers.language || '').split('-')[0];
  request.language = supportedLanguages.indexOf(language) >= 0 ? language : '';
  if (!user) {
    return null;
  } else {
    return MODAL.users.findOne({
      where: {
        id: user.id || user.ID,
      },
    }).then((userResult) => {
      const userDetail = userResult ? userResult.toJSON() : userResult;
      request.user = userDetail || user;
      console.log(
          `Last route ${request.url.pathname} accessed by user id ${user.id ||
          user.ID} from ${request.headers.ios_app_version ?
              'iOS' :
              'android'}`);
      if (userDetail) {
        const last_active_date = moment.utc(userDetail.last_active_date,
            moment.ISO_8601);
        const timeDiffMin = moment.duration(
            moment.utc().diff(last_active_date)).asMinutes();

        console.log('\n\n\n\n\n', {timeDiffMin, last_active_date});
        if ((userDetail.password && timeDiffMin <= 10) ||
            !userDetail.password ||
            (request.url.pathname === '/consumer/otp/send' ||
                request.url.pathname === '/consumer/otp/validate' ||
                request.url.pathname === '/consumer/validate' ||
                request.url.pathname === '/consumer/pin' ||
                request.url.pathname === '/consumer/pin/reset' ||
                request.url.pathname === '/consumer/subscribe')) {
          return Promise.all([
            MODAL.users.update({
              last_active_date: moment.utc(),
              last_api: request.url.pathname,
            }, {
              where: {
                id: user.id || user.ID,
              },
            }),
            MODAL.logs.create({
              api_action: request.method,
              api_path: request.url.pathname,
              log_type: 1,
              user_id: user.id || user.ID,
              log_content: JSON.stringify({
                params: request.params,
                query: request.query,
                headers: request.headers,
              }),
            })]).then((item) => {
            console.log(
                `User updated detail is as follow ${JSON.stringify(item[0])}`);
            return true;
          }).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
            return MODAL.logs.create({
              api_action: request.method,
              api_path: request.url.pathname,
              log_type: 2,
              user_id: user.id || user.ID,
              log_content: JSON.stringify({err}),
            }).then(() => false);
          });
        } else {
          console.log(
              `User ${user.mobile_no} inactive for more than 10 minutes`);
          return 0;
        }
      } else {
        console.log(`User ${user.mobile_no} doesn't exist`);
        return null;
      }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
      return false;
    });
  }
};

const hasMultipleAccounts = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return false;
  } else {
    return Promise.try(() => {
      return MODAL.users.count({
        where: {
          $or: {
            id: user.id || user.ID,
            mobile_no: request.payload.mobile_no,
          },
        },
      });
    }).then((userCounts) => {
      if (userCounts > 1) {
        return true;
      }
      return false;
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
      return false;
    });
  }
};

const updateUserPIN = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  }
  return Promise.try(() => hashPassword(request.payload.pin)).
      then((hashedPassword) => {
        request.hashedPassword = hashedPassword;
        return MODAL.users.findOne({
          where: {
            id: user.id || user.ID,
          },
        });
      }).
      then((userResult) => {
        if (userResult) {
          console.log(
              `Last route ${request.url.pathname} accessed by user id ${user.id ||
              user.ID} from ${request.headers.ios_app_version ?
                  'iOS' :
                  'android'}`);
          request.user = userResult;
          const currentUser = request.user.toJSON();
          console.log(currentUser);
          if (request.payload.old_pin) {
            return comparePasswords(request.payload.old_pin,
                currentUser.password);
          }

          return true;
        }

        return false;
      }).
      then((pinResult) => {
        return pinResult ? true : false;
      }).
      catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
        return false;
      });
};

const verifyUserPIN = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  }
  return Promise.try(() => hashPassword(request.payload.pin)).
      then((hashedPassword) => {
        request.hashedPassword = hashedPassword;
        return MODAL.users.findOne({
          where: {
            id: user.id || user.ID,
          },
        });
      }).
      then((userResult) => {
        if (userResult) {
          console.log(
              `Last route ${request.url.pathname} accessed by user id ${user.id ||
              user.ID} from ${request.headers.ios_app_version ?
                  'iOS' :
                  'android'}`);
          request.user = userResult;
          const currentUser = request.user.toJSON();
          console.log(currentUser);
          if (!currentUser.password) {
            return true;
          } else if (request.payload.old_pin) {
            return comparePasswords(request.payload.old_pin,
                currentUser.password);
          }

          return comparePasswords(request.payload.pin, currentUser.password);
        }

        return false;
      }).
      then((pinResult) => {
        return pinResult ? true : false;
      }).
      catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
        return false;
      });
};

const verifyUserOTP = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  }
  return Promise.try(() => MODAL.users.findOne({
    where: {
      id: user.id || user.ID,
    },
  })).then((userResult) => {
    if (userResult) {
      console.log(
          `Last route ${request.url.pathname} accessed by user id ${user.id ||
          user.ID} from ${request.headers.ios_app_version ?
              'iOS' :
              'android'}`);
      request.user = userResult;
      const currentUser = request.user.toJSON();
      console.log(currentUser);
      if (currentUser.email_secret) {
        console.log(currentUser.otp_created_at);
        const timeDiffMin = moment.duration(
            moment.utc().diff(moment(currentUser.otp_created_at))).asMinutes();
        console.log(timeDiffMin);
        if (timeDiffMin > 5) {
          return null;
        }
        return comparePasswords(request.payload.token,
            currentUser.email_secret);
      }
    }

    return false;
  }).then((pinResult) => pinResult).catch((err) => {
    console.log(
        `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
    return false;
  });
};

function isValidEmail(emailAddress) {
  const pattern = new RegExp(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  return pattern.test(emailAddress);
}

const verifyUserEmail = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return null;
  } else {

    if (request.payload.email) {
      if (!isValidEmail(request.payload.email.toLowerCase())) {
        return false;
      }
      return Promise.try(() => MODAL.users.count({
        where: {
          $or: {
            id: user.id || user.ID,
            email: {
              $iLike: request.payload.email,
            },
          },
        },
      })).then((userCounts) => {
        if (userCounts <= 1) {
          return MODAL.users.findOne({
            where: {
              id: user.id || user.ID,
            },
          }).then((userResult) => {
            const userDetail = userResult ? userResult.toJSON() : userResult;
            console.log(
                `Last route ${request.url.pathname} accessed by user id ${user.id ||
                user.ID} from ${request.headers.ios_app_version ?
                    'iOS' :
                    'android'}`);
            if (userDetail) {
              request.user = userDetail;
              if (userDetail.email_verified) {
                return (userDetail.email || '').toLowerCase() ===
                    (request.payload.email || '').toLowerCase();
              } else {
                userResult.updateAttributes({email: request.payload.email});
                return true;
              }
            } else {
              console.log(`User ${user.email} is invalid.`);
              return false;
            }
          });
        } else {
          console.log(
              `User with ${request.params.email} already exist.`);
          return null;
        }
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return false;
      });
    }

    return true;
  }
};

const checkForAppUpdate = (request, reply) => {
  if (request.headers.app_version !== undefined ||
      request.headers.ios_app_version !== undefined) {
    const id = request.headers.ios_app_version ? 2 : 1;

    MODAL.appVersion.findOne({
      where: {
        id,
      },
      order: [['updatedAt', 'DESC']],
      attributes: [
        [
          'recommended_version',
          'recommendedVersion'],
        [
          'force_version',
          'forceVersion'],
        [
          'details',
          'updateDetails']],
    }).then((result) => {
      console.log(result);
      return result;
    });
  } else {
    console.log('App Version not in Headers');
    return null;
  }
};

export default (models) => {
  MODAL = models;
  return {
    checkAppVersion,
    updateUserActiveStatus,
    verifyUserPIN,
    updateUserPIN,
    hasMultipleAccounts,
    verifyUserEmail,
    verifyUserOTP,
    checkForAppUpdate,
  };
};