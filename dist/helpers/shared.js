'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.notifyUser = notifyUser;
exports.preparePaymentDetails = preparePaymentDetails;
exports.monthlyPaymentCalc = monthlyPaymentCalc;
exports.retrieveMailTemplate = retrieveMailTemplate;

var _dateformat = require('dateformat');

var _dateformat2 = _interopRequireDefault(_dateformat);

var _fs = require('fs');

var _jsonwebtoken = require('jsonwebtoken');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _querystring = require('querystring');

var _urlJoin = require('url-join');

var _urlJoin2 = _interopRequireDefault(_urlJoin);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _main = require('../config/main');

var _main2 = _interopRequireDefault(_main);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const filePath = '';
const jsonFileType = '.json';
const utfFormatting = 'utf8';
const spaceString = ' ';
const basicStringConst = 'basic';
const emptyObject = {};
const emptyString = '';
const authorizationParamConst = 'authorization';
const readJSONFile = fileName => new _bluebird2.default((resolve, reject) => {
    const completeFilePath = _path2.default.resolve(__dirname, `${filePath}${fileName}${jsonFileType}`);
    (0, _fs.readFile)(completeFilePath, utfFormatting, (err, data) => {
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
    const data = _main2.default.JWT_SECRET;
    const auth = authorization.split(spaceString)[1];
    try {
        console.log(auth);
        return (0, _jsonwebtoken.verify)(auth, data, { algorithms: ['HS512'] });
    } catch (e) {
        console.log('We are here');
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
    let { rootNode, currentField, defaultValue } = parameters;
    return _lodash2.default.get(rootNode, currentField, defaultValue);
}

/**
 *
 * @param headers
 * @returns {string}
 */
function verifyAuthorization(headers) {
    return isAccessTokenBasic(verifyParameters({
        rootNode: headers,
        currentField: authorizationParamConst,
        defaultValue: emptyString
    }));
}

function sumProps(arrayItem, prop) {
    let total = 0;
    for (let i = 0; i < arrayItem.length; i += 1) {
        total += parseFloat(arrayItem[i][prop] || 0);
    }
    return total.toFixed(2);
}

const getAllDays = function () {
    let s = _moment2.default.utc().subtract(6, 'd').startOf('d');
    const e = _moment2.default.utc();
    const a = [];
    while (s.valueOf() < e.valueOf()) {
        a.push({
            value: 0,
            purchaseDate: _moment2.default.utc(s, _moment2.default.ISO_8601).startOf('d')
        });
        s = _moment2.default.utc(s, _moment2.default.ISO_8601).add(1, 'd').startOf('d');
    }

    return a;
};

function retrieveDaysInsight(distinctInsight) {
    const allDaysInWeek = getAllDays();
    distinctInsight.map(item => {
        const currentDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('day');
        for (let i = 0; i < allDaysInWeek.length; i += 1) {
            const weekData = allDaysInWeek[i];
            if (weekData.purchaseDate.valueOf() === currentDate.valueOf()) {
                weekData.value = !item.value ? 0 : item.value;
                weekData.purchaseDate = _moment2.default.utc(weekData.purchaseDate, _moment2.default.ISO_8601);
                break;
            }
        }

        return item;
    });

    return allDaysInWeek.map(weekItem => ({
        value: weekItem.value,
        purchaseDate: _moment2.default.utc(weekItem.purchaseDate, _moment2.default.ISO_8601),
        purchaseDay: _moment2.default.utc(weekItem.purchaseDate, _moment2.default.ISO_8601).format('ddd')
    }));
}

async function notifyUser(userId, data, notification, fcm_details) {
    const androidFcmKeys = fcm_details.filter(fcm => fcm.platform_id === 1).map(user => ({ fcm_id: user.fcm_id, user_id: user.user_id }));
    const iosFcmKeys = fcm_details.filter(fcm => fcm.platform_id === 2).map(user => ({ fcm_id: user.fcm_id, user_id: user.user_id }));
    data.big_text = data.description;
    notification.big_text = notification.description;
    if (androidFcmKeys.length > 0) {
        await androidNotificationDispatcher(androidFcmKeys, fcm_details, data);
    }

    if (iosFcmKeys.length > 0) {
        await iosNotificationDispatcher(iosFcmKeys, fcm_details, notification, data);
    }

    return '';
}

async function iosNotificationDispatcher(iosFcmKeys, result, notification, data) {
    await iosFcmKeys.forEach(async (fcm_detail, index) => {
        await _bluebird2.default.try(() => setTimeout(((fcm_detail, notification, data, config) => () => {
            return (0, _request2.default)({
                uri: 'https://fcm.googleapis.com/fcm/send',
                method: 'POST',
                headers: { Authorization: `key=${config.GOOGLE.FCM_KEY}` },
                json: {
                    priority: 'high',
                    data,
                    registration_ids: [fcm_detail.fcm_id],
                    notification: notification || {
                        title: data.title,
                        body: data.description,
                        big_text: data.big_text || data.description
                    }
                }
            }, (error, response, body) => {
                if (error) {
                    console.log(error);
                }
                // extract invalid registration for removal
                if (body.failure > 0 && Array.isArray(body.results) && body.results.length === result.length) {
                    const results = body.results;
                    for (let i = 0; i < result.length; i += 1) {
                        if (results[i].error === 'InvalidRegistration') {
                            result[i].destroy().then(console.log);
                        }
                    }
                }
            });
        })(fcm_detail, notification, data, _main2.default), index * 50));
    });
}

async function androidNotificationDispatcher(androidFcmKeys, result, data) {
    await androidFcmKeys.forEach(async (fcm_detail, index) => {
        await _bluebird2.default.try(() => setTimeout(((fcm_detail, data, config) => () => {
            return (0, _request2.default)({
                uri: 'https://fcm.googleapis.com/fcm/send',
                method: 'POST',
                headers: { Authorization: `key=${config.GOOGLE.FCM_KEY}` },
                json: {
                    priority: 'high',
                    data,
                    registration_ids: [fcm_detail.fcm_id]
                }
            }, (error, response, body) => {
                if (error) {
                    console.log(error);
                }

                // extract invalid registration for removal
                if (body.failure > 0 && Array.isArray(body.results) && body.results.length === result.length) {
                    const results = body.results;
                    for (let i = 0; i < result.length; i += 1) {
                        if (results[i].error === 'InvalidRegistration') {
                            result[i].destroy().then(console.log);
                        }
                    }
                }
            });
        })(fcm_detail, data, _main2.default), index * 50));
    });
}

function preparePaymentDetails(parameters) {
    let {
        currentYear, monthItem, effectiveDate, selected_days,
        wages_type, serviceCalculationBody, user, currentDate
    } = parameters;
    const monthStartDate = (0, _moment2.default)([currentYear, 0, 1]).month(monthItem);
    let month_end_date = (0, _moment2.default)([currentYear, 0, 31]).month(monthItem);
    let end_date = (0, _moment2.default)([currentYear, 0, 31]).month(monthItem);
    let start_date = effectiveDate;
    if (monthStartDate.isAfter(effectiveDate)) {
        start_date = monthStartDate;
    }
    currentDate = (0, _moment2.default)(currentDate || (0, _moment2.default)()).startOf('days');
    if (end_date.isAfter(currentDate)) {
        end_date = currentDate.endOf('days');
    }

    if (end_date.isBefore(start_date)) {
        end_date = (0, _moment2.default)(start_date).endOf('days');
    }

    const daysInMonth = (0, _moment2.default)().isoWeekdayCalc(monthStartDate, month_end_date, selected_days);
    const daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD'), selected_days);
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
        monthItem
    });
    let total_amount = unit_price * daysInPeriod;
    if (serviceCalculationBody.quantity || serviceCalculationBody.quantity === 0) {
        total_amount = serviceCalculationBody.quantity * total_amount;
    }
    total_amount = total_amount.toFixed(2);
    return {
        start_date,
        end_date,
        updated_by: user.id || user.ID,
        status_type: 1,
        total_amount: parseFloat(total_amount),
        total_days: daysInPeriod,
        total_units: serviceCalculationBody.quantity ? daysInPeriod * serviceCalculationBody.quantity : 0,
        amount_paid: 0
    };
}

function monthlyPaymentCalc(parameters) {
    let { currentMth, effectiveDate, selected_days, wages_type, serviceCalculationBody, user, currentYear, currentDate } = parameters;
    const monthDiff = (0, _moment2.default)().startOf('months').diff((0, _moment2.default)(effectiveDate, _moment2.default.ISO_8601).startOf('months'), 'months');
    console.log('\n\n\n\n\n\n\n\n\n\n monthdiff:', monthDiff);
    const monthArr = [];
    if ((0, _moment2.default)().isAfter((0, _moment2.default)(effectiveDate, _moment2.default.ISO_8601), 'months')) {
        for (let i = monthDiff; i >= 0; i--) {
            monthArr.push(currentMth - i);
        }
    } else {
        monthArr.push(currentMth);
    }

    return monthArr.map(monthItem => {
        return preparePaymentDetails({
            currentYear,
            monthItem,
            effectiveDate,
            selected_days, wages_type,
            serviceCalculationBody,
            user,
            currentDate
        });
    });
}

function retrieveMailTemplate(user, templateType) {
    switch (templateType) {
        case 0:
            {
                const verificationUrl = `https://www.binbill.com/dashboard?verificationId=${user.email_secret}`;
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>BinBill</title>
    <style>
        @font-face {
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

        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
            background: #cecece;
        }

        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }

        table,
        td {
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
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

        *[x-apple-data-detectors],
        /* iOS */

        .x-gmail-data-detectors,
        /* Gmail */

        .x-gmail-data-detectors *,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            /* text-decoration: none !important; */
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

        img.g-img+div {
            display: none !important;
        }

        /* What it does: Prevents underlining the button text in Windows 10 */

        .button-link {
            text-decoration: none !important;
        }

        /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */

        /* Create one of these media queries for each additional viewport size you'd like to fix */

        /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */

        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            /* iPhone 6 and 6+ */
            .email-container {
                min-width: 375px !important;
            }
        }
    </style>
    <!-- CSS Reset : END -->

    <!-- Progressive Enhancements : BEGIN -->
    <style>
        /* What it does: Hover styles for buttons */

        .button-td,
        .button-a {
            transition: all 100ms ease-in;
        }

        .button-td:hover,
        .button-a:hover {
            background: #555555 !important;
            border-color: #555555 !important;
        }

        /* Media Queries */

        @media screen and (max-width: 600px) {

            /* What it does: Adjust typography on small screens to improve readability */
            .email-container p {
                line-height: 22px !important;
            }
        }
    </style>
</head>
<body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;">
    <center style="width: 100%; background: #cecece; text-align: left;">
        <div style="max-width: 600px; margin: auto;" class="email-container">
            <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%"
                background-color="white" style="max-width: 600px;">
                <tr>
                    <td style="padding:0 15px;" class="text-left">
                        <div style="padding:20px 0 0 0;">
                            <img src="https://binbill.com/static/images/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
                            <p style="font-family: 'Quicksand', sans-serif;
                            font-size: 12px; padding: 0; margin: 0;
                            font-weight: bold;">Your Own Home Manager</p>
                        </div>
                    </td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px;">
                <tr>
                    <td bgcolor="#ffffff">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="padding: 20px; font-family: sans-serif; font-size: 15px;line-height: 20px; color: #555555;">
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-size: 14px;font-weight: bold;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 20px 0;">
                                        Hello${user && user.name ? `${user.name}` : ''}, </p>
                                        <p style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;"> We are happy that you have decided to hop on for the easy ride to Manage Your Home!
                                        </p>
                                        <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;padding: 20px 0px;">
                                            For security purpose, please verify your email address by clicking below:-
                                        </p>
                                        <p style="margin-top:0px;text-align:center;margin-bottom:30px;">
                                            <a href="${verificationUrl}">
                                            <button type="button" style="
                                            background-color: #5070ff;
                                            border-radius: 20px;
                                            border: 1px solid #5070ff;
                                            color: white;
                                            padding: 8px 40px;
                                            font-weight: bold;
                                            font-size: 16px;cursor:pointer;">Verify</button>
                                        </a>
                                    </p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;">
                                        Your Home Manager is keen to assist you!
                                    </p>

                                    <p style="margin:0 auto;-webkit-margin-before: 0;margin-top:20px; -webkit-margin-after: 0;font-size:15px;font-weight:normal;">
                                        For any queries, you can either visit our FAQ section in the App or on the website, or write to us at
                                        <a href="mailto:support@binbill.com" style="color:#555555;">support@binbill.com</a>
                                    </p>

                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%"
                background-color="white" style="max-width: 600px;">
                <tr>
                    <td style="padding:0px 15px;padding-bottom:25px" class="text-left">
                        <p style="padding-top:0px;font-weight:bold;margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-size: 15px;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 0px 0px 10px 5px;">
                            The BinBill Team
                        </p>
                    </td>
                    <td style="text-align:center;">
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>
</html>`;
            }
        case 1:
            {
                console.log('Welcome Mail Going to Send Now');
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>BinBill</title>
    <style>
        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
            background: #cecece;
        }

        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }

        table,
        td {
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
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

        *[x-apple-data-detectors],
        /* iOS */

        .x-gmail-data-detectors,
        /* Gmail */

        .x-gmail-data-detectors *,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            /* text-decoration: none !important; */
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

        img.g-img+div {
            display: none !important;
        }

        /* What it does: Prevents underlining the button text in Windows 10 */

        .button-link {
            text-decoration: none !important;
        }

        /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */

        /* Create one of these media queries for each additional viewport size you'd like to fix */

        /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */

        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            /* iPhone 6 and 6+ */
            .email-container {
                min-width: 375px !important;
            }
        }
    </style>
    <!-- CSS Reset : END -->
    <!-- Progressive Enhancements : BEGIN -->
    <style>
        /* What it does: Hover styles for buttons */

        .button-td,
        .button-a {
            transition: all 100ms ease-in;
        }

        .button-td:hover,
        .button-a:hover {
            background: #555555 !important;
            border-color: #555555 !important;
        }

        /* Media Queries */
        @media screen and (max-width: 600px) {

            /* What it does: Adjust typography on small screens to improve readability */
            .email-container p {
                line-height: 22px !important;
            }
        }
    </style>
</head>
<body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;">
    <center style="width: 100%; background: #cecece; text-align: left;">
        <div style="max-width: 600px; margin: auto;" class="email-container">
            <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%"
                background-color="white" style="max-width: 600px;">
                <tr>
                    <td style="padding:0px 15px;; text-align:left   ">
                        <div style="padding:20px 0px 0px 0px;">
                            <img src="https://binbill.com/static/images/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
                            <p style="font-family: 'Quicksand', sans-serif;
                            font-size: 12px;
                            padding: 0px;
                            margin: 0px;
                            font-weight: bold;">Your Own Home Manager</p>
                        </div>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px;">
                <tr>
                    <td bgcolor="#ffffff">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="font-family: sans-serif; font-size: 15px;line-height: 20px; color: #555555;">
                                    <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif;font-weight: bold;font-size:22px;text-align: left;
                                    color: #ff732e;padding-top:30px;padding-left:20px;padding-right:20px;">Welcome to BinBill!</p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family:
                                        'Quicksand', sans-serif;font-size: 14px;font-weight: bold;letter-spacing: 0.3px;text-align: left;color:
                                        #3b3b3b; padding: 20px; ">
                                        Hello${user.name ? ` ${user.name}` : ''},</p>
                                    <p style="-webkit-margin-before: 0;margin-bottom: 5% !important;
                                        -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; ">
                                        We are glad to have you on board! Your Home Manager will assist you with your <b>daily life and struggles to manage your Home smarter and live better.</b> Here are some popular features that make BinBill your life saver:
                                    </p>
                                    <ul><li style="-webkit-margin-before: 0;margin-bottom: 5% !important;
                                        -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; "><b>Instant Groceries:</b> Need some grocery in an instant? Create your Shopping List and connect with your local kirana store online for quick, on demand grocery needs!</li>
                                    ${user.location && user.location.toLowerCase() !== 'other' ? '<li style="-webkit-margin-before: 0;margin-bottom: 5% !important; -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; "><b>Cashback on every Grocery Bill:</b> Now upload your Grocery Bill to avail a Fixed Cashback & Bonus Cashback on multiple items.</li>' : ''}
                                    <li style="-webkit-margin-before: 0;margin-bottom: 5% !important;
                                        -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; "><b>Attractive Loyalty Points & Offers:</b> Connect with your local Kirana Stores for Loyalty Discounts & be the first to know of ongoing Attractive Offers.</li>
                                    <li style="-webkit-margin-before: 0;margin-bottom: 5% !important;
                                        -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; "><b>Track Product Lifecycle:</b> Want to avoid missing out on Warranty, Insurance or AMC? Your BinBill eHome saves all product details for important timely reminders and assists you with After Sales Information.</li>
                                    <li style="-webkit-margin-before: 0;margin-bottom: 5% !important;
                                        -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; "><b>Expense Insights:</b> Don’t know where your expenses are going?! BinBill helps you track your expenses & lends helpful expense insights.</li>
                                    <li style="-webkit-margin-before: 0;margin-bottom: 5% !important;
                                        -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;padding-left:20px;padding-right:20px; "><b>Bills & Documents’ Record:</b> Worried about a lost document or bill? No more. Save all your bills and important documents with us and don’t worry about your privacy and safety.</li></ul>         
                                    <table>
                                        <tr>
                                            <td style="background: #c3c1c1;
                                            text-align: center;
                                            padding: 10px 20px 10px 10px;
                                            font-weight: normal;">
                                                <p style="width: 95%;
                                                margin: 0 auto;">So sit back and enjoy the easy ride with Your Own Home Manager.</p>
                                                <a href="https://g8fb8.app.goo.gl/oCXm">
                                                    <button type="button" style="background-color: #5070ff; border-radius: 20px; border: 1px solid
                                                    #5070ff; color: white; padding: 10px 20px; margin-top: 2%; margin-bottom: 1%;font-weight:bold">Visit Your Home Manager</button>
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;padding:
                                        20px; ">
                                        Don’t forget to visit our FAQ section within our App or website for all your queries.
                                    </p>
                                    <p style="padding-left:20px;padding-right:20px;margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal; ">
                                        I would love to hear your suggestions or any unanswered query that you may have.
                                    </p>
                                    <p style="padding-left:20px;padding-right:20px;margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal; ">
                                        You could reach me at
                                        <a href="mailto:rohit@binbill.com " style="color:#555555; ">rohit@binbill.com</a> or call us at
                                        <a href="callto:+91-124-4343177 " style="color:#555555; ">+91-124-4343177</a>.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <table role="presentation " cellspacing="0 " cellpadding="0 " style="background:white; " border="0
                                        " align="center " width="100% " background-color="white " style="max-width: 600px; ">
                <tr>
                    <td style="padding:0px 15px;padding-bottom:25px;">
                        <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/signature.png" alt="signature" style="margin-top:12%;    height: 32px;
                            width: 58px;">
                        <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after:
                                        0; font-family: 'Quicksand', sans-serif;font-size: 15px;font-weight: normal;letter-spacing:
                                        0.3px;text-align: left;color: #3b3b3b; padding: 0px 0px 10px 0px; ">
                            Cheers,
                            <br>
                            <span style="font-weight:bold">Rohit Kumar</span>
                            <br>
                            <span style="font-weight:bold">CEO, BinBill</span>
                        </p>
                    </td>
                    <!--<td style="text-align:center; ">
                        <div style="padding:20px 0px 0px 0px; ">
                            <img src="https://binbill.com/static/images/logo-color.png " width="150 " height="auto
                                        " alt="alt_text " border="0 " style="height: auto; font-family: sans-serif; font-size: 15px;
                                        line-height: 20px; color: #555555; ">
                        </div>
                    </td>-->
                </tr>
            </table>
        </div>
    </center>
</body>
</html>`;
            }
        case 2:
            {
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}.btns{width: 100px; max-height: 60px;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}}</style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ @media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}}</style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div style="border:1px solid black;" class="email-container"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" background-color="white" > <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px; text-align: left; color: #ff732e;padding-top:10px; "> Start building your eHome </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name || 'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;"> We are delighted to see that you have started building you you eHome. Our servers are doing the magic for you, creating reminders, updates or smartly categorising your bill for you. Till then why don’t you browse through our application, and get familiar with features of your new eHome. Did you know that you can: </p><div style="width:100%;"> <div style="width:50%;float:left;"> <p style="display: inline-block; width: 80%; font-family: 'Quicksand',sans-serif; font-size: 45px; font-weight: 700; text-align: left; color: rgba(255, 115, 46, 0.3); padding: 10px; margin: 0 auto;"> #1 </p><p class="main-class" style="display: inline-block; width: 80%; font-family: 'Quicksand',sans-serif;font-weight: 700; line-height: 1.4; letter-spacing: 0.3px; text-align: left; color: #9c9c9c; padding: 10px; margin: 0 auto;"> Build a personal catalogue of your important documents apart from storing bills. </p><a href="https://www.binbill.com/upload" style="text-decoration:none;"> <p class="btns" style="margin-bottom:4%;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 10px 20px;font-size: 10px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Upload Now<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 19px;margin-top: -4px;"> </p></a> </div><div style="width:50%;float:left;"> <p style="display: inline-block; width: 80%; font-family: 'Quicksand',sans-serif; font-size: 45px; font-weight: 700; text-align: left; color: rgba(255, 115, 46, 0.3); padding: 10px; margin: 0 auto;"> #2 </p><p class="main-class" style="display: inline-block; width: 92%; font-family: 'Quicksand',sans-serif;font-weight: 700; line-height: 1.4; letter-spacing: 0.3px; text-align: left; color: #9c9c9c; padding: 10px; margin: 0 auto;"> Contact your manufacturer, or locate your nearest authorised service centre. Check your dealer: </p><a href="https://www.binbill.com/asc" style="text-decoration:none;"> <p class="btns"style="margin-bottom:4%;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 10px 20px;font-size: 10px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Locate<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 19px;margin-top: -4px;"> </p></a> </div></div><br><br><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> The list of activities that you can do with BinBill is long, and never-exhausting, you can also receive useful expense insights, reminders for warranty and renewals, or locate the nearest authorize service center. </p><p class="main-class" style="margin-top:4%; "> We will be soon listing your bill in your eHome for you. Till then enjoy hassle-free bill management and keep adding more bills for a carefree life. </p><p class="main-class" style="margin-top: 2%; margin-bottom: 16px;"> Where there is a bill, there is BinBill! </p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> Regards<br>BinBill Team </p></td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
            }
        case 3:
            {
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}.mains-class{font-size:16px;}}@media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}.mains-class{font-size:11px;}}</style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ </style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div style="border:1px solid black;" class="email-container"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" background-color="white"> <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px; text-align: left; color: #ff732e;padding-top:10px; "> Bill is being processed </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name || 'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;"> It’s great to see you building your eHome, bill by bill. So that you don’t have to stress much, we are processing it in the backend, applying the required filters, and final touches. </p><ul class="mains-class" style="text-indent:-12px;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;margin-top: 0;margin-bottom: 1rem;font-family: 'Quicksand', sans-serif;font-weight: 700;line-height: 1.45;text-align: left;color: #3b3b3b;list-style: none;"> <li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Smartly Store All Your Bills in Your eHome.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Useful Expense Insights.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Reminders for Warranty, Renewals etc.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Connect with the Sellers for various after sales needs.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Locate Nearest Authorized Service Centers and much more.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Build a personal catalogue of your important documents apart from storing bills. </li></ul> <p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> We will be soon listing your bill in your eHome for you. Till then enjoy hassle-free bill management and keep adding more bills for a carefree life. </p><a href="https://www.binbill.com/ehome" style="text-decoration:none;"> <p style="width: 200px;max-height: 60px;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 15px 20px;margin-bottom: 0;font-size: 12px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Take me to my eHome <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 100%!important;margin-top: -4px;"> </p></a> <p class="main-class" style="margin-top: 2%; margin-bottom: 16px;"> Where there is a bill, there is BinBill! </p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> Regards<br>BinBill Team </p></td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
            }
        case 4:
            {
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width: 100%;}.main-class{font-size:16px;}.mains-class{font-size: 16px;}}@media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px;}.main-class{font-size:12px;}.mains-class{font-size: 11px;}}</style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ </style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"> <center style="width: 100%; background: #cecece; text-align: left;"> <div style="border:1px solid black;" class="email-container"> <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%" background-color="white"> <tr> <td style="padding:0 15px;" class="text-left"> <div style="padding:20px 0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </div></td><td style="text-align:right; position:absolute;right:0;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/email-header.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"> <tr> <td bgcolor="#ffffff"> <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"> <tr> <td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"> <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0 0;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif; font-weight: 500;font-size:22px;line-height:22px; text-align: left; color: #ff732e;padding-top:10px; "> Congrats! Your first bill has been added in your eHome. </p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi ${user.name || 'User'},</p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;padding-top: 10px; padding-bottom: 15px;"> We would love to see your eHome grow, and we thought of sharing with you tips on what more can you do with your eHome. </p><ul class="mains-class" style="text-indent:-12px;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;margin-top: 0;margin-bottom: 1rem;font-family: 'Quicksand', sans-serif;font-weight: 700;line-height: 1.45;letter-spacing: 0.3px;text-align: left;color: #3b3b3b;list-style: none;"> <li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Smartly Store All Your Bills in Your eHome.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Useful Expense Insights.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Receive Reminders for Warranty, Renewals etc.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Connect with the Sellers for various after sales needs.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Locate Nearest Authorized Service Centers and much more.</li><li style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <p style="line-height: 1.4;-webkit-margin-before: 0; -webkit-margin-after: 0; margin:0 auto;color: #ff732e; padding-right: 10px;display: inline-block;">▸</p>Build a personal catalogue of your important documents apart from storing bills. </li></ul> <p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> We look forward to processing more bills for you, keep adding bills to your eHome, and happiness in your life. </p><p class="main-class" style="margin-top: 2%; margin-bottom: 16px;"> Where there is a bill, there is BinBill! </p><p class="main-class" style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;"> Regards<br>BinBill Team </p><a href="https://www.binbill.com/ehome" style="text-decoration:none;"> <p style="width: 200px;max-height: 60px;border-radius: 100px;background-image: linear-gradient(256deg, #ff622e, #ff822e);box-shadow: 0 5px 15px 0 rgba(180, 75, 35, 0.35);color: #ffffff;padding: 15px 20px;margin-bottom: 0;font-size: 12px;font-weight: 700;line-height: 1.25;text-align: left;font-family: 'Quicksand', sans-serif;letter-spacing: 1px;text-decoration: none;"> Take me to my eHome <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/white.png" alt="arrow" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;border: 0;vertical-align: middle;page-break-inside: avoid;border-style: none;float: right;font-size: 1.25rem;max-width: 100%!important;margin-top: -4px;"> </p></a> </td></tr></table> </td></tr></table> <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background:linear-gradient(256deg, #56BDFE, rgb(51, 137, 233)); font-family: sans-serif; color: white; line-height:18px;"> <tr> <td class="main-class" style="padding: 25px 10px;width: 100%; font-family: sans-serif; line-height:18px; text-align: center; color: white;" class="x-gmail-data-detectors"> <p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: white"> We look forward to serving you better. For any queries, you can either visit our <a href="https://www.binbill.com/faq" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u class="main-class" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">FAQs</u> </a> section, or write to us at <a href="mailto:support@binbill.com" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color:white;text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;"> <u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;">support@binbill.com</u> </a> </p><p style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color:white; padding: 20px 0 0 0;"> Where there is a bill, there is BinBill! <br><u style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;"> <b style="-webkit-box-sizing: border-box;font-weight:bold;-moz-box-sizing: border-box;box-sizing: inherit;"> The BinBill Team </b> </u> </p></td></tr><tr style="border-top:1px solid white"> <td> <p class="center" style="margin:0 auto;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;orphans: 3;widows: 3;-webkit-margin-before: 0; -webkit-margin-after: 0;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;color: rgba(255, 255, 255, 1);padding-top: 15px;padding-bottom: 15px;"> <a href="https://www.facebook.com/binbill.ehome/?ref=br_rs" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook%403x.png" alt="fb-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://twitter.com/binbill_ehome" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter-logo.png" alt="tweet-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.instagram.com/binbill_ehome/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/instagram-logo.png" alt="insta-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a> <a href="https://www.linkedin.com/company/13320885/" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;background-color: transparent;color: rgba(255, 255, 255, 1);text-decoration: none;-webkit-text-decoration-skip: objects;-ms-touch-action: manipulation;touch-action: manipulation;font-family: 'Quicksand', sans-serif;font-size: 1.125rem;line-height: 1.44;letter-spacing: 0.3px;text-align: center;padding-left: 30px;"> <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin-logo.png" alt="in-binbill" style="-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: inherit;vertical-align: middle;page-break-inside: avoid;border: 0 none;max-width: 100%!important; width: 23px;"> </a></p></td></tr></div></center></body></html>`;
            }
        case 5:
            {
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>BinBill</title>
    <style>
        @font-face {
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

        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
            background: #cecece;
        }

        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }

        table,
        td {
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
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

        *[x-apple-data-detectors],
        /* iOS */

        .x-gmail-data-detectors,
        /* Gmail */

        .x-gmail-data-detectors *,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            /* text-decoration: none !important; */
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

        img.g-img+div {
            display: none !important;
        }

        /* What it does: Prevents underlining the button text in Windows 10 */

        .button-link {
            text-decoration: none !important;
        }

        /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */

        /* Create one of these media queries for each additional viewport size you'd like to fix */

        /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */

        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            /* iPhone 6 and 6+ */
            .email-container {
                min-width: 375px !important;
            }
        }
    </style>
    <!-- CSS Reset : END -->
    <!-- Progressive Enhancements : BEGIN -->
    <style>
        /* What it does: Hover styles for buttons */

        .button-td,
        .button-a {
            transition: all 100ms ease-in;
        }

        .button-td:hover,
        .button-a:hover {
            background: #555555 !important;
            border-color: #555555 !important;
        }

        /* Media Queries */

        @media screen and (max-width: 600px) {
            /* What it does: Adjust typography on small screens to improve readability */
            .email-container p {
                line-height: 22px !important;
            }
        }
    </style>
</head>
<body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;">
    <center style="width: 100%; background: #cecece; text-align: left;">
        <div style="max-width: 600px; margin: auto;" class="email-container">
            <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%"
                background-color="white" style="max-width: 600px;">
                <tr>
                    <td style="padding:0px 15px;" class="text-left">
                        <div style="padding:20px 0px 0px 0px;">
                            <img src="https://binbill.com/static/images/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
                        </div>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px;">
                <tr>
                    <td bgcolor="#ffffff">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="padding: 20px; font-family: sans-serif; font-size: 15px;line-height: 20px; color: #555555;">
                                    <!-- <hr class="title-border" style="-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;height: 0;margin:15px 15px 0px 0px;border: 0;border-top: 5px solid #ff732e;overflow: visible;width: 8.33333333%"> -->
                                    <p style="margin: 0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;color: #ff732e;font-family: 'Quicksand', sans-serif;
                font-weight: bold;font-size:22px;
                                    text-align: left;
                                    color: #ff732e;padding-top:10px;">Your product is our responsibility now!</p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family:
                                        'Quicksand', sans-serif;font-size: 14px;font-weight: bold;letter-spacing: 0.3px;text-align: left;color:
                                        #3b3b3b; padding: 20px 0; ">
                                        Hello${user.name ? ` ${user.name}` : ''},</p>
                                    <p style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px; "> Congratulations on adding your product in your eHome!
                                    </p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;padding:
                                        20px 0px; ">
                                        From here onwards, your product is our responsibility. We will ensure all timely and important updates and make your warranty
                                        renewal/AMC renewal/repair process a smooth ride.
                                    </p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;padding:
                                        20px 0px 5px 0px; ">
                                        Just to ensure you don’t miss out on these crucial dates on any other product, add them all in your eHome.
                                    </p>
                                    <a href="https://www.binbill.com/add-product">
                                        <button type="button" style=" margin-right: 10%; background-color: #5070ff; border-radius: 20px; border: 1px solid
                                            #5070ff; color: white; padding: 10px 20px; margin-top: 2%; margin-bottom: 4%;font-weight:bold">Add More Products</button>
                                    </a>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal; ">
                                        To know more about eHome benefits, visit our FAQs within the App or on website.
                                    </p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:14px;font-weight:normal; ">
                                        We would love to hear from you at
                                        <a href="mailto:support@binbill.com " style="color:#555555; ">support@binbill.com</a> or call us at
                                        <a href="callto:+91-124-4343177 " style="color:#555555; ">+91-124-4343177</a>.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <table role="presentation " cellspacing="0 " cellpadding="0 " style="background:white; " border="0
                                        " align="center " width="100% " background-color="white " style="max-width: 600px; ">
                <tr>
                    <td style="padding:0px 15px;padding-bottom:25px " class="text-left ">
                        <p style="margin:0 auto;margin-top:12% !important;-webkit-margin-before: 0; -webkit-margin-after:
                                        0; font-family: 'Quicksand', sans-serif;font-size: 15px;font-weight: normal;letter-spacing:
                                        0.3px;text-align: left;color: #3b3b3b; padding: 10px 0; ">
                            Cheers,
                            <br>
                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/signature.png" width="100" height="auto">
                            <br>
                            <span style="font-weight:bold">Rohit Kumar</span>
                            <br>
                            <span style="font-weight:bold">CEO, BinBill</span>
                        </p>
                    </td>
                    <td style="text-align:center; ">
                        <div style="padding:20px 0px 0px 0px; ">
                            <img src="https://binbill.com/static/images/logo-color.png " width="150 " height="auto
                                        " alt="alt_text " border="0 " style="height: auto; font-family: sans-serif; font-size: 15px;
                                        line-height: 20px; color: #555555; ">
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>
</html>`;
            }
        default:
            {
                const verificationUrl = `https://www.binbill.com/dashboard?verificationId=${user.email_secret}`;
                return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>BinBill</title>
    <style>
        @font-face {
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

        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
            background: #cecece;
        }

        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }

        table,
        td {
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
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

        *[x-apple-data-detectors],
        /* iOS */

        .x-gmail-data-detectors,
        /* Gmail */

        .x-gmail-data-detectors *,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            /* text-decoration: none !important; */
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

        img.g-img+div {
            display: none !important;
        }

        /* What it does: Prevents underlining the button text in Windows 10 */

        .button-link {
            text-decoration: none !important;
        }

        /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */

        /* Create one of these media queries for each additional viewport size you'd like to fix */

        /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */

        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            /* iPhone 6 and 6+ */
            .email-container {
                min-width: 375px !important;
            }
        }
    </style>
    <!-- CSS Reset : END -->

    <!-- Progressive Enhancements : BEGIN -->
    <style>
        /* What it does: Hover styles for buttons */

        .button-td,
        .button-a {
            transition: all 100ms ease-in;
        }

        .button-td:hover,
        .button-a:hover {
            background: #555555 !important;
            border-color: #555555 !important;
        }

        /* Media Queries */

        @media screen and (max-width: 600px) {

            /* What it does: Adjust typography on small screens to improve readability */
            .email-container p {
                line-height: 22px !important;
            }
        }
    </style>
</head>
<body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;">
    <center style="width: 100%; background: #cecece; text-align: left;">
        <div style="max-width: 600px; margin: auto;" class="email-container">
            <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%"
                background-color="white" style="max-width: 600px;">
                <tr>
                    <td style="padding:0px 15px;" class="text-left">
                        <div style="padding:20px 0px 0px 0px;">
                            <img src="https://binbill.com/static/images/logo-color.png" width="150" height="auto" alt="alt_text" border="0" style="height: auto; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;">
                            <p style="font-family: 'Quicksand', sans-serif;
                            font-size: 12px;
                            padding: 0px;
                            margin: 0px;
                            font-weight: bold;">Your Own Home Manager</p>
                        </div>
                    </td>

                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px;">
                <tr>
                    <td bgcolor="#ffffff">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="padding: 20px; font-family: sans-serif; font-size: 15px;line-height: 20px; color: #555555;">
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-size: 14px;font-weight: bold;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 20px 0;">
                                        Hello (UserName), </p>
                                    <p style="-webkit-margin-before: 0; -webkit-margin-after: 0;margin:0 auto;font-weight:normal;font-size:15px;"> We are happy that you have decided to hop on for the easy ride to Manage Your Home!
                                    </p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;padding: 20px 0px;">
                                        For security purpose, please verify your email address by clicking below:-
                                    </p>
                                    <p style="margin-top:0px;text-align:center;margin-bottom:30px;">
                                        <a href="${verificationUrl}">
                                            <button type="button" style="
                                            background-color: #5070ff;
                                            border-radius: 20px;
                                            border: 1px solid #5070ff;
                                            color: white;
                                            padding: 8px 40px;
                                            font-weight: bold;
                                            font-size: 16px;cursor:pointer;">Verify</button>
                                        </a>
                                    </p>
                                    <p style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;font-size:15px;font-weight:normal;">
                                        Your Home Manager is keen to assist you!
                                    </p>

                                    <p style="margin:0 auto;-webkit-margin-before: 0;margin-top:20px; -webkit-margin-after: 0;font-size:15px;font-weight:normal;">
                                        For any queries, you can either visit our FAQ section in the App or on the website, or write to us at
                                        <a href="mailto:support@binbill.com" style="color:#555555;">support@binbill.com</a>
                                    </p>

                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="background:white;" border="0" align="center" width="100%"
                background-color="white" style="max-width: 600px;">
                <tr>
                    <td style="padding:0px 15px;padding-bottom:25px" class="text-left">
                        <p style="padding-top:0px;font-weight:bold;margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-size: 15px;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 0px 0px 10px 5px;">
                            The BinBill Team
                        </p>
                    </td>
                    <td style="text-align:center;">
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>

</html>`;
            }
    }
}

const formatDate = (actualValue, dateFormatString) => (0, _dateformat2.default)(actualValue, dateFormatString);
const prepareUrl = (basePath, ...relPath) => (0, _urlJoin2.default)(basePath, ...relPath);
const queryStringFromObject = queryObject => (0, _querystring.stringify)(queryObject);
const retrieveHeaderValue = headers => ({
    authorization: verifyParameters({
        rootNode: headers,
        currentField: authorizationParamConst,
        defaultValue: emptyString
    }),
    CorrelationId: _uuid2.default.v4()
});

const iterateToCollection = (collection, callback, ...relativeItems) => {
    const result = [];
    _lodash2.default.forEach(collection, item => result.push(callback(item, relativeItems[0])));

    return result;
};

const stringHasSubString = (stringItem, subString) => _lodash2.default.includes(stringItem, subString);

const preValidation = (preRequest, reply) => {
    if (preRequest.userExist === 0) {
        return reply.response({
            status: false,
            message: 'Inactive User',
            forceUpdate: preRequest.forceUpdate
        }).code(402);
    } else if (!preRequest.userExist) {
        return reply.response({
            status: false,
            message: 'Unauthorized',
            forceUpdate: preRequest.forceUpdate
        }).code(401);
    }

    return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: preRequest.forceUpdate
    });
};

function logError(request, user, err, modals) {
    modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
        })
    }).catch(ex => console.log('error while logging on db,', ex));
}

exports.default = {
    readJSONFile,
    formatDate,
    prepareUrl,
    verifyParameters, isAccessTokenBasic,
    queryStringFromObject,
    verifyAuthorization,
    retrieveHeaderValue,
    iterateToCollection,
    stringHasSubString,
    getAllDays,
    sumProps,
    retrieveDaysInsight,
    retrieveMailTemplate,
    preValidation,
    logError
};