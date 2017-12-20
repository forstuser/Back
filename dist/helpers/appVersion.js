/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
var MODAL = void 0;

var checkAppVersion = function checkAppVersion(request, reply) {
  // console.log("here");
  // console.log(request.headers);
  if (request.headers.app_version !== undefined) {
    var currentAppVersion = !isNaN(parseInt(request.headers.app_version)) ?
        parseInt(request.headers.app_version) :
        null;
    console.log('CURRENT APP VERSION = ' + currentAppVersion);

    MODAL.appVersion.findOne({
      order: [['updatedAt', 'DESC']],
      attributes: [
        [
          'recommended_version',
          'recommendedVersion'],
        [
          'force_version',
          'forceVersion']],
    }).then(function(results) {
      if (results && currentAppVersion) {
        var FORCE_VERSION = results.dataValues.forceVersion;
        var RECOMMENDED_VERSION = results.dataValues.recommendedVersion;

        console.log('FORCE APP VERSION = ' + FORCE_VERSION);
        console.log('RECOMMENDED APP VERSION = ' + RECOMMENDED_VERSION);

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

exports.default = function(models) {
  MODAL = models;
  return {
    checkAppVersion: checkAppVersion,
  };
};