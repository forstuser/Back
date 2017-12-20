/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

var URL_ICUBES = 'http://tracking.icubeswire.com/aff_lsr';

var postbackTracking = function postbackTracking(transactionId, uniqueUserId) {
  return _bluebird2.default.try(function() {
    var query = {
      transaction_id: transactionId,
      adv_sub: uniqueUserId,
    };

    var options = {
      method: 'GET',
      uri: URL_ICUBES,
      qs: query,
      json: true,
    };

    return (0, _requestPromise2.default)(options);
  });
};

exports.default = {
  postbackTracking: postbackTracking,
};