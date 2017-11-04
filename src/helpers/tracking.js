/*jshint esversion: 6 */
'use strict';

import Bluebird from 'bluebird';
import request from 'request-promise';

const URL_ICUBES = 'http://tracking.icubeswire.com/aff_lsr';

const postbackTracking = (transactionId, uniqueUserId) => Bluebird.try(() => {
  const query = {
    transaction_id: transactionId,
    adv_sub: uniqueUserId
  };

  const options = {
    method: 'GET',
    uri: URL_ICUBES,
    qs: query,
    json: true
  };

  return request(options);
});

export default {
	postbackTracking
};