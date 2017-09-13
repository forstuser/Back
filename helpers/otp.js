/*jshint esversion: 6 */
'use strict';

const SendOTP = require("sendotp");
const config = require("../config/main");
const Bluebird = require("bluebird");

const sendOTP = new SendOTP(config.SMS.AUTH_KEY, 'Your verification code is {{otp}}. Please enter this code to login your account.');

Bluebird.promisifyAll(sendOTP);

sendOTP.setOtpExpiry(5);  // 5 minutes

const sendOTPToUser = function (mobileNo) {
	return Bluebird.try(() => {
		const phone = `91${mobileNo}`;
		return sendOTP.sendAsync(phone, "BINBILL").catch((err) => {
			console.log(err);

			return sendOTP.retryAsync(phone, true);
		});
	});
};

const verifyOTPForUser = function (mobileNo, otp) {
	return Bluebird.try(() => {
		const phone = `91${mobileNo}`;

		return sendOTP.verifyAsync(phone, otp);
	});
};


module.exports = {
	sendOTPToUser: sendOTPToUser,
	verifyOTPForUser: verifyOTPForUser
};