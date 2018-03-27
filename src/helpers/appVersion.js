/*jshint esversion: 6 */
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
          'forceVersion']],
    }).then((results) => {
      if (results && currentAppVersion) {
        const FORCE_VERSION = results.dataValues.forceVersion;
        const RECOMMENDED_VERSION = results.dataValues.recommendedVersion;

        console.log(`FORCE APP VERSION = ${FORCE_VERSION}`);
        console.log(`RECOMMENDED APP VERSION = ${RECOMMENDED_VERSION}`);

        if (currentAppVersion < FORCE_VERSION) {
          console.log('current < force');
          return reply(true);
        } else if (currentAppVersion >= FORCE_VERSION &&
            currentAppVersion < RECOMMENDED_VERSION) {
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

const updateUserActiveStatus = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  const supportedLanguages = config.SUPPORTED_LANGUAGES.split(',');
  const language = (request.headers.language || '').split('-')[0];
  request.language = supportedLanguages.indexOf(language) >= 0 ? language : '';
  if (!user) {
    return reply(null);
  } else {
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
        const last_active_date = moment.utc(userDetail.last_active_date,
            moment.ISO_8601);
          return Promise.all([
            MODAL.users.update({
              last_active_date: moment.utc(),
              last_api: request.url.pathname,
            }, {
              where: {
                id: user.id || user.ID,
              },
            }), MODAL.logs.create({
              api_action: request.method,
              api_path: request.url.pathname,
              log_type: 1,
              user_id: user.id || user.ID,
            })]).then((item) => {
            console.log(
                `User updated detail is as follow ${JSON.stringify(item[0])}`);
            return reply(true);
          }).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
            MODAL.logs.create({
              api_action: request.method,
              api_path: request.url.pathname,
              log_type: 2,
              user_id: user.id || user.ID,
              log_content: err,
            });
            return reply(false);
          });
        } else {
          console.log(
              `User ${user.mobile_no} inactive for more than 10 minutes`);
          return reply('');
        }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
      return reply(false);
    });
  }
};

const hasMultipleAccounts = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return reply(false);
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
        return reply(true);
      }

      return reply(false);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
      return reply(false);
    });
  }
};

const updateUserPIN = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return reply(null);
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
        return pinResult ? reply(true) : reply(false);
      }).
      catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
        return reply(false);
      });
};

const verifyUserPIN = (request, reply) => {
  const user = shared.verifyAuthorization(request.headers);
  if (!user) {
    return reply(null);
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
        return pinResult ? reply(true) : reply(false);
      }).
      catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${request.payload.mobile_no} is as follow: \n \n ${err}`);
        return reply(false);
      });
};

export default (models) => {
  MODAL = models;
  return {
    checkAppVersion,
    updateUserActiveStatus,
    verifyUserPIN,
    updateUserPIN,
    hasMultipleAccounts,
  };
};