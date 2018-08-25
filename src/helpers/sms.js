'use strict';
import requestPromise from 'request-promise';
import config from '../config/main';

export const sendSMS = (message, to) => {

  // below details are must to be able to send the message
  // user.mobile_no,
  // user.name

  const options = {
    method: 'POST',
    uri: config.SMS.HOST_NAME + config.SMS.PATH,
    headers: {
      'authkey': config.SMS.AUTH_KEY,
      'content-type': 'application/json',
    },
    body: {
      sender: 'BINBIL',
      route: '4', country: '91', sms: [{message, to}],
    },
    json: true, // Automatically stringifies the body to JSON
  };

  return requestPromise(options).then((result) => {
    console.log(result);
  }).catch(console.log);

};