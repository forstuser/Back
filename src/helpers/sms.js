'use strict';
let MODAL;

import requestPromise from 'request-promise';
import config from '../config/main';

const sendSMS = (message, to) => {

  // below details are must to be able to send the message
  // user.mobile_no,
  // user.name

  const options = {
    method: 'POST',
    uri: config.SMS.HOST_NAME + config.SMS.PATH,
    body: {
      sender: 'SOCKET',
      route: '4',
      country: '91',
      sms:
          [
            {
              message,
              to,
            },
          ],
    },
    json: true // Automatically stringifies the body to JSON
  };

  return requestPromise(options).then((result) => {
    console.log(result);
  }).catch(console.log);

};

export default (models) => {
  MODAL = models;
  return {
    sendSMS,
  };
};