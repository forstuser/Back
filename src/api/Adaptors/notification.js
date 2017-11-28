/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import config from '../../config/main';
import ProductAdaptor from './product';
import AMCAdaptor from './amcs';
import InsuranceAdaptor from './insurances';
import WarrantyAdaptor from './warranties';
import smtpTransport from 'nodemailer-smtp-transport';
import nodemailer from 'nodemailer';
import request from 'request';
import moment from 'moment';

class NotificationAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
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
    smtpTransporter.sendMail(mailOptions);
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
    smtpTransporter.sendMail(mailOptions);
  }

  static sendLinkOnMessage(phoneNo) {
    const options = {
      uri: 'http://api.msg91.com/api/sendhttp.php',
      qs: {
        authkey: config.SMS.AUTH_KEY,
        sender: 'BINBIL',
        flash: 0,
        mobiles: `91${phoneNo}`,
        message: `Hey there, \nPlease click on the link to download BinBill App and start building your eHome : http://play.google.com/store/apps/details?id=com.bin.binbillcustomer \nWhere there is a Bill,there is BinBill.`,
        route: 4,
        country: 91,
        response: 'json',
      },
      timeout: 170000,
      json: true // Automatically parses the JSON string in the response
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        // request was success, should early return response to client
        return {
          status: true,
        };
      } else {
        console.log(error);
      }
    });
  }

  retrieveNotifications(user, request) {
    return Promise.all([
      this.filterUpcomingService(user),
      this.prepareNotificationData(user),
    ]).then((result) => {
      const upcomingServices = result[0].map((elem) => {
        if (elem.productType === 4) {
          console.log(elem);
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
    }).catch((err) => {
      console.log({API_Logs: err});
      return {
        status: false,
        message: 'Mailbox restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  filterUpcomingService(user) {
    return Promise.all([
      this.productAdaptor.retrieveProducts({
        user_id: user.id,
        status_type: 5,
        main_category_id: [6, 8],
      }),
      this.amcAdaptor.retrieveAMCs({
        user_id: user.id,
        status_type: 5,
      }),
      this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id,
        status_type: 5,
      }),
      this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id,
        status_type: 5,
      })]).then((result) => {
      let products = result[0].map((item) => {
        const product = item;

        product.productMetaData.map((metaItem) => {
          const metaData = metaItem;
          if (metaData.name.toLowerCase().includes('due') &&
              metaData.name.toLowerCase().includes('date') &&
              moment(metaData.value).isValid()) {
            const dueDateTime = moment(metaData.value);
            product.dueDate = metaData.value;
            product.dueIn = dueDateTime.diff(moment.utc(), 'days');
          }

          if (metaData.name.toLowerCase().includes('address')) {
            product.description = metaData.name.toLowerCase().
                includes('address') ? `${metaData.value}` : '';
          }

          return metaData;
        });

        if (product.masterCategoryId.toString() === '6') {
          product.title = `${product.productName} Reminder`;
          product.productType = 5;
        } else {
          product.title = `${product.productName} Reminder`;
          product.productType = 4;
        }

        return product;
      });

      products = products.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0));
      let amcs = result[1].map((item) => {
        const amc = item;
        if (moment(amc.expiryDate).isValid()) {
          const dueDateTime = moment(amc.expiryDate);
          amc.dueDate = amc.expiryDate;
          amc.dueIn = dueDateTime.diff(moment.utc(), 'days');
          amc.productType = 3;
          amc.title = 'AMC Renewal Pending';
          amc.description = amc.productName;
        }

        return amc;
      });
      amcs = amcs.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let insurances = result[2].map((item) => {
        const insurance = item;
        if (moment(insurance.expiryDate).isValid()) {
          const dueDateTime = moment(insurance.expiryDate);
          insurance.dueDate = insurance.expiryDate;
          insurance.dueIn = dueDateTime.diff(moment.utc(), 'days');
          insurance.productType = 3;
          insurance.title = 'Insurance Renewal Pending';
          insurance.description = insurance.productName;
        }
        return insurance;
      });

      insurances = insurances.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let warranties = result[3].map((item) => {
        const warranty = item;
        if (moment(warranty.expiryDate).isValid()) {
          const dueDateTime = moment(warranty.expiryDate);

          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
          warranty.productType = 3;
          warranty.title = 'Warranty Renewal Pending';
          warranty.description = warranty.productName;
        }

        return warranty;
      });

      warranties = warranties.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      return [...products, ...warranties, ...insurances, ...amcs];
    });
  }

  prepareNotificationData(user) {
    return this.modals.mailBox.findAll({
      where: {
        user_id: user.id,
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
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product"."id"')),
          'productURL'],
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
    }).then((result) => result.map(item => item.toJSON()));
  }

  updateNotificationStatus(user, notificationIds) {
    return this.modals.mailBox.update({
      status_id: 10,
    }, {
      where: {
        user_id: user.id,
        status_id: {
          $notIn: [3, 9],
        },
        notification_id: notificationIds,
      },
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
          // note that Sequelize returns token object array, we map it with token value only
          registration_ids: result.map(user => user.fcm_id),
          // iOS requires priority to be set as 'high' for message to be received in background
          priority: 'high',
          data: payload,
        },
      };
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          // request was success, should early return response to client
          reply({
            status: true,
          }).code(200);
        } else {
          reply({
            status: false,
            error,
          }).code(500);
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

      return reply({status: true});
    }).catch((err) => {
      console.log({API_Logs: err});
      return reply({status: false});
    });
  }
}

export default NotificationAdaptor;
