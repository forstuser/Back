/*jshint esversion: 6 */
'use strict';

import request from 'request-promise';
import config from '../../config/main';

class AdminAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.request = request;
  }

  async loginAdmin() {
    try {
      console.log(config.ADMIN.CREDENTIALS);
      const request = config.ADMIN.CREDENTIALS;
      const result = await this.request({
        url: `${config.ADMIN.HOST}${config.ADMIN.LOGIN_API}`,
        method: 'POST', headers: {
          'Content-Type': 'application/json',
        },
        transform: (
            body, response,
            resolveWithFullResponse) => {
          body = JSON.parse(body);
          body.headers = response.headers;
          return body;
        },
        body: JSON.stringify(request),//Set the body as a string
      });

      return result.headers['x-csrf-token'];
    } catch (e) {
      throw e;
    }
  }

  async adminApproval(options) {
    try {
      return await this.request({
        url: `${config.ADMIN.HOST}${config.ADMIN.APPROVAL_API}?online_payment=true`,
        method: 'PUT', headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': await this.loginAdmin(),
        },
        body: JSON.stringify(options),//Set the body as a string
      });
    } catch (e) {
      throw e;
    }
  }
}

export default AdminAdaptor;
