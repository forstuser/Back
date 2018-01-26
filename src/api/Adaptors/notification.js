/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import config from '../../config/main';
import ProductAdaptor from './product';
import AMCAdaptor from './amcs';
import PUCAdaptor from './pucs';
import InsuranceAdaptor from './insurances';
import WarrantyAdaptor from './warranties';
import smtpTransport from 'nodemailer-smtp-transport';
import _ from 'lodash';
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
    this.pucAdaptor = new PUCAdaptor(modals);
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
        message: `Hey there, \nPlease click on the link to download BinBill App and start building your eHome : http://bit.ly/2rIabk0 \nNow Get Every Product, Each Detail and All Action In One Place - Your eHome..`,
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
        console.log(`Error on ${new Date()} is as follow: \n \n ${error}`);
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
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n ${err}`);
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
      this.productAdaptor.retrieveUpcomingProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [6, 8],
      }),
      this.amcAdaptor.retrieveAMCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [1, 2, 3],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.pucAdaptor.retrievePUCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.productAdaptor.retrieveUpcomingProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        service_schedule_id: {
          $not: null,
        },
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
            product.dueIn = dueDateTime.diff(moment.utc(), 'days');
          }
          product.description = '';
          product.address = '';
          if (metaData.name.toLowerCase().includes('address')) {
            product.description = metaData.value;
            product.address = metaData.value;
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

      let pucProducts = result[4].map((item) => {
        const puc = item;
        if (moment.utc(puc.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(puc.expiryDate, moment.ISO_8601).
              endOf('day');
          puc.dueDate = puc.expiryDate;
          puc.dueIn = dueDateTime.diff(moment.utc(), 'days');
          puc.productType = 3;
          puc.title = 'PUC Renewal Pending';
          puc.description = puc.productName;
        }

        return puc;
      });

      pucProducts = pucProducts.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0));
      let amcs = result[1].map((item) => {
        const amc = item;
        if (moment.utc(amc.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(amc.expiryDate, moment.ISO_8601);
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
        if (moment.utc(insurance.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(insurance.expiryDate, moment.ISO_8601);
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
        if (moment.utc(warranty.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment.utc(warranty.expiryDate, moment.ISO_8601);

          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
          warranty.productType = 3;
          warranty.title = `Warranty Renewal Pending`;
          warranty.description = `Warranty Renewal Pending for ${warranty.warranty_type ===
          3 ?
              `${warranty.dualWarrantyItem} of ${warranty.productName}` :
              warranty.warranty_type === 4 ?
                  `Accessories of ${warranty.productName}` :
                  `${warranty.productName}`}`;
        }

        return warranty;
      });

      warranties = warranties.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let productServiceSchedule = result[5].map((item) => {
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
          scheduledProduct.dueIn = due_date_time.diff(moment.utc(), 'days');
          scheduledProduct.productType = 3;
          scheduledProduct.title = `Service is pending for ${scheduledProduct.productName}`;
          scheduledProduct.description = `${scheduledProduct.productName}`;
        }

        return scheduledProduct;
      });

      productServiceSchedule = productServiceSchedule.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 7 && item.dueIn >= 0));

      return [
        ...products,
        ...warranties,
        ...insurances,
        ...amcs,
        ...pucProducts,
        ...productServiceSchedule];
    });
  }

  prepareNotificationData(user) {
    return this.modals.mailBox.findAll({
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
    }).then((result) => result.map(item => item.toJSON()));
  }

  updateNotificationStatus(user, notificationIds) {
    return this.modals.mailBox.update({
      status_id: 10,
    }, {
      where: {
        user_id: user.id || user.ID,
        status_id: {
          $notIn: [3, 9],
        },
        notification_id: notificationIds,
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
            product.dueIn = dueDateTime.diff(moment.utc(), 'days');
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
          amc.dueIn = dueDateTime.diff(moment.utc(), 'days');
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
          insurance.dueIn = dueDateTime.diff(moment.utc(), 'days');
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
          warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
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
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false});
    });
  }
}

export default NotificationAdaptor;
