/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _checksum = require('../../helpers/payTM/checksum');

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PayTMAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.genCheckSumByString = _checksum.genCheckSumByString;
    this.request = _requestPromise2.default;
  }

  async encryptRequest(request) {
    console.log(_main2.default.PAYTM.PAYTMMKEY);
    return await this.genCheckSumByString(JSON.stringify(request), _main2.default.PAYTM.PAYTMMKEY);
  }

  async salesToUserCredit(options, is_seller) {
    try {
      const request = is_seller ? _main2.default.PAYTM.SELLERREQUEST : _main2.default.PAYTM.REQUEST;
      const { order_id, amount, mobile_no, email, comment, ip } = options;
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
      console.log(JSON.stringify({ checksumhash, request }));
      return await this.request({
        url: `${_main2.default.PAYTM.END_POINT}salesToUserCredit`,
        method: 'POST', headers: {
          'Content-Type': 'application/json',
          mid: _main2.default.PAYTM.PAYTMMID,
          checksumhash
        },
        body: JSON.stringify(request) //Set the body as a string
      });
    } catch (e) {
      throw e;
    }
  }
}

exports.default = PayTMAdaptor;