'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendSMS = undefined;

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _main = require('../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sendSMS = exports.sendSMS = (message, to) => {

  // below details are must to be able to send the message
  // user.mobile_no,
  // user.name

  const options = {
    method: 'POST',
    uri: _main2.default.SMS.HOST_NAME + _main2.default.SMS.PATH,
    headers: {
      'authkey': _main2.default.SMS.AUTH_KEY,
      'content-type': 'application/json'
    },
    body: {
      sender: 'BINBIL',
      route: '4',
      country: '91',
      sms: [{
        message,
        to
      }]
    },
    json: true // Automatically stringifies the body to JSON
  };

  return (0, _requestPromise2.default)(options).then(result => {
    console.log(result);
  }).catch(console.log);
};