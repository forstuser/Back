/*jshint esversion: 6 */
'use strict';

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _main = require('../config/main');

var _main2 = _interopRequireDefault(_main);

var _sendotp = require('sendotp');

var _sendotp2 = _interopRequireDefault(_sendotp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OTP_CHAR_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

var sendOTP = new _sendotp2.default(_main2.default.SMS.AUTH_KEY, 'Your verification code is "{{otp}}". Please enter this code to login to your account.');

_bluebird2.default.promisifyAll(sendOTP);

sendOTP.setOtpExpiry(5); // 5 minutes

var generateOTP = function generateOTP(length) {
  var choice = OTP_CHAR_ARRAY;

  var round = _crypto2.default.randomBytes(length);
  var value = new Array(length);
  var arrLen = choice.length;

  for (var i = 0; i < length; i++) {
    value[i] = choice[round[i] % arrLen];
  }

  return value.join('');
};

var sendOTPToUser = function sendOTPToUser(mobileNo, otpLength) {
  return _bluebird2.default.try(function () {
    var phone = '91' + mobileNo;
    var otp = generateOTP(otpLength); // OTP of length = 4
    return sendOTP.sendAsync(phone, 'BINBILL', otp).catch(function (err) {
      console.log('Error on ' + new Date() + ' is as follow: \n \n ' + err);

      return sendOTP.retryAsync(phone, true);
    });
  });
};

var verifyOTPForUser = function verifyOTPForUser(mobileNo, otp) {
  return _bluebird2.default.try(function () {
    var phone = '91' + mobileNo;

    return sendOTP.verifyAsync(phone, otp);
  });
};

module.exports = {
  sendOTPToUser: sendOTPToUser,
  verifyOTPForUser: verifyOTPForUser
};