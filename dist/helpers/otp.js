/*jshint esversion: 6 */
'use strict';

var SendOTP = require("sendotp");
var config = require("../config/main");
var Bluebird = require("bluebird");
var crypto = require("crypto");

var OTP_CHAR_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

var sendOTP = new SendOTP(config.SMS.AUTH_KEY, 'Your verification code is "{{otp}}". Please enter this code to login to your account.');

Bluebird.promisifyAll(sendOTP);

sendOTP.setOtpExpiry(5); // 5 minutes

var generateOTP = function generateOTP(length) {
	var choice = OTP_CHAR_ARRAY;

	var round = crypto.randomBytes(length);
	var value = new Array(length);
	var arrLen = choice.length;

	for (var i = 0; i < length; i++) {
		value[i] = choice[round[i] % arrLen];
	}

	return value.join('');
};

var sendOTPToUser = function sendOTPToUser(mobileNo) {
	return Bluebird.try(function () {
		var phone = "91" + mobileNo;
		var otp = generateOTP(6); // OTP of length = 6
		return sendOTP.sendAsync(phone, "BINBILL", otp).catch(function (err) {
			console.log({ API_Logs: err });

			return sendOTP.retryAsync(phone, true);
		});
	});
};

var verifyOTPForUser = function verifyOTPForUser(mobileNo, otp) {
	return Bluebird.try(function () {
		var phone = "91" + mobileNo;

		return sendOTP.verifyAsync(phone, otp);
	});
};

module.exports = {
	sendOTPToUser: sendOTPToUser,
	verifyOTPForUser: verifyOTPForUser
};