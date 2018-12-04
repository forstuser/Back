/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AdminAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.request = _requestPromise2.default;
  }

  async loginAdmin() {
    try {
      console.log(_main2.default.ADMIN.CREDENTIALS);
      const request = _main2.default.ADMIN.CREDENTIALS;
      const result = await this.request({
        url: `${_main2.default.ADMIN.HOST}${_main2.default.ADMIN.LOGIN_API}`,
        method: 'POST', headers: {
          'Content-Type': 'application/json'
        },
        transform: (body, response, resolveWithFullResponse) => {
          body = JSON.parse(body);
          body.headers = response.headers;
          return body;
        },
        body: JSON.stringify(request) //Set the body as a string
      });

      return result.headers['x-csrf-token'];
    } catch (e) {
      throw e;
    }
  }

  async adminApproval(options) {
    try {
      return await this.request({
        url: `${_main2.default.ADMIN.HOST}${_main2.default.ADMIN.APPROVAL_API}?online_payment=true`,
        method: 'PUT', headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': await this.loginAdmin()
        },
        body: JSON.stringify(options) //Set the body as a string
      });
    } catch (e) {
      throw e;
    }
  }
}

exports.default = AdminAdaptor;