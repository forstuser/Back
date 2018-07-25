/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import config from '../../config/main';
import ProductAdaptor from './product';
import AMCAdaptor from './amcs';
import PUCAdaptor from './pucs';
import InsuranceAdaptor from './insurances';
import WarrantyAdaptor from './warranties';
import RepairAdaptor from './repairs';
import smtpTransport from 'nodemailer-smtp-transport';
import _ from 'lodash';
import nodemailer from 'nodemailer';
import request from 'request';
import moment from 'moment';
import requestPromise from 'request-promise';
import Promise from 'bluebird';

class NotificationAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.pucAdaptor = new PUCAdaptor(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
  }

  static sendUserCommentToTeam(subject, userData) {
    const smtpTransporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASSWORD,
      },
      secure: true,
      port: 465,
    }));

    // setup email data with unicode symbols
    const mailOptions = {
      from: `"BinBill" <${config.EMAIL.USER}>`, // sender address
      to: config.EMAIL.TEAM_EMAIL, // list of receivers
      subject,
      html: `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 400; src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 500; src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format('woff2'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: 'Quicksand'; font-style: normal; font-weight: 700; src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn't work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you'd like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}}/* @media only screen and (min-device-width: 375px) and (max-device-width: 413px){/* iPhone 6 and 6+ */ /* .email-container{min-width: 375px !important;}*/ </style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ @media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}}</style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"><center style="width: 100%; background: #cecece; text-align: left;"><div style="border:1px solid black;" class="email-container"><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td bgcolor="#ffffff"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;">Dear Team,</p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">We have received a comment from user ${userData.name} (Phone: ${userData.phone}, Email: ${userData.email}), which is as follow:</p><q class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">${userData.message}</q><p style="margin:0 auto; font-weight: bold; -webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">
                                    One Home : Multiple Needs : One App</p><p style="margin:0 auto; -webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">Regards<br/>Support BinBill </p><img style="width: 100px" atr="logo" src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png"/></td></tr></table></td></tr></table></div></center></body></html>`,
    };

    smtpTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(
            `Error on ${new Date()} is as follow: \n \n ${error}`);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }

  static sendVerificationMail(email, user) {
    const smtpTransporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASSWORD,
      },
      secure: true,
      port: 465,
    }));

    // setup email data with unicode symbols
    const mailOptions = {
      from: `"BinBill" <${config.EMAIL.USER}>`, // sender address
      to: email, // list of receivers
      subject: 'BinBill Email Verification',
      html: shared.retrieveMailTemplate(user, 0),
    };

    // send mail with defined transport object
    smtpTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(
            `Error on ${new Date()} is as follow: \n \n ${error}`);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }

  static sendMailOnUpload(subject, email) {
    const smtpTransporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASSWORD,
      },
      secure: true,
      port: 465,
    }));

    // setup email data with unicode symbols
    const mailOptions = {
      from: `"BinBill" <${config.EMAIL.USER}>`, // sender address
      to: email, // list of receivers
      subject,
      html: `<p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi Team,</p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: 'Quicksand', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> New Job has been added on Admin.</p>`,
    };

    // send mail with defined transport object
    smtpTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(
            `Error on ${new Date()} is as follow: \n \n ${error}`);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }

  static sendMailOnDifferentSteps(subject, email, user, stepId) {
    const smtpTransporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASSWORD,
      },
      secure: true,
      port: 465,
    }));

    // setup email data with unicode symbols
    const mailOptions = {
      from: `"BinBill" <${config.EMAIL.USER}>`, // sender address
      to: email, // list of receivers
      subject,
      html: shared.retrieveMailTemplate(user, stepId),
    };

    // send mail with defined transport object
    smtpTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(
            `Error on ${new Date()} is as follow: \n \n ${error}`);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }

  static verifyCaptcha(response) {
    const options = {
      uri: config.GOOGLE.SITE_VERIFY,
      formData: {
        secret: config.GOOGLE.SECRET,
        response,
      },
      method: 'POST',
      timeout: 170000,
      json: true, // Automatically parses the JSON string in the response
    };
    return requestPromise(options).then((response) => {
      return !!response.success;
    }).catch((error) => {
      console.log(`Error on ${new Date()} is as follow: \n \n ${error}`);
      return false;
    });
  }

  static sendLinkOnMessage(phoneNo) {
    const options = {
      uri: 'http://api.msg91.com/api/sendhttp.php',
      qs: {
        authkey: config.SMS.AUTH_KEY,
        sender: 'BINBIL',
        flash: 0,
        mobiles: `91${phoneNo}`,
        message: `Hey there, \nPlease click on the link to download BinBill App and start building your eHome : http://bit.ly/2rIabk0 \nNow Get Every Product, Each Detail and All Action In One Place - Your eHome..`,
        route: 4,
        country: 91,
        response: 'json',
      },
      timeout: 170000,
      json: true, // Automatically parses the JSON string in the response
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        // request was success, should early return response to client
        return {
          status: true,
        };
      } else {
        console.log(`Error on ${new Date()} is as follow: \n \n ${error}`);
      }
    });
  }

  async retrieveNotifications(user, request) {
    try {
      const result = await Promise.all([
        this.filterUpcomingService(user, request),
        this.prepareNotificationData(user),
      ]);
      const upcomingServices = result[0].map((elem) => {
        if (elem.productType === 4) {
          const dueAmountArr = elem.productMetaData.filter((e) => {
            return e.name.toLowerCase() === 'due amount';
          });

          if (dueAmountArr.length > 0) {
            elem.value = dueAmountArr[0].value;
          }
        }

        return elem;
      });
      /* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */

      upcomingServices.sort((a, b) => {
        let aDate;
        let bDate;

        aDate = a.expiryDate;
        bDate = b.expiryDate;

        if (a.productType === 1) {
          aDate = a.dueDate;
        }

        if (b.productType === 1) {
          bDate = b.dueDate;
        }

        if (moment.utc(aDate, 'YYYY-MM-DD').
            isBefore(moment.utc(bDate, 'YYYY-MM-DD'))) {
          return -1;
        }

        return 1;
      });

      const notifications = [...upcomingServices, ...result[1]];
      return {
        status: true,
        message: 'Mailbox restore Successful',
        notifications,
        forceUpdate: request.pre.forceUpdate,
        /* .slice(listIndex, 10), */
        /* nextPageUrl: notifications.length >
             listIndex + 10 ? `consumer/mailbox?pageno=${parseInt(pageNo, 10) + 1}` : '' */
      };
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: false,
        message: 'Mailbox restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async filterUpcomingService(user, request) {
    let [
      productDetails, amcList, insuranceList, warrantyList, pucList,
      serviceScheduleList, repairList] = await Promise.all([
      this.productAdaptor.retrieveNotificationProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [6, 8],
      }),
      this.amcAdaptor.retrieveAMCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().add(30, 'days').endOf('days'),
        },
      }),
      this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().add(30, 'days').endOf('days'),
        },
      }),
      this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [1, 2, 3],
        warranty_type: [1, 2],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().add(30, 'days').endOf('days'),
        },
      }),
      this.pucAdaptor.retrievePUCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().add(30, 'days').endOf('days'),
        },
      }),
      this.productAdaptor.retrieveUpcomingProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        service_schedule_id: {
          $not: null,
        },
      }, request.language),
      this.repairAdaptor.retrieveRepairs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        warranty_upto: {
          $ne: null,
        },
      })]);
    const metaData = productDetails[0];
    let productList = productDetails[1].map((productItem) => {
      productItem.productMetaData = metaData.filter(
          (item) => item.productId === productItem.id);

      return productItem;
    });
    productList = productList.map((item) => {
      const product = item;

      product.productMetaData.forEach((metaItem) => {
        const metaData = metaItem;
        if (metaData.name.toLowerCase().includes('due') &&
            metaData.name.toLowerCase().includes('date') &&
            (moment.utc(metaData.value, moment.ISO_8601).isValid() ||
                moment.utc(metaData.value, 'DD MMM YYYY').isValid())) {
          const dueDateTime = moment.utc(metaData.value, moment.ISO_8601).
              isValid() ? moment.utc(metaData.value,
              moment.ISO_8601) : moment.utc(metaData.value,
              'DD MMM YYYY');
          product.dueDate = metaData.value;
          product.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
        }
        product.description = '';
        product.address = '';
        if (metaData.name.toLowerCase().includes('address')) {
          product.description = metaData.value;
          product.address = metaData.value;
        }
      });

      if (product.masterCategoryId.toString() === '6') {
        product.title = `${product.productName ||
        'one of your product'} Reminder`;
        product.productType = 5;
      } else {
        product.title = `${product.productName ||
        'one of your product'} Reminder`;
        product.productType = 4;
      }

      return product;
    });

    productList = productList.filter(
        item => ((item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 30 && item.dueIn >= 0));

    let pucProducts = pucList.map((item) => {
      const puc = item;
      if (moment.utc(puc.expiryDate, moment.ISO_8601).isValid()) {
        const dueDateTime = moment.utc(puc.expiryDate, moment.ISO_8601).
            endOf('day');
        puc.dueDate = puc.expiryDate;
        puc.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
        puc.productType = 3;
        puc.title = 'PUC Renewal Pending';
        puc.description = `PUC Renewal Pending for ${puc.productName ||
        'one of your product'}`;
      }

      return puc;
    });

    pucProducts = pucProducts.filter(
        item => ((item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 30 && item.dueIn >= 0));
    let amcs = amcList.map((item) => {
      const amc = item;
      if (moment.utc(amc.expiryDate, moment.ISO_8601).isValid()) {
        const dueDateTime = moment.utc(amc.expiryDate, moment.ISO_8601);
        amc.dueDate = amc.expiryDate;
        amc.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
        amc.productType = 3;
        amc.title = 'AMC Renewal Pending';
        amc.description = `AMC Renewal Pending for ${amc.productName ||
        'one of your product'}`;
      }

      return amc;
    });
    amcs = amcs.filter(
        item => (item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 30 && item.dueIn >= 0);

    let insurances = insuranceList.map((item) => {
      const insurance = item;
      if (moment.utc(insurance.expiryDate, moment.ISO_8601).isValid()) {
        const dueDateTime = moment.utc(insurance.expiryDate,
            moment.ISO_8601);
        insurance.dueDate = insurance.expiryDate;
        insurance.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
        insurance.productType = 3;
        insurance.title = 'Insurance Renewal Pending';
        insurance.description = `Insurance Renewal Pending for ${insurance.productName ||
        'one of your product'}`;
      }
      return insurance;
    });

    insurances = insurances.filter(
        item => (item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 30 && item.dueIn >= 0);

    let warranties = warrantyList.map((item) => {
      const warranty = item;
      if (moment.utc(warranty.expiryDate, moment.ISO_8601).isValid()) {
        const dueDateTime = moment.utc(warranty.expiryDate,
            moment.ISO_8601);

        warranty.dueDate = warranty.expiryDate;
        warranty.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
        warranty.productType = 3;
        warranty.title = `Warranty Renewal Pending`;
        warranty.description = `Warranty Renewal Pending for ${warranty.warranty_type ===
        3 ?
            `${warranty.dualWarrantyItem ||
            'dual item'} of ${warranty.productName ||
            'one of your product'}` :
            warranty.warranty_type === 4 ?
                `Accessories of ${warranty.productName ||
                'one of your product'}` :
                `${warranty.productName || 'one of your product'}`}`;
      }

      return warranty;
    });

    warranties = warranties.filter(
        item => (item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 30 && item.dueIn >= 0);

    let repairWarranties = repairList.map((item) => {
      const warranty = item;
      if (moment.utc(warranty.warranty_upto, moment.ISO_8601).isValid()) {
        const dueDate_time = moment.utc(warranty.warranty_upto,
            moment.ISO_8601).endOf('day');
        warranty.dueDate = warranty.warranty_upto;
        warranty.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
        warranty.productType = 7;
        warranty.title = `Repair Warranty Expiring`;
        warranty.description = `Warranty Renewal Expiring for ${warranty.productName ||
        'one of your product'}`;
      }
      return warranty;
    });

    repairWarranties = repairWarranties.filter(
        item => (item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 30 && item.dueIn >= 0);

    let productServiceSchedule = serviceScheduleList.map((item) => {
      const scheduledProduct = item;
      const scheduledDate = scheduledProduct.schedule ?
          moment.utc(scheduledProduct.purchaseDate, moment.ISO_8601).
              add(scheduledProduct.schedule.due_in_months, 'months') :
          undefined;
      if (scheduledDate &&
          moment.utc(scheduledDate, moment.ISO_8601).isValid()) {
        const due_date_time = moment.utc(scheduledDate, moment.ISO_8601).
            endOf('day');
        scheduledProduct.dueDate = scheduledDate;
        scheduledProduct.dueIn = due_date_time.diff(moment.utc(), 'days',
            true);
        scheduledProduct.productType = 7;
        scheduledProduct.productId = scheduledProduct.id;
        scheduledProduct.title = `Service is pending for ${scheduledProduct.productName ||
        'one of your product'}`;
        scheduledProduct.description = `Service is pending for ${scheduledProduct.productName ||
        'one of your product'}`;
      }

      return scheduledProduct;
    });

    productServiceSchedule = productServiceSchedule.filter(
        item => ((item.dueIn !== undefined && item.dueIn !== null) &&
            item.dueIn <= 7 && item.dueIn >= 0));

    return [
      ...productList,
      ...warranties,
      ...insurances,
      ...amcs,
      ...pucProducts,
      ...productServiceSchedule,
      ...repairWarranties,
    ];
  }

  async prepareNotificationData(user) {
    const result = await this.modals.mailBox.findAll({
      where: {
        user_id: user.id || user.ID,
        status_id: {
          $notIn: [3, 9],
        },
      },
      include: [
        {
          model: this.modals.products,
          as: 'product',
          attributes: [
            [
              'product_name',
              'productName'],
            [
              this.modals.sequelize.fn('CONCAT', 'products/',
                  this.modals.sequelize.col('"product"."id"')),
              'productURL']],
          required: false,
        }],
      order: [['created_at', 'DESC']],
      attributes: [
        [
          'notification_id',
          'id'],
        [
          'due_amount',
          'dueAmount'],
        [
          this.modals.sequelize.literal('"product"."id"'),
          'productId'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product"."id"')),
          'productURL'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('"product"."document_date"'),
          'purchaseDate'],
        [
          'due_date',
          'dueDate'],
        'taxes',
        [
          'total_amount',
          'totalAmount'],
        [
          'notification_type',
          'productType'],
        'title',
        'description',
        [
          'status_id',
          'statusId'],
        ['created_at', 'createdAt'], 'copies'],
    });
    return result.map(item => item.toJSON());
  }

  async updateNotificationStatus(user, notificationIds) {
    return await this.modals.mailBox.update({status_id: 10}, {
      where: {
        user_id: user.id || user.ID,
        status_id: {$notIn: [3, 9]}, notification_id: notificationIds,
      },
    });
  }

  createNotifications(days) {
    return this.retrieveCronNotification(days).then((result) => {
      const upcomingServices = result.map((elem) => {
        if (elem.productType === 4) {
          const dueAmountArr = elem.productMetaData.filter((e) => {
            return e.name.toLowerCase() === 'due amount';
          });

          if (dueAmountArr.length > 0) {
            elem.value = dueAmountArr[0].value;
          }
        }
        let update = elem;
        update.bill_product_id = update.productId;
        update.bill_id = update.jobId;
        update.due_amount = update.value;
        update.due_date = update.dueDate;
        update.notification_type = update.productType;

        update = _.omit(update, 'id');
        update = _.omit(update, 'productId');
        update = _.omit(update, 'jobId');
        update = _.omit(update, 'policyNo');
        update = _.omit(update, 'premiumType');
        update = _.omit(update, 'productName');
        update = _.omit(update, 'premiumAmount');
        update = _.omit(update, 'dueDate');
        update = _.omit(update, 'productType');
        update = _.omit(update, 'sellers');
        update = _.omit(update, 'onlineSellers');
        update = _.omit(update, 'dueIn');
        update = _.omit(update, 'purchaseDate');
        update = _.omit(update, 'updatedDate');
        update = _.omit(update, 'effectiveDate');
        update = _.omit(update, 'expiryDate');
        update = _.omit(update, 'value');
        update = _.omit(update, 'taxes');
        update = _.omit(update, 'categoryId');
        update = _.omit(update, 'brandId');
        update = _.omit(update, 'colorId');
        update = _.omit(update, 'value');
        update = _.omit(update, 'documentNo');
        update = _.omit(update, 'billId');
        update = _.omit(update, 'sellerId');
        update = _.omit(update, 'reviewUrl');
        update = _.omit(update, 'color');
        update = _.omit(update, 'brand');
        update = _.omit(update, 'bill');
        update = _.omit(update, 'productReviews');
        update = _.omit(update, 'productMetaData');
        update = _.omit(update, 'insuranceDetails');
        update = _.omit(update, 'warrantyDetails');
        update = _.omit(update, 'amcDetails');
        update = _.omit(update, 'repairBills');
        update = _.omit(update, 'requiredCount');
        update = _.omit(update, 'dueDate');
        update = _.omit(update, 'dueIn');
        return update;
      });
      /* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */

      upcomingServices.sort((a, b) => {
        let aDate;
        let bDate;

        aDate = a.dueDate;
        bDate = b.dueDate;
        if (moment.utc(aDate, 'YYYY-MM-DD').
            isBefore(moment.utc(bDate, 'YYYY-MM-DD'))) {
          return -1;
        }

        return 1;
      });
      const notificationPromise = upcomingServices.map(
          (upcomingNotification) => {
            this.notifyUserCron(upcomingNotification.user_id,
                upcomingNotification);
          });

      return Promise.all(notificationPromise);

    });
  }

  createMissingDocNotification(days) {
    return this.retrieveMissingDocNotification(days).then((result) => {
      const upcomingServices = result.map((elem) => {
        if (elem.productType === 4) {
          const dueAmountArr = elem.productMetaData.filter((e) => {
            return e.name.toLowerCase() === 'due amount';
          });

          if (dueAmountArr.length > 0) {
            elem.value = dueAmountArr[0].value;
          }
        }
        let update = elem;
        update.bill_product_id = update.productId;
        update.bill_id = update.jobId;
        update.due_amount = update.value;
        update.notification_type = update.productType;

        update = _.omit(update, 'id');
        update = _.omit(update, 'productId');
        update = _.omit(update, 'jobId');
        update = _.omit(update, 'policyNo');
        update = _.omit(update, 'premiumType');
        update = _.omit(update, 'productName');
        update = _.omit(update, 'premiumAmount');
        update = _.omit(update, 'dueDate');
        update = _.omit(update, 'productType');
        update = _.omit(update, 'sellers');
        update = _.omit(update, 'onlineSellers');
        update = _.omit(update, 'dueIn');
        update = _.omit(update, 'purchaseDate');
        update = _.omit(update, 'updatedDate');
        update = _.omit(update, 'effectiveDate');
        update = _.omit(update, 'expiryDate');
        update = _.omit(update, 'value');
        update = _.omit(update, 'taxes');
        update = _.omit(update, 'categoryId');
        update = _.omit(update, 'brandId');
        update = _.omit(update, 'colorId');
        update = _.omit(update, 'value');
        update = _.omit(update, 'documentNo');
        update = _.omit(update, 'billId');
        update = _.omit(update, 'sellerId');
        update = _.omit(update, 'reviewUrl');
        update = _.omit(update, 'color');
        update = _.omit(update, 'brand');
        update = _.omit(update, 'bill');
        update = _.omit(update, 'productReviews');
        update = _.omit(update, 'productMetaData');
        update = _.omit(update, 'insuranceDetails');
        update = _.omit(update, 'warrantyDetails');
        update = _.omit(update, 'amcDetails');
        update = _.omit(update, 'repairBills');
        update = _.omit(update, 'requiredCount');
        update = _.omit(update, 'dueDate');
        update = _.omit(update, 'dueIn');
        return update;
      });

      const notificationPromise = upcomingServices.map(
          (upcomingNotification) => {
            this.notifyUserCron(upcomingNotification.user_id,
                upcomingNotification);
          });

      return Promise.all(notificationPromise);

    });
  }

  createExpenseNotification(days) {
    return this.retrieveMissingDocNotification(days).then((result) => {

      const expenseUpdates = result.map((resultItem) => {
        return {
          notification_type: days === 1 ? 5 : days === 6 ? 6 : 7,
          due_amount: resultItem.value,
          taxes: resultItem.taxes,
          title: days === 1 ?
              'Daily Expense' :
              days === 7 ?
                  'Last Seven Days Expense' :
                  'Monthly Expense',
          description: days === 1 ?
              'Daily Expense Summary' :
              days === 7 ?
                  'Last Seven Days Expense Summary' :
                  'Monthly Expense Summary',
          productUrl: days === 1 ?
              '/insight' :
              days === 7 ?
                  '/insight' :
                  '/insight',
          user_id: resultItem.user_id,
        };
      });
      const upcomingServices = [];

      expenseUpdates.forEach((item) => {
        const index = upcomingServices.findIndex(
            distinctItem => (distinctItem.user_id === item.user_id));
        if (index === -1) {
          upcomingServices.push({
            notification_type: item.notification_type,
            due_amount: item.due_amount,
            taxes: item.taxes,
            title: item.title,
            description: item.description,
            productUrl: item.productUrl,
            user_id: item.user_id,
          });
        } else {
          upcomingServices[index].due_amount += item.due_amount;
          upcomingServices[index].taxes += item.taxes;
        }
      });

      const notificationPromise = upcomingServices.map(
          (upcomingNotification) => {
            this.notifyUserCron(upcomingNotification.user_id,
                upcomingNotification);
          });

      return Promise.all(notificationPromise);

    });
  }

  retrieveMissingDocNotification() {
    return this.productAdaptor.retrieveMissingDocProducts({
      status_type: [5, 8, 11],
    }).then((result) => {
      return result.map((item) => {
        const product = item;

        product.title = `${product.productName} Reminder`;
        product.description = 'Some of Documents are missing';
        product.productType = 10;
        return product;
      });
    });
  }

  retrieveExpenseCronNotification(days) {
    const purchaseDateCompare = days === 1 ? {
      $gte: moment.utc().subtract(days, 'day').startOf('day'),
      $lte: moment.utc().subtract(days, 'day').endOf('day'),
    } : days === 7 ? {
      $lte: moment.utc().subtract(days, 'day').endOf('day'),
      $gte: moment.utc().subtract(days, 'day').startOf('day'),
    } : {
      $gte: moment.utc().startOf('month'),
      $lte: moment.utc().endOf('month'),
    };
    return Promise.all([
      this.productAdaptor.retrieveNotificationProducts({
        status_type: [5, 11],
        document_date: purchaseDateCompare,
      }),
      this.amcAdaptor.retrieveNotificationAMCs({
        status_type: 5,
        document_date: purchaseDateCompare,
      }),
      this.insuranceAdaptor.retrieveNotificationInsurances({
        status_type: 5,
        document_date: purchaseDateCompare,
      }),
      this.warrantyAdaptor.retrieveNotificationWarranties({
        status_type: 5,
        document_date: purchaseDateCompare,
      })]).then((result) => {
      let products = result[0];

      let amcs = result[1];

      let insurances = result[2];

      let warranties = result[3];

      return [...products, ...warranties, ...insurances, ...amcs];
    });
  }

  retrieveCronNotification(days) {
    const expiryDateCompare = days === 15 ? {
      $gte: moment.utc().add(days, 'day').startOf('day'),
      $lte: moment.utc().add(days, 'day').endOf('day'),
    } : {
      $gte: moment.utc().startOf('day'),
      $lte: moment.utc().add(days, 'day').endOf('day'),
    };
    return Promise.all([
      this.productAdaptor.retrieveNotificationProducts({
        status_type: 5,
        main_category_id: [6, 8],
      }),
      this.amcAdaptor.retrieveNotificationAMCs({
        status_type: 5,
        expiry_date: expiryDateCompare,
      }),
      this.insuranceAdaptor.retrieveNotificationInsurances({
        status_type: 5,
        expiry_date: expiryDateCompare,
      }),
      this.warrantyAdaptor.retrieveNotificationWarranties({
        status_type: 5,
        expiry_date: expiryDateCompare,
      })]).then((result) => {
      let products = result[0].map((item) => {
        const product = item;

        product.productMetaData.map((metaItem) => {
          const metaData = metaItem;
          if (metaData.name.toLowerCase().includes('due') &&
              metaData.name.toLowerCase().includes('date') &&
              moment.utc(metaData.value, moment.ISO_8601).isValid()) {
            const dueDateTime = moment.utc(metaData.value, moment.ISO_8601);
            product.dueDate = metaData.value;
            product.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
          }

          if (metaData.name.toLowerCase().includes('address')) {
            product.description = metaData.name.toLowerCase().
                includes('address') ? `${metaData.value}` : '';
          }

          return metaData;
        });

        product.title = `${product.productName} Reminder`;
        product.productType = 4;
        return product;
      });

      products = products.filter(
          item => days === 15 ?
              (item.dueDate <= moment.utc().add(days, 'day').endOf('day') &&
                  item.dueDate >=
                  moment.utc().add(days, 'day').startOf('day')) :
              (item.dueDate <= moment.utc().add(days, 'day').endOf('day') &&
                  item.dueDate >= moment.utc().startOf('day')));
      let amcs = result[1].map((item) => {
        const amc = item;
        if (moment.utc(amc.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(amc.expiryDate, moment.ISO_8601);
          amc.dueDate = amc.expiryDate;
          amc.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
          amc.productType = 3;
          amc.title = 'AMC Renewal Pending';
          amc.description = `AMC #${amc.policyNo} of ${amc.productName}`;
        }

        return amc;
      });

      let insurances = result[2].map((item) => {
        const insurance = item;
        if (moment.utc(insurance.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(insurance.expiryDate, moment.ISO_8601);
          insurance.dueDate = insurance.expiryDate;
          insurance.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
          insurance.productType = 3;
          insurance.title = 'Insurance Renewal Pending';
          insurance.description = `Insurance #${insurance.policyNo} of ${insurance.productName}`;
        }
        return insurance;
      });

      let warranties = result[3].map((item) => {
        const warranty = item;
        if (moment.utc(warranty.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(warranty.expiryDate, moment.ISO_8601);

          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDateTime.diff(moment.utc(), 'days', true);
          warranty.productType = 3;
          warranty.title = 'Warranty Renewal Pending';
          warranty.description = `Warranty #${warranty.policyNo} of ${warranty.productName}`;
        }

        return warranty;
      });

      return [...products, ...warranties, ...insurances, ...amcs];
    });
  }

  notifyUserCron(userId, payload) {
    return this.modals.fcmDetails.findAll({
      where: {
        user_id: userId,
      },
    }).then((result) => {
      const options = {
        uri: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {Authorization: `key=${config.GOOGLE.FCM_KEY}`},
        json: {
          // note that Sequelize returns token object array, we map it with token value only
          registration_ids: result.map(user => user.fcm_id),
          // iOS requires priority to be set as 'high' for message to be received in background
          priority: 'high',
          data: payload,
        },
      };
      request(options, (error, response, body) => {
        if (!(!error && response.statusCode === 200)) {
          console.log(`Error on ${new Date()} is as follow: \n \n ${{
            error,
            userId,
            user: JSON.stringify(result),
          }}`);
        }
        // extract invalid registration for removal
        if (body.failure > 0 && Array.isArray(body.results) &&
            body.results.length === result.length) {
          const results = body.results;
          for (let i = 0; i < result.length; i += 1) {
            if (results[i].error === 'InvalidRegistration') {
              result[i].destroy().then(rows => {
                console.log('FCM ID\'s DELETED: ', rows);
              });
            }
          }
        }
      });
    });
  }

  notifyUser(userId, payload, reply) {
    return this.modals.fcmDetails.findAll({
      where: {
        user_id: userId,
      },
    }).then((result) => {
      const options = {
        uri: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {Authorization: `key=${config.GOOGLE.FCM_KEY}`},
        json: {
          registration_ids: result.map(user => user.fcm_id),
          priority: 'high',
          data: payload,
          notification_type: 26,
          notification: {
            title: payload.title,
            body: payload.description || payload.big_text,
          },
        },
      };
      request(options, (error, response, body) => {
        this.modals.logs.create({
          log_type: 3,
          user_id: userId,
          log_content: JSON.stringify({options}),
        }).catch((ex) => console.log('error while logging on db,',
            ex));
        // extract invalid registration for removal
        if (body.failure > 0 && Array.isArray(body.results) &&
            body.results.length === result.length) {
          const results = body.results;
          for (let i = 0; i < result.length; i += 1) {
            if (results[i].error === 'InvalidRegistration') {
              result[i].destroy().then(rows => {
                console.log('FCM ID\'s DELETED: ', rows);
              });
            }
          }
        }

        if (reply) {
          if (!error && response.statusCode === 200) {
            // request was success, should early return response to client
            return reply.response({
              status: true,
            }).code(200);
          } else {
            return reply.response({
              status: false,
              error,
            });
          }
        }
      });
    });
  }

  verifyEmailAddress(emailSecret, reply) {
    return this.modals.users.findOne({
      where: {
        user_status_type: {
          $ne: 3,
        },
        email_secret: emailSecret,
      },
    }).then((result) => {
      result.updateAttributes({
        email_verified: true,
      });

      return reply.response({status: true});
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user is as follow: \n \n ${err}`);
      return reply.response({status: false});
    });
  }

  async sendProductAccessoryMail(options) {
    const {email, id, name, product} = options;
    console.log(JSON.stringify({options}));
    const products = [product];
    const productHtml = [];
    products.forEach(pItem => {
      const accessoryHtml = [];
      pItem.accessories.forEach((accessItem) => {
        accessItem.products.forEach((aItem) => {
          const rating = parseInt(aItem.details.rating);
          const ratingHtml = ['<div style="padding: 10px 50px">'];
          let i = 0;
          while (ratingHtml.length <= 5) {
            if (i < rating) {
              ratingHtml.push(
                  `<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/rating_color.png" alt="rating"/>`);
            } else {
              ratingHtml.push(
                  `<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/rating.png" alt="rating"/>`);
            }

            i++;
          }
          ratingHtml.push(`<span style="padding: 10px;">${rating ||
          0} out of 5</span></div>`);
          if (accessoryHtml.length < 2) {
            accessoryHtml.push(`<td align="center" width="310" style=" width:300px; padding: 5px 0;border: 0 solid transparent;"
          valign="top"><div class="col num4"
          style="max-width: 320px;min-width: 310px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border: 0 solid transparent;padding: 5px 0;">
              <div align="center" class="img-container center fixedwidth"style="padding-right: 0;  padding-left: 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr style="line-height:0;">
              <td style="padding-right: 0; padding-left: 0;" align="center"><img class="center fixedwidth" align="center" border="0"
          src="${aItem.details.image}" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 159.5px;min-width: 159.5px; max-height: 159.5px; min-height:159.5px;"
          width="159.5" height="159.5"></td></tr></table></div><div class="">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
              <td style="padding-right: 30px; padding-left: 30px; padding-top: 10px; padding-bottom: 5px;">
              <div style="color:#888888;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:150%; padding-right: 30px; padding-left: 30px; padding-top: 10px; padding-bottom: 5px;">
              <div style="font-size:12px;line-height:18px;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;color:#888888;text-align:left;">
              <p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">
              <strong><div
          style="color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;">${aItem.details.name}</div></strong>
          </p></div>
              </div></td></tr></table></div> <div class="">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
              <td style="padding: 10px 30px 20px;">${ratingHtml.toString().
                replace(/,/g, '')}
              <a href="${aItem.details.url}" style="text-decoration: none">
              <div style="color:#888888;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:150%; padding: 10px 50px 20px;">
              <div style="font-size:12px;line-height:18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#888888;text-align:left;border:2px solid #00a0ff;border-radius: 50px; padding-top: 10px; padding-bottom: 10px">
              <p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center"><strong>₹ ${aItem.details.price}</strong></p></div>
          </div></a></td></tr></table>
          </div><div align="center" class="button-container center "
          style="padding-right: 30px; padding-left: 30px; padding-top:10px; padding-bottom:5px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0; mso-table-rspace:0;">
              <tr>
              <td style="padding: 10px 30px 10px;" align="center">
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.binbill.com/deals/accessories/categories/${pItem.category_id}" style="height:34pt; v-text-anchor:middle; width:73pt;" arcsize="0%" strokecolor="#00A0FF" fillcolor="#FFFFFF">
              <w:anchorlock/>
          <v:textbox inset="0,0,0,0">
              <center style="color:#00A0FF; font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif; font-size:16px;">
              <a href="https://www.binbill.com/deals/accessories/categories/${pItem.category_id}" target="_blank"
          style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #00A0FF; background-color: #FFFFFF; border-radius: 0; -webkit-border-radius: 0; -moz-border-radius: 0; max-width: 98px; width: 38px;width: auto; border-top: 2px solid #00A0FF; border-right: 2px solid #00A0FF; border-bottom: 2px solid #00A0FF; border-left: 2px solid #00A0FF; padding-top: 5px; padding-right: 30px; padding-bottom: 5px; padding-left: 30px; font-family: 'Roboto', Tahoma, Verdana, Segoe, sans-serif;mso-border-alt: none">
              <span style="font-size:16px;line-height:32px;"><span
          style="font-size: 14px; line-height: 28px;"
          data-mce-style="font-size: 14px; line-height: 18px;">VIEW NOW</span></span>
          </a></center></v:textbox></v:roundrect></td></tr></table>
          </div></div></div>
          </div></td>`);
          }
        });
      });
      productHtml.push(`<div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid three-up ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"><table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="207"
                            style=" width:207px; padding: 5px 0px;border: 0px solid transparent;" valign="top"><div class="col num4" style="max-width: 320px;min-width: 206px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;"><div style="border-top: 0 solid transparent; border-left: 0 solid transparent; border-bottom: 0 solid transparent; border-right: 0 solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider "
                                           style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><tbody>
                                        <tr style="vertical-align: top">
                                            <td class="divider_inner"
                                                style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 15px;padding-left: 15px;padding-top: 15px;padding-bottom: 15px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <table class="divider_content" height="0px" align="center" border="0"
                                                       cellpadding="0" cellspacing="0" width="100%"
                                                       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;border-top: 3px solid #00AFFF;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0;line-height: 0;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span>&#160;</span>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table></div></div>
                        </div></td><td align="center" width="207"
                        style=" width:207px; padding: 5px 0;border: 0 solid transparent;"
                        valign="top">
                        <div class="col num4"
                             style="max-width: 320px;min-width: 206px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding: 5px 0;">
                                    <div class="">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 5px;">
                                        <div style="color:#555555;line-height:120%;font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif; padding: 0;">
                                            <div style="font-size:12px;width: 150px;line-height:14px;color:#555555;font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif;text-align:left; display: inline-block; text-overflow: ellipsis;overflow: hidden; white-space: nowrap">
                                                <p style="margin: 0;font-size: 14px;line-height: 17px;text-align: center; display: inline-block">
                                                    <span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 16px;"><strong>${pItem.product_name}</strong></span>
                                                </p></div><img class="center fixedwidth" align="center" border="0"
                                             src="https://consumer.binbill.com/categories/${pItem.category.category_id}/images/1/thumbnail" alt="Image" title="Image"
                                             style="outline: none;padding-left:10px;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: 0;height: auto;float: none;width: 100%;max-width: 35px; padding-bottom: 10px"
                                             width="35">
                                        </div></td>
                                    </tr>
                                    </table></div>
                                </div>
                            </div>
                        </div></td>
                    <td align="center" width="207"
                        style=" width:207px; padding: 5px 0;border: 0 solid transparent;"
                        valign="top"><div class="col num4"
                             style="max-width: 320px;min-width: 206px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border-top: 0 solid transparent; border-left: 0 solid transparent; border-bottom: 0 solid transparent; border-right: 0 solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider "
                                           style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                        <tbody>
                                        <tr style="vertical-align: top">
                                            <td class="divider_inner"
                                                style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 15px;padding-left: 15px;padding-top: 15px;padding-bottom: 15px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <table class="divider_content" height="0px" align="center" border="0"
                                                       cellpadding="0" cellspacing="0" width="100%"
                                                       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;border-top: 3px solid #00AFFF;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0;line-height: 0;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span>&#160;</span>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        </td>
                        </tr>
                        </table>
                        </td>
                        </tr>
                        </table>
                    </div>
                </div>
            </div>
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid two-up ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">${accessoryHtml.toString()}</tr></table></td></tr></table></div></div>
            </div>`);
    });

    console.log(productHtml);
    if (productHtml.length > 0) {
      await request({
        url: `https://admin.binbill.com/api/mailfromcrons`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        json: {
          html: `<!DOCTYPE html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title></title>
    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css">
    <style type="text/css" id="media-query">
        body {
            margin: 0;
            padding: 0;
        }

        table, tr, td {
            vertical-align: top;
            border-collapse: collapse;
        }

        .ie-browser table, .mso-container table {
            table-layout: fixed;
        }

        * {
            line-height: inherit;
        }

        a[x-apple-data-detectors=true] {
            color: inherit !important;
            text-decoration: none !important;
        }

        [owa] .img-container div, [owa] .img-container button {
            display: block !important;
        }

        [owa] .fullwidth button {
            width: 100% !important;
        }

        [owa] .block-grid .col {
            display: table-cell;
            float: none !important;
            vertical-align: top;
        }

        .ie-browser .num12, .ie-browser .block-grid, [owa] .num12, [owa] .block-grid {
            width: 620px !important;
        }

        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
        }

        .ie-browser .mixed-two-up .num4, [owa] .mixed-two-up .num4 {
            width: 204px !important;
        }

        .ie-browser .mixed-two-up .num8, [owa] .mixed-two-up .num8 {
            width: 408px !important;
        }

        .ie-browser .block-grid.two-up .col, [owa] .block-grid.two-up .col {
            width: 310px !important;
        }

        .ie-browser .block-grid.three-up .col, [owa] .block-grid.three-up .col {
            width: 206px !important;
        }

        .ie-browser .block-grid.four-up .col, [owa] .block-grid.four-up .col {
            width: 155px !important;
        }

        .ie-browser .block-grid.five-up .col, [owa] .block-grid.five-up .col {
            width: 124px !important;
        }

        .ie-browser .block-grid.six-up .col, [owa] .block-grid.six-up .col {
            width: 103px !important;
        }

        .ie-browser .block-grid.seven-up .col, [owa] .block-grid.seven-up .col {
            width: 88px !important;
        }

        .ie-browser .block-grid.eight-up .col, [owa] .block-grid.eight-up .col {
            width: 77px !important;
        }

        .ie-browser .block-grid.nine-up .col, [owa] .block-grid.nine-up .col {
            width: 68px !important;
        }

        .ie-browser .block-grid.ten-up .col, [owa] .block-grid.ten-up .col {
            width: 62px !important;
        }

        .ie-browser .block-grid.eleven-up .col, [owa] .block-grid.eleven-up .col {
            width: 56px !important;
        }

        .ie-browser .block-grid.twelve-up .col, [owa] .block-grid.twelve-up .col {
            width: 51px !important;
        }
        @media only screen and (min-width: 640px) {
            .block-grid {
                width: 620px !important;
            }

            .block-grid .col {
                vertical-align: top;
            }

            .block-grid .col.num12 {
                width: 620px !important;
            }

            .block-grid.mixed-two-up .col.num4 {
                width: 204px !important;
            }

            .block-grid.mixed-two-up .col.num8 {
                width: 408px !important;
            }

            .block-grid.two-up .col {
                width: 310px !important;
            }

            .block-grid.three-up .col {
                width: 206px !important;
            }

            .block-grid.four-up .col {
                width: 155px !important;
            }

            .block-grid.five-up .col {
                width: 124px !important;
            }

            .block-grid.six-up .col {
                width: 103px !important;
            }

            .block-grid.seven-up .col {
                width: 88px !important;
            }

            .block-grid.eight-up .col {
                width: 77px !important;
            }

            .block-grid.nine-up .col {
                width: 68px !important;
            }

            .block-grid.ten-up .col {
                width: 62px !important;
            }

            .block-grid.eleven-up .col {
                width: 56px !important;
            }

            .block-grid.twelve-up .col {
                width: 51px !important;
            }
        }

        @media (max-width: 640px) {
            .block-grid, .col {
                min-width: 320px !important;
                max-width: 100% !important;
                display: block !important;
            }

            .block-grid {
                width: calc(100% - 40px) !important;
            }

            .col {
                width: 100% !important;
            }

            .col > div {
                margin: 0 auto;
            }

            img.fullwidth, img.fullwidthOnMobile {
                max-width: 100% !important;
            }

            .no-stack .col {
                min-width: 0 !important;
                display: table-cell !important;
            }

            .no-stack.two-up .col {
                width: 50% !important;
            }

            .no-stack.mixed-two-up .col.num4 {
                width: 33% !important;
            }

            .no-stack.mixed-two-up .col.num8 {
                width: 66% !important;
            }

            .no-stack.three-up .col.num4 {
                width: 33% !important;
            }

            .no-stack.four-up .col.num3 {
                width: 25% !important;
            }

            .mobile_hide {
                min-height: 0;
                max-height: 0;
                max-width: 0;
                display: none;
                overflow: hidden;
                font-size: 0;
            }
        }

    </style>
</head>
<body class="clean-body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #F3F3F3">
<style type="text/css" id="media-query-bodytag">
    @media (max-width: 520px) {
        .block-grid {
            min-width: 320px !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
        }

        .col {
            min-width: 320px !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
        }

        .col > div {
            margin: 0 auto;
        }

        img.fullwidth {
            max-width: 100% !important;
        }

        img.fullwidthOnMobile {
            max-width: 100% !important;
        }

        .no-stack .col {
            min-width: 0 !important;
            display: table-cell !important;
        }

        .no-stack.two-up .col {
            width: 50% !important;
        }

        .no-stack.mixed-two-up .col.num4 {
            width: 33% !important;
        }

        .no-stack.mixed-two-up .col.num8 {
            width: 66% !important;
        }

        .no-stack.three-up .col.num4 {
            width: 33% !important;
        }

        .no-stack.four-up .col.num3 {
            width: 25% !important;
        }

        .mobile_hide {
            min-height: 0 !important;
            max-height: 0 !important;
            max-width: 0 !important;
            display: none !important;
            overflow: hidden !important;
            font-size: 0 !important;
        }
    }
</style>
<div class="ie-browser">
<div class="mso-container">
<table class="nl-container"
       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #F3F3F3;width: 100%"
       cellpadding="0" cellspacing="0">
    <tbody>
    <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" style="background-color: #F3F3F3;">
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">
                        <td align="center" width="620"
                            style=" width:620px; padding-right: 0; padding-left: 0; padding-top:5px; padding-bottom:5px; border: 0 solid transparent;"
                            valign="top"><div class="col num12"
                             style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;">
                                    <div align="center" class="img-container center fixedwidth "
                                         style="padding-right: 0;  padding-left: 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr style="line-height:0;line-height:0;">
                                                <td style="padding-right: 0; padding-left: 0;" align="center">
                                        <img class="center fixedwidth" align="center" border="0"
                                             src="https://s3.ap-south-1.amazonaws.com/binbill-static/BinBill_+Color+Logo+2X-04.png" alt="Image"
                                             title="Image"
                                             style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 217px"
                                             width="217">
                                             </td></tr></table></div></div></div>                        </div>
                       </td></tr></table></td></tr></table></div>
                </div>
            </div>
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="620"
                            style=" width:620px; padding: 5px 0;border: 0 solid transparent;"
                            valign="top"><div class="col num12"
                             style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;"><div style="border: 0 solid transparent;padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider "
                                           style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><tbody>
                                        <tr style="vertical-align: top">    <td class="divider_inner"
                                                style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-bottom: 10px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <table class="divider_content" height="0px" align="center" border="0"
                                                       cellpadding="0" cellspacing="0" width="100%"
                                                       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;border-top: 3px solid #00AAF8;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <tbody><tr style="vertical-align: top"><td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0;line-height: 0;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><span>&#160;</span></td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table></div>
                            </div>
                        </div></td></tr></table></td></tr></table>
                    </div>
                </div>
            </div>
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="620"
                            style=" width:620px; padding: 0;border: 0 solid transparent;border-top-width: 0;"
                            valign="top"><div class="col num12" style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;"><div style="border: 0 solid transparent;padding-top:0; padding-bottom:0; padding-right: 0; padding-left: 0;"><div class="">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">
<div style="color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">
                                            <div style="font-size:12px;line-height:14px;color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;text-align:left;">
                                                <p style="margin: 0;font-size: 14px;line-height: 17px"><span
                                                        style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);"><strong>
                                                        Hello
${name ? ` ${name}` : ''},
                                                        </strong></span><br><br>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">Congratulations on successfully adding your product!</span><br><br>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">Did you know that we have exciting and best of Accessories for your <b>${pItem.product_name}</b>?</span><br><br>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">Check out suitably chosen Accessories for your product in our Deals section.</span>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">All your Product Needs in one place.</span>
                                                </p></div>
                                        </div></td></tr></table>
                                    </div></div></div>
                        </div></td></tr></table></td></tr></table>
                    </div>
                </div>
            </div>
            ${productHtml.toString()}
            <div style="background-color:#FFFFFF;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#FFFFFF;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 620px;"><tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="620" style=" width:620px; padding-right: 0; padding-left: 0; padding-top:5px; padding-bottom:5px; border-top: 0 solid transparent; border-left: 0 solid transparent; border-bottom: 0 solid transparent; border-right: 0 solid transparent;" valign="top">
            <div class="col num12" style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border-top: 0 solid transparent; border-left: 0 solid transparent; border-bottom: 0 solid transparent; border-right: 0 solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;"><div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0; mso-table-rspace:0;"><tr>
  <td style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;" align="center">
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.binbill.com/deals" style="height:31pt; v-text-anchor:middle; width:76pt;" arcsize="10%" strokecolor="#3AAEE0" fillcolor="#3AAEE0">
  <w:anchorlock/>
  <v:textbox inset="0,0,0,0">
  <a href="https://www.binbill.com/deals" style="text-decoration: none;">
  <center style="color:#ffffff; font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif; font-size:16px;">
    <div style="color: #ffffff; background-color: #3AAEE0; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 102px; width: 62px;width: auto; border-top: 0 solid transparent; border-right: 0 solid transparent; border-bottom: 0 solid transparent; border-left: 0 solid transparent; padding-top: 5px; padding-right: 20px; padding-bottom: 5px; padding-left: 20px; font-family: 'Roboto', Tahoma, Verdana, Segoe, sans-serif; text-align: center; mso-border-alt: none;">
      <span style="font-size:16px;line-height:32px;">View All</span>
    </div>
  </center></a></v:textbox></v:roundrect></td></tr></table>
</div><div class=""><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">
	<div style="color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">	
		<div style="font-size:12px;line-height:14px;color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px"><span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">For any queries, write to us at <strong>support@binbill.com</strong> or call us at <strong>+91-124-4343177</strong>. </span><br><br><br><span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 16px;"><strong><span style="font-size: 16px; line-height: 19px;">Cheers,</span></strong></span><br><span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 16px;"><strong><span style="font-size: 16px; line-height: 19px;">BinBill Team</span></strong></span><br><br></p></div>	
	</div></td></tr></table>
</div></div>              </div></div></td></tr></table></td></tr></table></div></div></div>
            <div style="background-color:#8C8C8C;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#8C8C8C;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">
                        <td align="center" width="620"
                            style=" width:620px; padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px; border: 0 solid transparent;"
                            valign="top"><div class="col num12"
                             style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding-top:10px; padding-bottom:10px; padding-right: 10px; padding-left: 10px;">                                    <div align="center"
                                         style="padding-right: 10px; padding-left: 10px; padding-bottom: 10px;"
                                         class="">
                                        <div style="line-height:10px;font-size:1px">&#160;</div>
                                        <div style="display: table; max-width:171px;">
                                            <table width="151" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="border-collapse:collapse; padding-right: 10px; padding-left: 10px; padding-bottom: 10px;"
                                                        align="center">
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                                               style="border-collapse:collapse; mso-table-lspace: 0;mso-table-rspace: 0; width:151px;">
                                                            <tr><td width="32" style="width:32px; padding-right: 15px;"
                                                                    valign="top"><table align="left" border="0" cellspacing="0" cellpadding="0" width="32"
                                                   height="32"
                                                   style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;Margin-right: 15px">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle"
                                                        style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="https://www.facebook.com/binbill.ehome/"
                                                           title="Facebook" target="_blank">
                                                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook.png" alt="Facebook"
                                                                 title="Facebook" width="32"
                                                                 style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        <div style="line-height:5px;font-size:1px">&#160;</div>
                                                        </td></tr></tbody></table></td><td width="32" style="width:32px; padding-right: 15px;" valign="top">
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32"
                                                   height="32"
                                                   style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;Margin-right: 15px">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle"
                                                        style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="http://twitter.com//binbill_ehome" title="Twitter"
                                                           target="_blank">
                                                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter.png" alt="Twitter" title="Twitter"
                                                                 width="32"
                                                                 style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        <div style="line-height:5px;font-size:1px">&#160;</div>
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table></td><td width="32" style="width:32px; padding-right: 0;" valign="top">
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32"
                                                   height="32"
                                                   style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;Margin-right: 0">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle"
                                                        style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="https://www.linkedin.com/company/binbill.com/"
                                                           title="LinkedIn" target="_blank">
                                                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin%402x.png" alt="LinkedIn"
                                                                 title="LinkedIn" width="32"
                                                                 style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        <div style="line-height:5px;font-size:1px">&#160;</div>
                                                    </td>
                                                </tr>
                                                </tbody></table></td></tr></table></td></tr></table></div></div></div></div></div></td></tr></table></td></tr></table></div></div></div></td></tr></table></td></tr></tbody></table></div></body></html>`,
          email,
          subject: 'Exciting Accessories to complement your product!',
        },
      }).catch(err => {
        throw err;
      });
    }
  }
}

export default NotificationAdaptor;
