/*jshint esversion: 6 */
'use strict';
let MODAL;
import shared from './shared';
import moment from 'moment';

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
  if (!user) {
    return reply(null);
  } else {
    console.log(request);
    return MODAL.users.findOne({
      where: {
        id: user.id || user.ID,
      },
    }).then((userResult) => {
      const userDetail = userResult ? userResult.toJSON() : userResult;
      if (userDetail) {
        return MODAL.users.update({
          last_active_date: moment(),
          last_api: request.url.pathname,
        }, {
          where: {
            id: user.id || user.ID,
          },
        }).then((item) => {
          return reply(true);
        });
      } else {
        console.log(`User ${user.mobile_no} doesn't exist`);
        return reply(null);
      }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
      return reply(false);
    });
  }
};

export default (models) => {
  MODAL = models;
  return {
    checkAppVersion,
    updateUserActiveStatus,
  };
};