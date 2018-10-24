/*jshint esversion: 6 */
'use strict';

import {genCheckSumByString} from '../../helpers/payTM/checksum';
import request from 'request-promise';
import config from '../../config/main';

class NotificationAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.genCheckSumByString = genCheckSumByString;
    this.request = request;
  }

  async encryptRequest(request) {
    console.log(config.PAYTM.PAYTMMKEY);
    return await this.genCheckSumByString(JSON.stringify(request),
        config.PAYTM.PAYTMMKEY);
  }

  async salesToUserCredit(options) {
    try {
      const request = config.PAYTM.REQUEST;
      const {order_id, amount, mobile_no, email, comment, ip} = options;
      request.request.merchantOrderId = order_id.toString();
      request.request.amount = amount.toString();
      if (mobile_no) {
        request.request.payeePhoneNumber = mobile_no;
      } else if (email) {
        request.request.payeeEmailId = email;
      }

      request.metadata = comment;
      if (ip) {
        request.ipAddress = ip;
      }
      const checksumhash = await this.encryptRequest(request);
      console.log(JSON.stringify({checksumhash, request}));
      return await this.request({
        url: `${config.PAYTM.END_POINT}salesToUserCredit`,
        method: 'POST', headers: {
          'Content-Type': 'application/json',
          mid: config.PAYTM.PAYTMMID,
          checksumhash,
        },
        body: JSON.stringify(request),//Set the body as a string
      });
    } catch (e) {
      throw e;
    }
  }
}

export default NotificationAdaptor;
