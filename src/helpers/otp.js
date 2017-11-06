/*jshint esversion: 6 */
'use strict';

import crypto from 'crypto';
import Bluebird from 'bluebird';
import config from '../config/main';
import SendOTP from 'sendotp';

const OTP_CHAR_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const sendOTP = new SendOTP(config.SMS.AUTH_KEY, 'Your verification code is "{{otp}}". Please enter this code to login to your account.');

Bluebird.promisifyAll(sendOTP);

sendOTP.setOtpExpiry(5);  // 5 minutes

const generateOTP = length => {
	const choice = OTP_CHAR_ARRAY;

	const round = crypto.randomBytes(length);
	const value = new Array(length);
	const arrLen = choice.length;

	for (let i = 0; i < length; i++) {
		value[i] = choice[round[i] % arrLen];
	}

	return value.join('');
};

const sendOTPToUser = mobileNo => Bluebird.try(() => {
  const phone = `91${mobileNo}`;
  const otp = generateOTP(6); // OTP of length = 6
  return sendOTP.sendAsync(phone, "BINBILL", otp).catch((err) => {
    console.log({API_Logs: err});

    return sendOTP.retryAsync(phone, true);
  });
});

const verifyOTPForUser = (mobileNo, otp) => Bluebird.try(() => {
  const phone = `91${mobileNo}`;

  return sendOTP.verifyAsync(phone, otp);
});

module.exports = {
	sendOTPToUser,
	verifyOTPForUser
};