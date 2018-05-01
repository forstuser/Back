/*jshint esversion: 6 */
'use strict';

import dateFormat from 'dateformat';
import {readFile} from 'fs';
import {verify} from 'jsonwebtoken';
import _ from 'lodash';
import moment from 'moment';
import path from 'path';
import {stringify} from 'querystring';
import url from 'url-join';
import uuid from 'uuid';
import config from '../config/main';

const filePath = '';
const jsonFileType = '.json';
const utfFormatting = 'utf8';
const spaceString = ' ';
const basicStringConst = 'basic';
const emptyObject = {};
const emptyString = '';
const authorizationParamConst = 'authorization';
const readJSONFile = (fileName) => new Promise((resolve, reject) => {
  const completeFilePath = path.resolve(__dirname,
      `${filePath}${fileName}${jsonFileType}`);
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
    return verify(auth, data, {algorithms: ['HS512']});
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
 * @returns {*}
 * @param parameters
 */
function verifyParameters(parameters) {
  let {rootNode, currentField, defaultValue} = parameters;
  return _.get(rootNode, currentField, defaultValue);
}

/**
 *
 * @param headers
 * @returns {string}
 */
function verifyAuthorization(headers) {
  return isAccessTokenBasic(
      verifyParameters({
        rootNode: headers,
        currentField: authorizationParamConst,
        defaultValue: emptyString,
      }));
}

function sumProps(arrayItem, prop) {
  let total = 0;
  for (let i = 0; i < arrayItem.length; i += 1) {
    total += parseFloat(arrayItem[i][prop] || 0);
  }
  return total.toFixed(2);
}

const getAllDays = function() {
  let s = moment.utc().subtract(6, 'd').startOf('d');
  const e = moment.utc();
  const a = [];
  while (s.valueOf() < e.valueOf()) {
    a.push({
      value: 0,
      purchaseDate: moment.utc(s, moment.ISO_8601).startOf('d'),
    });
    s = moment.utc(s, moment.ISO_8601).add(1, 'd').startOf('d');
  }

  return a;
};

function retrieveDaysInsight(distinctInsight) {
  const allDaysInWeek = getAllDays();
  distinctInsight.map((item) => {
    const currentDate = moment.utc(item.purchaseDate, moment.ISO_8601).
        startOf('day');
    for (let i = 0; i < allDaysInWeek.length; i += 1) {
      const weekData = allDaysInWeek[i];
      if (weekData.purchaseDate.valueOf() === currentDate.valueOf()) {
        weekData.value = !(item.value) ? 0 : item.value;
        weekData.purchaseDate = moment.utc(weekData.purchaseDate,
            moment.ISO_8601);
        break;
      }
    }

    return item;
  });

  return allDaysInWeek.map(weekItem => ({
    value: weekItem.value,
    purchaseDate: moment.utc(weekItem.purchaseDate, moment.ISO_8601),
    purchaseDay: moment.utc(weekItem.purchaseDate, moment.ISO_8601).
        format('ddd'),
  }));
}

export function preparePaymentDetails(parameters) {
  let {
    currentYear, monthItem, effectiveDate, selected_days,
    wages_type, serviceCalculationBody, user, currentDate,
  } = parameters;
  const monthStartDate = moment([currentYear, 0, 1]).month(monthItem);
  let month_end_date = moment([currentYear, 0, 31]).month(monthItem);
  let end_date = moment([currentYear, 0, 31]).month(monthItem);
  let start_date = effectiveDate;
  if (monthStartDate.isAfter(effectiveDate)) {
    start_date = monthStartDate;
  }
  currentDate = moment(currentDate || moment()).startOf('days');
  if (end_date.isAfter(currentDate)) {
    end_date = currentDate.endOf('days');
  }

  if (end_date.isBefore(start_date)) {
    end_date = moment(start_date).endOf('days');
  }

  const daysInMonth = moment().
      isoWeekdayCalc(monthStartDate, month_end_date, selected_days);
  const daysInPeriod = moment().isoWeekdayCalc(start_date.format('YYYY-MM-DD'),
      end_date.format('YYYY-MM-DD'),
      selected_days);
  let unit_price = serviceCalculationBody.unit_price;
  if (wages_type === 1) {
    unit_price = unit_price / daysInMonth;
  }
  console.log({
    daysInPeriod,
    start_date,
    end_date,
    monthStartDate,
    month_end_date,
    monthItem,
  });
  let total_amount = unit_price * daysInPeriod;
  if (serviceCalculationBody.quantity ||
      serviceCalculationBody.quantity === 0) {
    total_amount = serviceCalculationBody.quantity * total_amount;
  }
  total_amount = (total_amount).toFixed(2);
  return {
    start_date,
    end_date,
    updated_by: user.id || user.ID,
    status_type: 1,
    total_amount: parseFloat(total_amount),
    total_days: daysInPeriod,
    total_units: serviceCalculationBody.quantity ?
        daysInPeriod * serviceCalculationBody.quantity :
        0,
    amount_paid: 0,
  };
}

export function monthlyPaymentCalc(parameters) {
  let {currentMth, effectiveDate, selected_days, wages_type, serviceCalculationBody, user, currentYear, currentDate} = parameters;
  const monthDiff = moment().
      startOf('months').
      diff(moment(effectiveDate, moment.ISO_8601).startOf('months'), 'months');
  console.log('\n\n\n\n\n\n\n\n\n\n monthdiff:', monthDiff);
  const monthArr = [];
  if (moment().isAfter(moment(effectiveDate, moment.ISO_8601), 'months')) {
    for (let i = monthDiff; i >= 0; i--) {
      monthArr.push(currentMth - i);
    }
  } else {
    monthArr.push(currentMth);
  }

  return monthArr.map((monthItem) => {
    return preparePaymentDetails({
      currentYear,
      monthItem,
      effectiveDate,
      selected_days, wages_type,
      serviceCalculationBody,
      user,
      currentDate,
    });
  });
}

export function retrieveMailTemplate(user, templateType) {
  switch (templateType) {
    case 0: {
      return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}}/* @media only screen and (min-device-width: 375px) and (max-device-width: 413px){/* iPhone 6 and 6+ */ /* .email-container{min-width: 375px !important;}*/ </style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ @media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}}</style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div class="email-container" style="border:1px solid black;"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" "background-color"="white"> <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px; text-align: left; color: #ff732e;padding-top:10px; "> Welcome to BinBill! </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name ||
      'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> We are happy to have you here, and see that you have started building your eHome. But it’s important to secure your eHome and verify the builder’s identity. </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;"> For security purpose, please verify your email address by clicking below:- </p><a href="https://www.binbill.com/dashboard?verificationId=${user.email_secret}" style="text-decoration:none;"><p style="width: 200px;max-height: 60px;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 15px 20px;margin-bottom: 0;font-size: 12px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Verify Email <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 100%!important;margin-top: -4px;"> </p></a> </td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
    }
    case 1: {
      return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>BinBill</title>
    <style>@font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 400;
        src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2');
        unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 400;
        src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2');
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;
    }

    /* latin */
    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 400;
        src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 500;
        src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2');
        unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 500;
        src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2');
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 500;
        src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 700;
        src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2');
        unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 700;
        src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2');
        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;
    }

    @font-face {
        font-family: 'Quicksand';
        font-style: normal;
        font-weight: 700;
        src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;
    }

    html, body {
        margin: 0 auto !important;
        padding: 0 !important;
        height: 100% !important; /* width: 100% !important; */
    }

    * {
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
    }

    div[style*="margin: 16px 0"] {
        margin: 0 !important;
    }

    table, td {
        mso-table-lspace: 0 !important;
        mso-table-rspace: 0 !important;
    }

    table {
        border-spacing: 0 !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        margin: 0 auto !important;
    }

    table table table {
        table-layout: auto;
    }

    img {
        -ms-interpolation-mode: bicubic;
    }

    *[x-apple-data-detectors], /* iOS */
    .x-gmail-data-detectors, /* Gmail */
    .x-gmail-data-detectors *, .aBn {
        border-bottom: 0 !important;
        cursor: default !important;
        color: inherit !important; /* text-decoration: none !important; */
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
    }

    /* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */
    .a6S {
        display: none !important;
        opacity: 0.01 !important;
    }

    /* If the above doesn't work, add a .g-img class to any image in question. */
    img.g-img + div {
        display: none !important;
    }

    /* What it does: Prevents underlining the button text in Windows 10 */
    .button-link {
        text-decoration: none !important;
    }

    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */
    @media only screen and (min-width: 320px) and (max-width: 600px) {
        /* iPhone 6 and 6+ */
        .email-container {
            max-width: 600px;
            margin: auto;
        }
    }

    @media only screen and (min-width: 600px) and (max-width: 1400px) {
        /* iPhone 6 and 6+ */
        .email-container {
            width: 100%;
        }

        .main-class {
            font-size: 16px;
        }

        .mains-class {
            font-size: 16px;
        }
    }</style>
    <style>/* What it does: Hover styles for buttons */
    .button-td, .button-a {
        transition: all 100ms ease-in;
    }

    .button-td:hover, .button-a:hover {
        background: #555555 !important;
        border-color: #555555 !important;
    }

    /* Media Queries */
    @media screen and (max-width: 600px) {
        /* What it does: Adjust typography on small screens to improve readability */
        .email-container p {
            line-height: 14px !important;
        }

        .main-class {
            font-size: 12px;
        }

        .mains-class {
            font-size: 11px;
        }

        .binbill {
            text-align: left;
        }
    }</style>
</head>
<body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;">
<center style="width: 100%; background: #cecece; text-align: left;">
    <div style="border:1px solid black;" class="email-container">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
            <tr>
                <td bgcolor="#ffffff">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
                                <p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;">
                                    Hello ${user.name || user.full_name ||
      'User'},
                                </p>
                                <p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;">
                                    Thank you so much for subscribing! We are very excited that you have signed up for <a href="https://www.binbill.com">BinBill – Your Own Home Manager</a> and the best and most convenient way to access your important bills and documents at any time on your phone. The first step is to build your eHome and upload your product bills, important documents & other expenses. Here are some of the ways in which BinBill makes your life easy and hassle free:
                                </p>
                                <ul>
                                    <li>
                                    Product lifecycle management: Be it an old or new product, important details like purchase bill, warranty, model number, insurance etc. will now be handy when you wish. You will receive important notifications, reminders, information on ASCs, service expense details etc.                                    
                                    </li>
                                    <li>
                                    EazyDay Planner: This feature helps you plan out the activities for the day including what to cook, what to wear and what to do. It also helps maintain attendance and payout record for all your household services like the milkman, newspaper wala and maids.
                                    </li>
                                    <li>
                                    Authorized Service Center connect: We connect you with all brands’ Authorized Service Centers in your vicinity with just one touch.
                                    </li>
                                    <li>
                                    Expense Management: Whether the expense is small or big, online or offline, cash or card, once uploaded or added manually will fetch you spending insights on what you have spent on, when, where and how much have you spent in a given period.
                                    </li>
                                    <li>
                                    Important documents’ record: Educational certificates, birth certificates, RC book, insurance, rent agreement etc. can all be uploaded on the app for you to view, download, email and print at your will.
                                    </li>
                                    <li>
                                    Share Product Reviews: Help your family and friends make a wise purchase decision by sharing your reviews.
                                    </li>
                                </ul>
                                <p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;">
                                    In addition, with our world class data integrity systems and encryption standards, we ensure complete security for your information.
                                </p>
                                <p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">
                                    No matter how mismanaged your life is, remember you have the control in your hands and the power to bring about a change. I sincerely hope that our app can help you do just that.
                                </p>
                                <p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">
                                    For any queries, you could write to us at <a href="mailto:support@binbill.com">support@binbill.com</a> or call us at <a href="tel:+91-124-4343177">+91-124-4343177</a>. We would be glad to be of assistance.
                                </p>
                                <p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">
                                    Thank you for signing up once again and I look forward to a long term fruitful association.
                                </p>
                                <p style="margin:0 auto; -webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">
                                    Sincerely,<br>
                                    Rohit Kumar,<br>
                                    CEO, BinBill<br>
                                </p>
                                <img style="width: 100px" atr="logo"
                                     src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png"/>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</center>
</body>
</html>`;
    }
    case 2: {
      return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}.btns{width: 100px; max-height: 60px;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}}</style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ @media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}}</style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div style="border:1px solid black;" class="email-container"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" background-color="white" > <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px; text-align: left; color: #ff732e;padding-top:10px; "> Start building your eHome </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name ||
      'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;"> We are delighted to see that you have started building you you eHome. Our servers are doing the magic for you, creating reminders, updates or smartly categorising your bill for you. Till then why don’t you browse through our application, and get familiar with features of your new eHome. Did you know that you can: </p><div style="width:100%;"> <div style="width:50%;float:left;"> <p style="display: inline-block; width: 80%; font-family: 'Quicksand',sans-serif; font-size: 45px; font-weight: 700; text-align: left; color: rgba(255, 115, 46, 0.3); padding: 10px; margin: 0 auto;"> #1 </p><p class="main-class" style="display: inline-block; width: 80%; font-family: 'Quicksand',sans-serif;font-weight: 700; line-height: 1.4; letter-spacing: 0.3px; text-align: left; color: #9c9c9c; padding: 10px; margin: 0 auto;"> Build a personal catalogue of your important documents apart from storing bills. </p><a href="https://www.binbill.com/upload" style="text-decoration:none;"> <p class="btns" style="margin-bottom:4%;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 10px 20px;font-size: 10px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Upload Now<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 19px;margin-top: -4px;"> </p></a> </div><div style="width:50%;float:left;"> <p style="display: inline-block; width: 80%; font-family: 'Quicksand',sans-serif; font-size: 45px; font-weight: 700; text-align: left; color: rgba(255, 115, 46, 0.3); padding: 10px; margin: 0 auto;"> #2 </p><p class="main-class" style="display: inline-block; width: 92%; font-family: 'Quicksand',sans-serif;font-weight: 700; line-height: 1.4; letter-spacing: 0.3px; text-align: left; color: #9c9c9c; padding: 10px; margin: 0 auto;"> Contact your manufacturer, or locate your nearest authorised service centre. Check your dealer: </p><a href="https://www.binbill.com/asc" style="text-decoration:none;"> <p class="btns"style="margin-bottom:4%;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 10px 20px;font-size: 10px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Locate<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 19px;margin-top: -4px;"> </p></a> </div></div><br><br><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> The list of activities that you can do with BinBill is long, and never-exhausting, you can also receive useful expense insights, reminders for warranty and renewals, or locate the nearest authorize service center. </p><p class="main-class" style="margin-top:4%; "> We will be soon listing your bill in your eHome for you. Till then enjoy hassle-free bill management and keep adding more bills for a carefree life. </p><p class="main-class" style="margin-top: 2%; margin-bottom: 16px;"> Where there is a bill, there is BinBill! </p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> Regards<br>BinBill Team </p></td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
    }
    case 3: {
      return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}.mains-class{font-size:16px;}}@media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}.mains-class{font-size:11px;}}</style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ </style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div style="border:1px solid black;" class="email-container"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" background-color="white"> <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px; text-align: left; color: #ff732e;padding-top:10px; "> Bill is being processed </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name ||
      'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;"> It’s great to see you building your eHome, bill by bill. So that you don’t have to stress much, we are processing it in the backend, applying the required filters, and final touches. </p><ul class="mains-class" style="text-indent:-12px;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;margin-top: 0;margin-bottom: 1rem;font-family: 'Quicksand', sans-serif;font-weight: 700;line-height: 1.45;text-align: left;color: #3b3b3b;list-style: none;"> <li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Smartly Store All Your Bills in Your eHome.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Useful Expense Insights.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Reminders for Warranty, Renewals etc.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Connect with the Sellers for various after sales needs.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Locate Nearest Authorized Service Centers and much more.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Build a personal catalogue of your important documents apart from storing bills. </li></ul> <p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> We will be soon listing your bill in your eHome for you. Till then enjoy hassle-free bill management and keep adding more bills for a carefree life. </p><a href="https://www.binbill.com/ehome" style="text-decoration:none;"> <p style="width: 200px;max-height: 60px;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 15px 20px;margin-bottom: 0;font-size: 12px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Take me to my eHome <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 100%!important;margin-top: -4px;"> </p></a> <p class="main-class" style="margin-top: 2%; margin-bottom: 16px;"> Where there is a bill, there is BinBill! </p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> Regards<br>BinBill Team </p></td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
    }
    case 4: {
      return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width: 100%;}.main-class{font-size:16px;}.mains-class{font-size: 16px;}}@media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px;}.main-class{font-size:12px;}.mains-class{font-size: 11px;}}</style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ </style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div style="border:1px solid black;" class="email-container"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" background-color="white"> <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px;line-height:22px; text-align: left; color: #ff732e;padding-top:10px; "> Congrats! Your first bill has been added in your eHome. </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name ||
      'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;"> We would love to see your eHome grow, and we thought of sharing with you tips on what more can you do with your eHome. </p><ul class="mains-class" style="text-indent:-12px;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;margin-top: 0;margin-bottom: 1rem;font-family: 'Quicksand', sans-serif;font-weight: 700;line-height: 1.45;letter-spacing: 0.3px;text-align: left;color: #3b3b3b;list-style: none;"> <li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Smartly Store All Your Bills in Your eHome.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Useful Expense Insights.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Reminders for Warranty, Renewals etc.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Connect with the Sellers for various after sales needs.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Locate Nearest Authorized Service Centers and much more.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Build a personal catalogue of your important documents apart from storing bills. </li></ul> <p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> We look forward to processing more bills for you, keep adding bills to your eHome, and happiness in your life. </p><p class="main-class" style="margin-top: 2%; margin-bottom: 16px;"> Where there is a bill, there is BinBill! </p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> Regards<br>BinBill Team </p><a href="https://www.binbill.com/ehome" style="text-decoration:none;"> <p style="width: 200px;max-height: 60px;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 15px 20px;margin-bottom: 0;font-size: 12px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Take me to my eHome <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 100%!important;margin-top: -4px;"> </p></a> </td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
    }
    default: {
      const verificationUrl = `${config.SERVER_HOST}/verify/${user.email_secret}`;
      `Hi ${user.name ||
      'User'},<br /><br /> <a href='${verificationUrl}'>Click here</a> to verify your email account -<br /><br /> Welcome to the safe and connected world!<br /><br />Regards,<br />BinBill`;
    }
  }
}

const formatDate = (actualValue, dateFormatString) => dateFormat(actualValue,
    dateFormatString);
const prepareUrl = (basePath, ...relPath) => url(basePath, ...relPath);
const queryStringFromObject = queryObject => stringify(queryObject);
const retrieveHeaderValue = headers => ({
  authorization: verifyParameters({
    rootNode: headers,
    currentField: authorizationParamConst,
    defaultValue: emptyString,
  }),
  CorrelationId: uuid.v4(),
});
const iterateToCollection = (collection, callback, ...relativeItems) => {
  const result = [];
  _.forEach(collection, item => result.push(callback(item, relativeItems[0])));

  return result;
};
const stringHasSubString = (stringItem, subString) => _.includes(stringItem,
    subString);

const preValidation = (preRequest, reply) => {
  if (preRequest.userExist === 0) {
    return reply({
      status: false,
      message: 'Inactive User',
      forceUpdate: preRequest.forceUpdate,
    }).code(402);
  } else if (!preRequest.userExist) {
    return reply({
      status: false,
      message: 'Unauthorized',
      forceUpdate: preRequest.forceUpdate,
    }).code(401);
  }

  return reply({
    status: false,
    message: 'Forbidden',
    forceUpdate: preRequest.forceUpdate,
  });
};

export default {
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
  retrieveMailTemplate,
  preValidation
};
