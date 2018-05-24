/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _pucs = require('./pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _nodemailerSmtpTransport = require('nodemailer-smtp-transport');

var _nodemailerSmtpTransport2 = _interopRequireDefault(_nodemailerSmtpTransport);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NotificationAdaptor = function () {
  function NotificationAdaptor(modals) {
    _classCallCheck(this, NotificationAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.pucAdaptor = new _pucs2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
  }

  _createClass(NotificationAdaptor, [{
    key: 'retrieveNotifications',
    value: function retrieveNotifications(user, request) {
      return _bluebird2.default.all([this.filterUpcomingService(user, request), this.prepareNotificationData(user)]).then(function (result) {
        var upcomingServices = result[0].map(function (elem) {
          if (elem.productType === 4) {
            var dueAmountArr = elem.productMetaData.filter(function (e) {
              return e.name.toLowerCase() === 'due amount';
            });

            if (dueAmountArr.length > 0) {
              elem.value = dueAmountArr[0].value;
            }
          }

          return elem;
        });
        /* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */

        upcomingServices.sort(function (a, b) {
          var aDate = void 0;
          var bDate = void 0;

          aDate = a.expiryDate;
          bDate = b.expiryDate;

          if (a.productType === 1) {
            aDate = a.dueDate;
          }

          if (b.productType === 1) {
            bDate = b.dueDate;
          }

          if (_moment2.default.utc(aDate, 'YYYY-MM-DD').isBefore(_moment2.default.utc(bDate, 'YYYY-MM-DD'))) {
            return -1;
          }

          return 1;
        });

        var notifications = [].concat(_toConsumableArray(upcomingServices), _toConsumableArray(result[1]));
        return {
          status: true,
          message: 'Mailbox restore Successful',
          notifications: notifications,
          forceUpdate: request.pre.forceUpdate
          /* .slice(listIndex, 10), */
          /* nextPageUrl: notifications.length >
               listIndex + 10 ? `consumer/mailbox?pageno=${parseInt(pageNo, 10) + 1}` : '' */
        };
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n ' + err);
        return {
          status: false,
          message: 'Mailbox restore failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'filterUpcomingService',
    value: function filterUpcomingService(user, request) {
      var _this = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this.productAdaptor.retrieveNotificationProducts({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [6, 8]
        }), _this.amcAdaptor.retrieveAMCs({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this.insuranceAdaptor.retrieveInsurances({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this.warrantyAdaptor.retrieveWarranties({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [1, 2, 3],
          warranty_type: [1, 2],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this.pucAdaptor.retrievePUCs({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [3],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this.productAdaptor.retrieveUpcomingProducts({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [3],
          service_schedule_id: {
            $not: null
          }
        }, request.language), _this.repairAdaptor.retrieveRepairs({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          warranty_upto: {
            $ne: null
          }
        })]);
      }).spread(function (productDetails, amcList, insuranceList, warrantyList, pucList, serviceScheduleList, repairList) {
        var metaData = productDetails[0];
        var productList = productDetails[1].map(function (productItem) {
          productItem.productMetaData = metaData.filter(function (item) {
            return item.productId === productItem.id;
          });

          return productItem;
        });
        productList = productList.map(function (item) {
          var product = item;

          product.productMetaData.forEach(function (metaItem) {
            var metaData = metaItem;
            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && (_moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid() || _moment2.default.utc(metaData.value, 'DD MMM YYYY').isValid())) {
              var dueDateTime = _moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(metaData.value, _moment2.default.ISO_8601) : _moment2.default.utc(metaData.value, 'DD MMM YYYY');
              product.dueDate = metaData.value;
              product.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            }
            product.description = '';
            product.address = '';
            if (metaData.name.toLowerCase().includes('address')) {
              product.description = metaData.value;
              product.address = metaData.value;
            }
          });

          if (product.masterCategoryId.toString() === '6') {
            product.title = product.productName + ' Reminder';
            product.productType = 5;
          } else {
            product.title = product.productName + ' Reminder';
            product.productType = 4;
          }

          return product;
        });

        productList = productList.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var pucProducts = pucList.map(function (item) {
          var puc = item;
          if (_moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).endOf('day');
            puc.dueDate = puc.expiryDate;
            puc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            puc.productType = 3;
            puc.title = 'PUC Renewal Pending';
            puc.description = 'PUC Renewal Pending for ' + puc.productName;
          }

          return puc;
        });

        pucProducts = pucProducts.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });
        var amcs = amcList.map(function (item) {
          var amc = item;
          if (_moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601);
            amc.dueDate = amc.expiryDate;
            amc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            amc.productType = 3;
            amc.title = 'AMC Renewal Pending';
            amc.description = 'AMC Renewal Pending for ' + amc.productName;
          }

          return amc;
        });
        amcs = amcs.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var insurances = insuranceList.map(function (item) {
          var insurance = item;
          if (_moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601);
            insurance.dueDate = insurance.expiryDate;
            insurance.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            insurance.productType = 3;
            insurance.title = 'Insurance Renewal Pending';
            insurance.description = 'Insurance Renewal Pending for ' + insurance.productName;
          }
          return insurance;
        });

        insurances = insurances.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var warranties = warrantyList.map(function (item) {
          var warranty = item;
          if (_moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601);

            warranty.dueDate = warranty.expiryDate;
            warranty.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            warranty.productType = 3;
            warranty.title = 'Warranty Renewal Pending';
            warranty.description = 'Warranty Renewal Pending for ' + (warranty.warranty_type === 3 ? (warranty.dualWarrantyItem || 'dual item') + ' of ' + warranty.productName : warranty.warranty_type === 4 ? 'Accessories of ' + warranty.productName : '' + warranty.productName);
          }

          return warranty;
        });

        warranties = warranties.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var repairWarranties = repairList.map(function (item) {
          var warranty = item;
          if (_moment2.default.utc(warranty.warranty_upto, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(warranty.warranty_upto, _moment2.default.ISO_8601).endOf('day');
            warranty.dueDate = warranty.warranty_upto;
            warranty.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            warranty.productType = 7;
            warranty.title = 'Repair Warranty Expiring';
            warranty.description = 'Warranty Renewal Expiring for ' + warranty.productName;
          }
          return warranty;
        });

        repairWarranties = repairWarranties.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var productServiceSchedule = serviceScheduleList.map(function (item) {
          var scheduledProduct = item;
          var scheduledDate = scheduledProduct.schedule ? _moment2.default.utc(scheduledProduct.purchaseDate, _moment2.default.ISO_8601).add(scheduledProduct.schedule.due_in_months, 'months') : undefined;
          if (scheduledDate && _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).isValid()) {
            var due_date_time = _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).endOf('day');
            scheduledProduct.dueDate = scheduledDate;
            scheduledProduct.dueIn = due_date_time.diff(_moment2.default.utc(), 'days', true);
            scheduledProduct.productType = 3;
            scheduledProduct.title = 'Service is pending for ' + scheduledProduct.productName;
            scheduledProduct.description = 'Service is pending for ' + scheduledProduct.productName;
          }

          return scheduledProduct;
        });

        productServiceSchedule = productServiceSchedule.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 7 && item.dueIn >= 0;
        });

        return [].concat(_toConsumableArray(productList), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs), _toConsumableArray(pucProducts), _toConsumableArray(productServiceSchedule), _toConsumableArray(repairWarranties));
      });
    }
  }, {
    key: 'prepareNotificationData',
    value: function prepareNotificationData(user) {
      return this.modals.mailBox.findAll({
        where: {
          user_id: user.id || user.ID,
          status_id: {
            $notIn: [3, 9]
          }
        },
        include: [{
          model: this.modals.products,
          as: 'product',
          attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('"product"."id"')), 'productURL']],
          required: false
        }],
        order: [['created_at', 'DESC']],
        attributes: [['notification_id', 'id'], ['due_amount', 'dueAmount'], [this.modals.sequelize.literal('"product"."id"'), 'productId'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product"."id"')), 'productURL'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('"product"."document_date"'), 'purchaseDate'], ['due_date', 'dueDate'], 'taxes', ['total_amount', 'totalAmount'], ['notification_type', 'productType'], 'title', 'description', ['status_id', 'statusId'], ['created_at', 'createdAt'], 'copies']
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'updateNotificationStatus',
    value: function updateNotificationStatus(user, notificationIds) {
      return this.modals.mailBox.update({
        status_id: 10
      }, {
        where: {
          user_id: user.id || user.ID,
          status_id: {
            $notIn: [3, 9]
          },
          notification_id: notificationIds
        }
      });
    }
  }, {
    key: 'createNotifications',
    value: function createNotifications(days) {
      var _this2 = this;

      return this.retrieveCronNotification(days).then(function (result) {
        var upcomingServices = result.map(function (elem) {
          if (elem.productType === 4) {
            var dueAmountArr = elem.productMetaData.filter(function (e) {
              return e.name.toLowerCase() === 'due amount';
            });

            if (dueAmountArr.length > 0) {
              elem.value = dueAmountArr[0].value;
            }
          }
          var update = elem;
          update.bill_product_id = update.productId;
          update.bill_id = update.jobId;
          update.due_amount = update.value;
          update.due_date = update.dueDate;
          update.notification_type = update.productType;

          update = _lodash2.default.omit(update, 'id');
          update = _lodash2.default.omit(update, 'productId');
          update = _lodash2.default.omit(update, 'jobId');
          update = _lodash2.default.omit(update, 'policyNo');
          update = _lodash2.default.omit(update, 'premiumType');
          update = _lodash2.default.omit(update, 'productName');
          update = _lodash2.default.omit(update, 'premiumAmount');
          update = _lodash2.default.omit(update, 'dueDate');
          update = _lodash2.default.omit(update, 'productType');
          update = _lodash2.default.omit(update, 'sellers');
          update = _lodash2.default.omit(update, 'onlineSellers');
          update = _lodash2.default.omit(update, 'dueIn');
          update = _lodash2.default.omit(update, 'purchaseDate');
          update = _lodash2.default.omit(update, 'updatedDate');
          update = _lodash2.default.omit(update, 'effectiveDate');
          update = _lodash2.default.omit(update, 'expiryDate');
          update = _lodash2.default.omit(update, 'value');
          update = _lodash2.default.omit(update, 'taxes');
          update = _lodash2.default.omit(update, 'categoryId');
          update = _lodash2.default.omit(update, 'brandId');
          update = _lodash2.default.omit(update, 'colorId');
          update = _lodash2.default.omit(update, 'value');
          update = _lodash2.default.omit(update, 'documentNo');
          update = _lodash2.default.omit(update, 'billId');
          update = _lodash2.default.omit(update, 'sellerId');
          update = _lodash2.default.omit(update, 'reviewUrl');
          update = _lodash2.default.omit(update, 'color');
          update = _lodash2.default.omit(update, 'brand');
          update = _lodash2.default.omit(update, 'bill');
          update = _lodash2.default.omit(update, 'productReviews');
          update = _lodash2.default.omit(update, 'productMetaData');
          update = _lodash2.default.omit(update, 'insuranceDetails');
          update = _lodash2.default.omit(update, 'warrantyDetails');
          update = _lodash2.default.omit(update, 'amcDetails');
          update = _lodash2.default.omit(update, 'repairBills');
          update = _lodash2.default.omit(update, 'requiredCount');
          update = _lodash2.default.omit(update, 'dueDate');
          update = _lodash2.default.omit(update, 'dueIn');
          return update;
        });
        /* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */

        upcomingServices.sort(function (a, b) {
          var aDate = void 0;
          var bDate = void 0;

          aDate = a.dueDate;
          bDate = b.dueDate;
          if (_moment2.default.utc(aDate, 'YYYY-MM-DD').isBefore(_moment2.default.utc(bDate, 'YYYY-MM-DD'))) {
            return -1;
          }

          return 1;
        });
        var notificationPromise = upcomingServices.map(function (upcomingNotification) {
          _this2.notifyUserCron(upcomingNotification.user_id, upcomingNotification);
        });

        return _bluebird2.default.all(notificationPromise);
      });
    }
  }, {
    key: 'createMissingDocNotification',
    value: function createMissingDocNotification(days) {
      var _this3 = this;

      return this.retrieveMissingDocNotification(days).then(function (result) {
        var upcomingServices = result.map(function (elem) {
          if (elem.productType === 4) {
            var dueAmountArr = elem.productMetaData.filter(function (e) {
              return e.name.toLowerCase() === 'due amount';
            });

            if (dueAmountArr.length > 0) {
              elem.value = dueAmountArr[0].value;
            }
          }
          var update = elem;
          update.bill_product_id = update.productId;
          update.bill_id = update.jobId;
          update.due_amount = update.value;
          update.notification_type = update.productType;

          update = _lodash2.default.omit(update, 'id');
          update = _lodash2.default.omit(update, 'productId');
          update = _lodash2.default.omit(update, 'jobId');
          update = _lodash2.default.omit(update, 'policyNo');
          update = _lodash2.default.omit(update, 'premiumType');
          update = _lodash2.default.omit(update, 'productName');
          update = _lodash2.default.omit(update, 'premiumAmount');
          update = _lodash2.default.omit(update, 'dueDate');
          update = _lodash2.default.omit(update, 'productType');
          update = _lodash2.default.omit(update, 'sellers');
          update = _lodash2.default.omit(update, 'onlineSellers');
          update = _lodash2.default.omit(update, 'dueIn');
          update = _lodash2.default.omit(update, 'purchaseDate');
          update = _lodash2.default.omit(update, 'updatedDate');
          update = _lodash2.default.omit(update, 'effectiveDate');
          update = _lodash2.default.omit(update, 'expiryDate');
          update = _lodash2.default.omit(update, 'value');
          update = _lodash2.default.omit(update, 'taxes');
          update = _lodash2.default.omit(update, 'categoryId');
          update = _lodash2.default.omit(update, 'brandId');
          update = _lodash2.default.omit(update, 'colorId');
          update = _lodash2.default.omit(update, 'value');
          update = _lodash2.default.omit(update, 'documentNo');
          update = _lodash2.default.omit(update, 'billId');
          update = _lodash2.default.omit(update, 'sellerId');
          update = _lodash2.default.omit(update, 'reviewUrl');
          update = _lodash2.default.omit(update, 'color');
          update = _lodash2.default.omit(update, 'brand');
          update = _lodash2.default.omit(update, 'bill');
          update = _lodash2.default.omit(update, 'productReviews');
          update = _lodash2.default.omit(update, 'productMetaData');
          update = _lodash2.default.omit(update, 'insuranceDetails');
          update = _lodash2.default.omit(update, 'warrantyDetails');
          update = _lodash2.default.omit(update, 'amcDetails');
          update = _lodash2.default.omit(update, 'repairBills');
          update = _lodash2.default.omit(update, 'requiredCount');
          update = _lodash2.default.omit(update, 'dueDate');
          update = _lodash2.default.omit(update, 'dueIn');
          return update;
        });

        var notificationPromise = upcomingServices.map(function (upcomingNotification) {
          _this3.notifyUserCron(upcomingNotification.user_id, upcomingNotification);
        });

        return _bluebird2.default.all(notificationPromise);
      });
    }
  }, {
    key: 'createExpenseNotification',
    value: function createExpenseNotification(days) {
      var _this4 = this;

      return this.retrieveMissingDocNotification(days).then(function (result) {

        var expenseUpdates = result.map(function (resultItem) {
          return {
            notification_type: days === 1 ? 5 : days === 6 ? 6 : 7,
            due_amount: resultItem.value,
            taxes: resultItem.taxes,
            title: days === 1 ? 'Daily Expense' : days === 7 ? 'Last Seven Days Expense' : 'Monthly Expense',
            description: days === 1 ? 'Daily Expense Summary' : days === 7 ? 'Last Seven Days Expense Summary' : 'Monthly Expense Summary',
            productUrl: days === 1 ? '/insight' : days === 7 ? '/insight' : '/insight',
            user_id: resultItem.user_id
          };
        });
        var upcomingServices = [];

        expenseUpdates.forEach(function (item) {
          var index = upcomingServices.findIndex(function (distinctItem) {
            return distinctItem.user_id === item.user_id;
          });
          if (index === -1) {
            upcomingServices.push({
              notification_type: item.notification_type,
              due_amount: item.due_amount,
              taxes: item.taxes,
              title: item.title,
              description: item.description,
              productUrl: item.productUrl,
              user_id: item.user_id
            });
          } else {
            upcomingServices[index].due_amount += item.due_amount;
            upcomingServices[index].taxes += item.taxes;
          }
        });

        var notificationPromise = upcomingServices.map(function (upcomingNotification) {
          _this4.notifyUserCron(upcomingNotification.user_id, upcomingNotification);
        });

        return _bluebird2.default.all(notificationPromise);
      });
    }
  }, {
    key: 'retrieveMissingDocNotification',
    value: function retrieveMissingDocNotification() {
      return this.productAdaptor.retrieveMissingDocProducts({
        status_type: [5, 8, 11]
      }).then(function (result) {
        return result.map(function (item) {
          var product = item;

          product.title = product.productName + ' Reminder';
          product.description = 'Some of Documents are missing';
          product.productType = 10;
          return product;
        });
      });
    }
  }, {
    key: 'retrieveExpenseCronNotification',
    value: function retrieveExpenseCronNotification(days) {
      var purchaseDateCompare = days === 1 ? {
        $gte: _moment2.default.utc().subtract(days, 'day').startOf('day'),
        $lte: _moment2.default.utc().subtract(days, 'day').endOf('day')
      } : days === 7 ? {
        $lte: _moment2.default.utc().subtract(days, 'day').endOf('day'),
        $gte: _moment2.default.utc().subtract(days, 'day').startOf('day')
      } : {
        $gte: _moment2.default.utc().startOf('month'),
        $lte: _moment2.default.utc().endOf('month')
      };
      return _bluebird2.default.all([this.productAdaptor.retrieveNotificationProducts({
        status_type: [5, 11],
        document_date: purchaseDateCompare
      }), this.amcAdaptor.retrieveNotificationAMCs({
        status_type: 5,
        document_date: purchaseDateCompare
      }), this.insuranceAdaptor.retrieveNotificationInsurances({
        status_type: 5,
        document_date: purchaseDateCompare
      }), this.warrantyAdaptor.retrieveNotificationWarranties({
        status_type: 5,
        document_date: purchaseDateCompare
      })]).then(function (result) {
        var products = result[0];

        var amcs = result[1];

        var insurances = result[2];

        var warranties = result[3];

        return [].concat(_toConsumableArray(products), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs));
      });
    }
  }, {
    key: 'retrieveCronNotification',
    value: function retrieveCronNotification(days) {
      var expiryDateCompare = days === 15 ? {
        $gte: _moment2.default.utc().add(days, 'day').startOf('day'),
        $lte: _moment2.default.utc().add(days, 'day').endOf('day')
      } : {
        $gte: _moment2.default.utc().startOf('day'),
        $lte: _moment2.default.utc().add(days, 'day').endOf('day')
      };
      return _bluebird2.default.all([this.productAdaptor.retrieveNotificationProducts({
        status_type: 5,
        main_category_id: [6, 8]
      }), this.amcAdaptor.retrieveNotificationAMCs({
        status_type: 5,
        expiry_date: expiryDateCompare
      }), this.insuranceAdaptor.retrieveNotificationInsurances({
        status_type: 5,
        expiry_date: expiryDateCompare
      }), this.warrantyAdaptor.retrieveNotificationWarranties({
        status_type: 5,
        expiry_date: expiryDateCompare
      })]).then(function (result) {
        var products = result[0].map(function (item) {
          var product = item;

          product.productMetaData.map(function (metaItem) {
            var metaData = metaItem;
            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && _moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid()) {
              var dueDateTime = _moment2.default.utc(metaData.value, _moment2.default.ISO_8601);
              product.dueDate = metaData.value;
              product.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            }

            if (metaData.name.toLowerCase().includes('address')) {
              product.description = metaData.name.toLowerCase().includes('address') ? '' + metaData.value : '';
            }

            return metaData;
          });

          product.title = product.productName + ' Reminder';
          product.productType = 4;
          return product;
        });

        products = products.filter(function (item) {
          return days === 15 ? item.dueDate <= _moment2.default.utc().add(days, 'day').endOf('day') && item.dueDate >= _moment2.default.utc().add(days, 'day').startOf('day') : item.dueDate <= _moment2.default.utc().add(days, 'day').endOf('day') && item.dueDate >= _moment2.default.utc().startOf('day');
        });
        var amcs = result[1].map(function (item) {
          var amc = item;
          if (_moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601);
            amc.dueDate = amc.expiryDate;
            amc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            amc.productType = 3;
            amc.title = 'AMC Renewal Pending';
            amc.description = 'AMC #' + amc.policyNo + ' of ' + amc.productName;
          }

          return amc;
        });

        var insurances = result[2].map(function (item) {
          var insurance = item;
          if (_moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601);
            insurance.dueDate = insurance.expiryDate;
            insurance.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            insurance.productType = 3;
            insurance.title = 'Insurance Renewal Pending';
            insurance.description = 'Insurance #' + insurance.policyNo + ' of ' + insurance.productName;
          }
          return insurance;
        });

        var warranties = result[3].map(function (item) {
          var warranty = item;
          if (_moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = _moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601);

            warranty.dueDate = warranty.expiryDate;
            warranty.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days', true);
            warranty.productType = 3;
            warranty.title = 'Warranty Renewal Pending';
            warranty.description = 'Warranty #' + warranty.policyNo + ' of ' + warranty.productName;
          }

          return warranty;
        });

        return [].concat(_toConsumableArray(products), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs));
      });
    }
  }, {
    key: 'notifyUserCron',
    value: function notifyUserCron(userId, payload) {
      return this.modals.fcmDetails.findAll({
        where: {
          user_id: userId
        }
      }).then(function (result) {
        var options = {
          uri: 'https://fcm.googleapis.com/fcm/send',
          method: 'POST',
          headers: { Authorization: 'key=' + _main2.default.GOOGLE.FCM_KEY },
          json: {
            // note that Sequelize returns token object array, we map it with token value only
            registration_ids: result.map(function (user) {
              return user.fcm_id;
            }),
            // iOS requires priority to be set as 'high' for message to be received in background
            priority: 'high',
            data: payload
          }
        };
        (0, _request2.default)(options, function (error, response, body) {
          if (!(!error && response.statusCode === 200)) {
            console.log('Error on ' + new Date() + ' is as follow: \n \n ' + {
              error: error,
              userId: userId,
              user: JSON.stringify(result)
            });
          }
          // extract invalid registration for removal
          if (body.failure > 0 && Array.isArray(body.results) && body.results.length === result.length) {
            var results = body.results;
            for (var i = 0; i < result.length; i += 1) {
              if (results[i].error === 'InvalidRegistration') {
                result[i].destroy().then(function (rows) {
                  console.log('FCM ID\'s DELETED: ', rows);
                });
              }
            }
          }
        });
      });
    }
  }, {
    key: 'notifyUser',
    value: function notifyUser(userId, payload, reply) {
      return this.modals.fcmDetails.findAll({
        where: {
          user_id: userId
        }
      }).then(function (result) {
        var options = {
          uri: 'https://fcm.googleapis.com/fcm/send',
          method: 'POST',
          headers: { Authorization: 'key=' + _main2.default.GOOGLE.FCM_KEY },
          json: {
            // note that Sequelize returns token object array, we map it with token value only
            registration_ids: result.map(function (user) {
              return user.fcm_id;
            }),
            // iOS requires priority to be set as 'high' for message to be received in background
            priority: 'high',
            data: payload
          }
        };
        (0, _request2.default)(options, function (error, response, body) {
          // extract invalid registration for removal
          if (body.failure > 0 && Array.isArray(body.results) && body.results.length === result.length) {
            var results = body.results;
            for (var i = 0; i < result.length; i += 1) {
              if (results[i].error === 'InvalidRegistration') {
                result[i].destroy().then(function (rows) {
                  console.log('FCM ID\'s DELETED: ', rows);
                });
              }
            }
          }
          if (!error && response.statusCode === 200) {
            // request was success, should early return response to client
            return reply.response({
              status: true
            }).code(200);
          } else {
            return reply.response({
              status: false,
              error: error
            });
          }
        });
      });
    }
  }, {
    key: 'verifyEmailAddress',
    value: function verifyEmailAddress(emailSecret, reply) {
      return this.modals.users.findOne({
        where: {
          user_status_type: {
            $ne: 3
          },
          email_secret: emailSecret
        }
      }).then(function (result) {
        result.updateAttributes({
          email_verified: true
        });

        return reply.response({ status: true });
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user is as follow: \n \n ' + err);
        return reply.response({ status: false });
      });
    }
  }], [{
    key: 'sendUserCommentToTeam',
    value: function sendUserCommentToTeam(subject, userData) {
      var smtpTransporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
        service: 'gmail',
        auth: {
          user: _main2.default.EMAIL.USER,
          pass: _main2.default.EMAIL.PASSWORD
        },
        secure: true,
        port: 465
      }));

      // setup email data with unicode symbols
      var mailOptions = {
        from: '"BinBill" <' + _main2.default.EMAIL.USER + '>', // sender address
        to: _main2.default.EMAIL.TEAM_EMAIL, // list of receivers
        subject: subject,
        html: '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting"> <title>BinBill</title> <style>@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 400; src: local(\'Quicksand Regular\'), local(\'Quicksand-Regular\'), url(https://fonts.gstatic.com/s/quicksand/v6/NUrn2XQrRfyGZp5MknntaRJtnKITppOI_IvcXXDNrsc.woff2) format(\'woff2\'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 400; src: local(\'Quicksand Regular\'), local(\'Quicksand-Regular\'), url(https://fonts.gstatic.com/s/quicksand/v6/s2PXW4WrV3VLrOUpHiqsfRJtnKITppOI_IvcXXDNrsc.woff2) format(\'woff2\'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 400; src: local(\'Quicksand Regular\'), local(\'Quicksand-Regular\'), url(https://fonts.gstatic.com/s/quicksand/v6/sKd0EMYPAh5PYCRKSryvW1tXRa8TVwTICgirnJhmVJw.woff2) format(\'woff2\'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 500; src: local(\'Quicksand Medium\'), local(\'Quicksand-Medium\'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dv8zf_FOSsgRmwsS7Aa9k2w.woff2) format(\'woff2\'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 500; src: local(\'Quicksand Medium\'), local(\'Quicksand-Medium\'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dj0LW-43aMEzIO6XUTLjad8.woff2) format(\'woff2\'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 500; src: local(\'Quicksand Medium\'), local(\'Quicksand-Medium\'), url(https://fonts.gstatic.com/s/quicksand/v6/FRGja7LlrG1Mypm0hCq0Dugdm0LZdjqr5-oayXSOefg.woff2) format(\'woff2\'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 700; src: local(\'Quicksand Bold\'), local(\'Quicksand-Bold\'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsv8zf_FOSsgRmwsS7Aa9k2w.woff2) format(\'woff2\'); unicode-range: U+0102-0103, U+1EA0-1EF9, U+20AB;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 700; src: local(\'Quicksand Bold\'), local(\'Quicksand-Bold\'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsj0LW-43aMEzIO6XUTLjad8.woff2) format(\'woff2\'); unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family: \'Quicksand\'; font-style: normal; font-weight: 700; src: local(\'Quicksand Bold\'), local(\'Quicksand-Bold\'), url(https://fonts.gstatic.com/s/quicksand/v6/32nyIRHyCu6iqEka_hbKsugdm0LZdjqr5-oayXSOefg.woff2) format(\'woff2\'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215;}html, body{margin: 0 auto !important; padding: 0 !important; height: 100% !important; /* width: 100% !important; */}*{-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"]{margin: 0 !important;}table, td{mso-table-lspace: 0 !important; mso-table-rspace: 0 !important;}table{border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important;}table table table{table-layout: auto;}img{-ms-interpolation-mode: bicubic;}*[x-apple-data-detectors], /* iOS */ .x-gmail-data-detectors, /* Gmail */ .x-gmail-data-detectors *, .aBn{border-bottom: 0 !important; cursor: default !important; color: inherit !important; /* text-decoration: none !important; */ font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}/* What it does: Prevents Gmail from displaying an download button on large, non-linked images. */ .a6S{display: none !important; opacity: 0.01 !important;}/* If the above doesn\'t work, add a .g-img class to any image in question. */ img.g-img+div{display: none !important;}/* What it does: Prevents underlining the button text in Windows 10 */ .button-link{text-decoration: none !important;}/* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89 */ /* Create one of these media queries for each additional viewport size you\'d like to fix */ /* Thanks to Eric Lepetit (@ericlepetitsf) for help troubleshooting */ @media only screen and (min-width: 320px) and (max-width: 600px){/* iPhone 6 and 6+ */ .email-container{max-width: 600px; margin: auto;}}@media only screen and (min-width: 600px) and (max-width: 1400px){/* iPhone 6 and 6+ */ .email-container{width:100%;}.main-class{font-size:16px;}}/* @media only screen and (min-device-width: 375px) and (max-device-width: 413px){/* iPhone 6 and 6+ */ /* .email-container{min-width: 375px !important;}*/ </style> <style>/* What it does: Hover styles for buttons */ .button-td, .button-a{transition: all 100ms ease-in;}.button-td:hover, .button-a:hover{background: #555555 !important; border-color: #555555 !important;}/* Media Queries */ @media screen and (max-width: 600px){/* What it does: Adjust typography on small screens to improve readability */ .email-container p{line-height: 14px !important;}.main-class{font-size:12px;}}</style></head><body width="100%" bgcolor="#222222" style="margin: 0; mso-line-height-rule: exactly;"><center style="width: 100%; background: #cecece; text-align: left;"><div style="border:1px solid black;" class="email-container"><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td bgcolor="#ffffff"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="padding: 20px; font-family: sans-serif; font-size: 15px; line-height: 20px; color: #555555;"><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: \'Quicksand\', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;">Dear Team,</p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">We have received a comment from user ' + userData.name + ' (Phone: ' + userData.phone + ', Email: ' + userData.email + '), which is as follow:</p><q class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">' + userData.message + '</q><p style="margin:0 auto; font-weight: bold; -webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">\n                                    One Home : Multiple Needs : One App</p><p style="margin:0 auto; -webkit-margin-before: 0; -webkit-margin-after: 0;padding: 10px 0;">Regards<br/>Support BinBill </p><img style="width: 100px" atr="logo" src="https://s3.ap-south-1.amazonaws.com/binbill-static/logo-color.png"/></td></tr></table></td></tr></table></div></center></body></html>'
      };

      smtpTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', _nodemailer2.default.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });
    }
  }, {
    key: 'sendVerificationMail',
    value: function sendVerificationMail(email, user) {
      var smtpTransporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
        service: 'gmail',
        auth: {
          user: _main2.default.EMAIL.USER,
          pass: _main2.default.EMAIL.PASSWORD
        },
        secure: true,
        port: 465
      }));

      // setup email data with unicode symbols
      var mailOptions = {
        from: '"BinBill" <' + _main2.default.EMAIL.USER + '>', // sender address
        to: email, // list of receivers
        subject: 'BinBill Email Verification',
        html: _shared2.default.retrieveMailTemplate(user, 0)
      };

      // send mail with defined transport object
      smtpTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', _nodemailer2.default.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });
    }
  }, {
    key: 'sendMailOnUpload',
    value: function sendMailOnUpload(subject, email) {
      var smtpTransporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
        service: 'gmail',
        auth: {
          user: _main2.default.EMAIL.USER,
          pass: _main2.default.EMAIL.PASSWORD
        },
        secure: true,
        port: 465
      }));

      // setup email data with unicode symbols
      var mailOptions = {
        from: '"BinBill" <' + _main2.default.EMAIL.USER + '>', // sender address
        to: email, // list of receivers
        subject: subject,
        html: '<p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: \'Quicksand\', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> Hi Team,</p><p class="main-class" style="margin:0 auto;-webkit-margin-before: 0; -webkit-margin-after: 0; font-family: \'Quicksand\', sans-serif;font-weight: 500;letter-spacing: 0.3px;text-align: left;color: #3b3b3b; padding: 10px 0;"> New Job has been added on Admin.</p>'
      };

      // send mail with defined transport object
      smtpTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', _nodemailer2.default.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });
    }
  }, {
    key: 'sendMailOnDifferentSteps',
    value: function sendMailOnDifferentSteps(subject, email, user, stepId) {
      var smtpTransporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
        service: 'gmail',
        auth: {
          user: _main2.default.EMAIL.USER,
          pass: _main2.default.EMAIL.PASSWORD
        },
        secure: true,
        port: 465
      }));

      // setup email data with unicode symbols
      var mailOptions = {
        from: '"BinBill" <' + _main2.default.EMAIL.USER + '>', // sender address
        to: email, // list of receivers
        subject: subject,
        html: _shared2.default.retrieveMailTemplate(user, stepId)
      };

      // send mail with defined transport object
      smtpTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', _nodemailer2.default.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });
    }
  }, {
    key: 'verifyCaptcha',
    value: function verifyCaptcha(response) {
      var options = {
        uri: _main2.default.GOOGLE.SITE_VERIFY,
        formData: {
          secret: _main2.default.GOOGLE.SECRET,
          response: response
        },
        method: 'POST',
        timeout: 170000,
        json: true // Automatically parses the JSON string in the response
      };
      return (0, _requestPromise2.default)(options).then(function (response) {
        return !!response.success;
      }).catch(function (error) {
        console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
        return false;
      });
    }
  }, {
    key: 'sendLinkOnMessage',
    value: function sendLinkOnMessage(phoneNo) {
      var options = {
        uri: 'http://api.msg91.com/api/sendhttp.php',
        qs: {
          authkey: _main2.default.SMS.AUTH_KEY,
          sender: 'BINBIL',
          flash: 0,
          mobiles: '91' + phoneNo,
          message: 'Hey there, \nPlease click on the link to download BinBill App and start building your eHome : http://bit.ly/2rIabk0 \nNow Get Every Product, Each Detail and All Action In One Place - Your eHome..',
          route: 4,
          country: 91,
          response: 'json'
        },
        timeout: 170000,
        json: true // Automatically parses the JSON string in the response
      };
      (0, _request2.default)(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          // request was success, should early return response to client
          return {
            status: true
          };
        } else {
          console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
        }
      });
    }
  }]);

  return NotificationAdaptor;
}();

exports.default = NotificationAdaptor;