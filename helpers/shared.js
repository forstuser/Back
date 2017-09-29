/*jshint esversion: 6 */
'use strict';

const {verify} = require('jsonwebtoken');
const moment = require('moment');
const {readFileSync, readFile} = require('fs');
const url = require('url-join');
const dateFormat = require('dateformat');
const uuid = require('uuid');
const {stringify} = require('querystring');
const _ = require('lodash');
const path = require('path');
const config = require("../config/main");
const filePath = '';
const jsonFileType = '.json';
const utfFormatting = 'utf8';
const spaceString = ' ';
const basicStringConst = 'basic';
const emptyObject = {};
const emptyString = '';
const authorizationParamConst = 'authorization';
const readJSONFile = (fileName, lang) => new Promise((resolve, reject) => {
	const completeFilePath = path.resolve(__dirname, `${filePath}${fileName}${jsonFileType}`);
	readFile(completeFilePath, utfFormatting, (err, data) => {
		if (err) {
			reject(err);
		}
		try {
			resolve(JSON.parse(data));
		} catch (ex) {
			reject(ex);
		}
	});
});

/**
 *
 * @param {string} authorization The authorization Token in header
 * @returns {object} The Empty String
 */
function validateAccessToken(authorization) {
	if (!authorization) {
		return null;
	}
	// noinspection Eslint
	const data = config.JWT_SECRET;
	const auth = authorization.split(spaceString)[1];
	try {
		return verify(auth, data, {algorithms: ["HS512"]});
	} catch (e) {
		return null;
	}
}

/**
 *
 * @param {string} authorization The authorization Token in header
 * @returns {string} The Empty String
 */
function isAccessTokenBasic(authorization) {
	if (authorization.indexOf(basicStringConst) >= 0) {
		return emptyObject;
	}

	return validateAccessToken(authorization);
}

/**
 *
 * @param rootNode
 * @param currentField
 * @param defaultValue
 * @returns {*}
 */
function verifyParameters(rootNode, currentField, defaultValue) {
	return _.get(rootNode, currentField, defaultValue);
}

/**
 *
 * @param headers
 * @returns {string}
 */
function verifyAuthorization(headers) {
	return isAccessTokenBasic(verifyParameters(headers, authorizationParamConst, emptyString));
}

function sumProps(arrayItem, prop) {
    let total = 0;
    for (let i = 0; i < arrayItem.length; i += 1) {
        total += parseFloat(arrayItem[i][prop] || 0);
    }
    return total.toFixed(2);
}

const getAllDays = function() {
    let s = moment(moment.utc().subtract(6, 'd')).utc().startOf('d');
    const e = moment.utc();
    const a = [];
    while (s.valueOf() < e.valueOf()) {
        a.push({
            value: 0,
            purchaseDate: moment(s).utc()
        });
        s = moment(s).utc().add(1, 'd').startOf('d');
    }

    return a;
};


function retrieveDaysInsight(distinctInsight) {
    const allDaysInWeek = getAllDays();
    distinctInsight.map((item) => {
        const currentDate = moment(item.purchaseDate);
        for (let i = 0; i < allDaysInWeek.length; i += 1) {
            const weekData = allDaysInWeek[i];
            if (weekData.purchaseDate.valueOf() === currentDate.valueOf()) {
                weekData.value = item.value;
                weekData.purchaseDate = moment(weekData.purchaseDate);
                break;
            }
        }

        return item;
    });

    return allDaysInWeek.map(weekItem => ({
        value: weekItem.value,
        purchaseDate: moment(weekItem.purchaseDate),
        purchaseDay: moment(weekItem.purchaseDate).format('ddd')
    }));
}

function retrieveMailTemplate(user, templateType) {
	return templateType === 1 ? `<!DOCTYPE html><html lang="en" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;font-family: sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-size: 10px;-webkit-tap-highlight-color: transparent;line-height: 1.15;-ms-overflow-style: scrollbar;"><head style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <style type="text/css"> /* vietnamese */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}/* latin-ext */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}/* vietnamese */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}/* latin-ext */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}/* vietnamese */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}/* latin-ext */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}a:link{text-decoration: none;}a:visited{text-decoration: none;}a:hover{text-decoration: none;}a:active{text-decoration: none;}</style> <meta charset="UTF-8" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <title style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">Welcome To BinBill!</title></head><article style="border: solid 1px rgba(0, 0, 0, 0.99);width: 800px;height: 1066px;"> <header style="margin: 0 auto;height: 10%;"> <div style="width: 45%;display: inline-block;padding: 20px;"> <a class="navbar-brand" href="https://www.binbill.com/" style="font-size: 1.25rem;line-height: inherit;display: inline-block;padding: 15px;white-space: nowrap;max-height: 70px;text-decoration: none;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" alt="logo" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;display: block;max-height: 100%;max-width: 100%!important;"> </a> </div><div style="width: 43%;float: right!important; display: inline-block;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" alt="header" style="max-width: 356px;height: 110px;"> </div></header> <section style="padding:15px;"> <article style="display: block;margin: 0 auto;width: 100%;"> <header style="padding: 5px;"> <section class="title-border row" style="display: flex;-ms-flex-wrap: wrap;flex-wrap: wrap;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> </section> <section class="title" style="font-family: 'Quicksand', sans-serif;font-size: 40px;font-weight: 500;text-align: left;color: #ff732e;margin:15px;"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;"> Welcome to BinBill! </p></section> </header> <section style="margin: 0 15px 15px;padding: 0 15px;"> <article> <section> <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-size: 20px;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi Abhyudit</p></section> <section> <q style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;font-family: 'Quicksand', sans-serif;font-size: 30px;font-weight: 700;text-align: left;color: #dadada;margin:0 auto;"> Life was chaotic with bills, <br>that’s why we created BinBill. </q> </section> <section style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;display: block;font-family: 'Quicksand', sans-serif;font-size: 20px;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b;padding-top: 10px;padding-bottom: 15px;line-height: 1.4;"> <p style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> It gives us immense pleasure to see you start your BinBill journey. We created it with just one single aim ‘where there is a bill, there is BinBill’. There are lot of things that you can do with BinBill, like </p></section> <section> <ul style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;margin-top: 0;margin-bottom: 1rem;font-family: 'Quicksand', sans-serif;font-size: 20px;font-weight: 700;line-height: 1.45;letter-spacing: 0.3px;text-align: left;color: #3b3b3b;list-style: none;"> <li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;color: #ff732e; padding-right: 2px;display: inline-block;"> ►</p>Add value to your bills. </li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 2px;display: inline-block;"> ►</p>Build your own eHome. </li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 2px;display: inline-block;"> ►</p>Secure your important documents with us. </li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 2px;display: inline-block;"> ►</p>Access them all, anytime and anywhere. </li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 2px;display: inline-block;"> ►</p>Enjoy hassle free after sales communication </li></ul> </section> <section style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;display: block;font-family: 'Quicksand', sans-serif;font-size: 20px;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b;padding-top: 10px;padding-bottom: 15px;line-height: 1.4;"> <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;"> We are striving towards adding value to bills, and easing out after sales communication, so that you can avail hassle free customer benefits. Decorate your eHome, the way you want, store bills, or create your own personal catalogue of government IDs, or important documents. </p></section> <section style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;display: block;font-family: 'Quicksand', sans-serif;font-size: 20px;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b;padding-top: 10px;padding-bottom: 15px;line-height: 1.4;"> <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;"> Wait no more, upload your first bill </p></section> <a href="https://www.binbill.com/" style="text-decoration: none;"> <section style="width: 200px;max-height: 60px;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 15px 20px;margin-bottom: 0;font-size: 16px;font-weight: 500;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 0.5px;text-decoration: none;"> Visit Binbill <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 20px;max-width: 100%!important;margin-top: -4px;"> </section> </a> </article> </section> </article> </section> <footer style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;display: block;background: rgba(0, 0, 0, 0.99);"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 0.4);padding: 15px;"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 0.4);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u></a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 0.4);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u></a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 0.4);padding: 15px;"> Where there is a bill, there is BinBill! <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"><b style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;font-weight: bolder;">The BinBill Team</b></u></p><hr style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;border: solid 1px rgba(255, 255, 255, 0.13);border-top: 1px solid rgba(0, 0, 0, 0.1);overflow: visible;margin: 0 auto;"> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 0.4);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 0.4);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 0.4);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 0.4);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 0.4);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 18px;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/fill-88.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important;"> </a> </p></footer></article></body></html>` : `Hi ${user.fullname},<br /><br /> <a href='${config.SERVER_HOST}/verify/${user.email_secret}' >Click here</a> to verify your email account -<br /><a href='${config.SERVER_HOST}/verify/${user.email_secret}' >${config.SERVER_HOST}/verify/${user.email_secret}</a><br /> Welcome to the safe and connected world!<br /><br />Regards,<br />BinBill`;
}

const formatDate = (actualValue, dateFormatString) => dateFormat(actualValue, dateFormatString);
const prepareUrl = (basePath, ...relPath) => url(basePath, ...relPath);
const queryStringFromObject = queryObject => stringify(queryObject);
const retrieveHeaderValue = headers => ({
	authorization: verifyParameters(headers, authorizationParamConst, emptyString),
	CorrelationId: uuid.v4()
});
const iterateToCollection = (collection, callback, ...relativeItems) => {
	const result = [];
	_.forEach(collection, item => result.push(callback(item, relativeItems[0])));

	return result;
};
const stringHasSubString = (stringItem, subString) => _.includes(stringItem, subString);

module.exports = {
	readJSONFile,
	formatDate,
	prepareUrl,
	verifyParameters,
	queryStringFromObject,
	verifyAuthorization,
	retrieveHeaderValue,
	iterateToCollection,
	stringHasSubString,
    getAllDays,
    sumProps,
    retrieveDaysInsight,
    retrieveMailTemplate
};
