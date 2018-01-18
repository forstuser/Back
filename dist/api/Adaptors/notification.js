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
  }

  _createClass(NotificationAdaptor, [{
    key: 'retrieveNotifications',
    value: function retrieveNotifications(user, request) {
      return Promise.all([this.filterUpcomingService(user), this.prepareNotificationData(user)]).then(function (result) {
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
    value: function filterUpcomingService(user) {
      return Promise.all([this.productAdaptor.retrieveProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [6, 8]
      }), this.amcAdaptor.retrieveAMCs({
        user_id: user.id || user.ID,
        status_type: [5, 11]
      }), this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id || user.ID,
        status_type: [5, 11]
      }), this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id || user.ID,
        status_type: [5, 11]
      }), this.pucAdaptor.retrievePUCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3]
      }), this.productAdaptor.retrieveProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
      })]).then(function (result) {
        var products = result[0].map(function (item) {
          var product = item;

          product.productMetaData.map(function (metaItem) {
            var metaData = metaItem;
            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && (0, _moment2.default)(metaData.value, _moment2.default.ISO_8601).isValid()) {
              var dueDateTime = (0, _moment2.default)(metaData.value, _moment2.default.ISO_8601);
              product.dueDate = metaData.value;
              product.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            }

            if (metaData.name.toLowerCase().includes('address')) {
              product.description = metaData.value;
              product.address = metaData.value;
            }

            return metaData;
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

        products = products.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var pucProducts = result[4].map(function (item) {
          var puc = item;
          if (_moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).
                  isValid()) {
            var dueDateTime = _moment2.default.utc(puc.expiryDate,
                _moment2.default.ISO_8601).endOf('day');
            puc.dueDate = puc.expiryDate;
            puc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            puc.productType = 3;
            puc.title = 'PUC Renewal Pending';
            puc.description = puc.productName;
          }

          return puc;
        });

        pucProducts = pucProducts.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });
        var amcs = result[1].map(function (item) {
          var amc = item;
          if ((0, _moment2.default)(amc.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = (0, _moment2.default)(amc.expiryDate, _moment2.default.ISO_8601);
            amc.dueDate = amc.expiryDate;
            amc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            amc.productType = 3;
            amc.title = 'AMC Renewal Pending';
            amc.description = amc.productName;
          }

          return amc;
        });
        amcs = amcs.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var insurances = result[2].map(function (item) {
          var insurance = item;
          if ((0, _moment2.default)(insurance.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = (0, _moment2.default)(insurance.expiryDate, _moment2.default.ISO_8601);
            insurance.dueDate = insurance.expiryDate;
            insurance.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            insurance.productType = 3;
            insurance.title = 'Insurance Renewal Pending';
            insurance.description = insurance.productName;
          }
          return insurance;
        });

        insurances = insurances.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var warranties = result[3].map(function (item) {
          var warranty = item;
          if ((0, _moment2.default)(warranty.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = (0, _moment2.default)(warranty.expiryDate, _moment2.default.ISO_8601);

            warranty.dueDate = warranty.expiryDate;
            warranty.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            warranty.productType = 3;
            warranty.title = 'Warranty Renewal Pending';
            warranty.description = 'Warranty Renewal Pending for ' + (warranty.warranty_type === 3 ? warranty.dualWarrantyItem + ' of ' + warranty.productName : warranty.warranty_type === 4 ? 'Accessories of ' + warranty.productName : 'of ' + warranty.productName);
          }

          return warranty;
        });

        warranties = warranties.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var productServiceSchedule = result[5].map(function(item) {
          var scheduledProduct = item;
          var scheduledDate = scheduledProduct.schedule ?
              _moment2.default.utc(scheduledProduct.purchaseDate,
                  _moment2.default.ISO_8601).
                  add(scheduledProduct.schedule.due_in_months, 'months') :
              undefined;
          if (scheduledDate &&
              _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).
                  isValid()) {
            var due_date_time = _moment2.default.utc(scheduledDate,
                _moment2.default.ISO_8601).endOf('day');
            scheduledProduct.dueDate = scheduledDate;
            scheduledProduct.dueIn = due_date_time.diff(_moment2.default.utc(),
                'days');
            scheduledProduct.productType = 3;
            scheduledProduct.title = 'Service is pending for ' +
                scheduledProduct.productName;
            scheduledProduct.description = '' + scheduledProduct.productName;
          }

          return scheduledProduct;
        });

        productServiceSchedule = productServiceSchedule.filter(function(item) {
          return item.dueIn !== undefined && item.dueIn !== null &&
              item.dueIn <= 7 && item.dueIn >= 0;
        });

        return [].concat(_toConsumableArray(products),
            _toConsumableArray(warranties), _toConsumableArray(insurances),
            _toConsumableArray(amcs), _toConsumableArray(pucProducts),
            _toConsumableArray(productServiceSchedule));
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
      var _this = this;

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
          _this.notifyUserCron(upcomingNotification.user_id, upcomingNotification);
        });

        return Promise.all(notificationPromise);
      });
    }
  }, {
    key: 'createMissingDocNotification',
    value: function createMissingDocNotification(days) {
      var _this2 = this;

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
          _this2.notifyUserCron(upcomingNotification.user_id, upcomingNotification);
        });

        return Promise.all(notificationPromise);
      });
    }
  }, {
    key: 'createExpenseNotification',
    value: function createExpenseNotification(days) {
      var _this3 = this;

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
          _this3.notifyUserCron(upcomingNotification.user_id, upcomingNotification);
        });

        return Promise.all(notificationPromise);
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
        $gte: (0, _moment2.default)().subtract(days, 'day').startOf('day'),
        $lte: (0, _moment2.default)().subtract(days, 'day').endOf('day')
      } : days === 7 ? {
        $lte: (0, _moment2.default)().subtract(days, 'day').endOf('day'),
        $gte: (0, _moment2.default)().subtract(days, 'day').startOf('day')
      } : {
        $gte: (0, _moment2.default)().startOf('month'),
        $lte: (0, _moment2.default)().endOf('month')
      };
      return Promise.all([this.productAdaptor.retrieveNotificationProducts({
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
        $gte: (0, _moment2.default)().add(days, 'day').startOf('day'),
        $lte: (0, _moment2.default)().add(days, 'day').endOf('day')
      } : {
        $gte: (0, _moment2.default)().startOf('day'),
        $lte: (0, _moment2.default)().add(days, 'day').endOf('day')
      };
      return Promise.all([this.productAdaptor.retrieveNotificationProducts({
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
            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && (0, _moment2.default)(metaData.value, _moment2.default.ISO_8601).isValid()) {
              var dueDateTime = (0, _moment2.default)(metaData.value, _moment2.default.ISO_8601);
              product.dueDate = metaData.value;
              product.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
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
          return days === 15 ?
              item.dueDate <=
              _moment2.default.utc().add(days, 'day').endOf('day') &&
              item.dueDate >=
              _moment2.default.utc().add(days, 'day').startOf('day') :
              item.dueDate <=
              _moment2.default.utc().add(days, 'day').endOf('day') &&
              item.dueDate >= _moment2.default.utc().startOf('day');
        });
        var amcs = result[1].map(function (item) {
          var amc = item;
          if (_moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).
                  isValid()) {
            var dueDateTime = _moment2.default.utc(amc.expiryDate,
                _moment2.default.ISO_8601);
            amc.dueDate = amc.expiryDate;
            amc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            amc.productType = 3;
            amc.title = 'AMC Renewal Pending';
            amc.description = 'AMC #' + amc.policyNo + ' of ' + amc.productName;
          }

          return amc;
        });

        var insurances = result[2].map(function (item) {
          var insurance = item;
          if ((0, _moment2.default)(insurance.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = (0, _moment2.default)(insurance.expiryDate, _moment2.default.ISO_8601);
            insurance.dueDate = insurance.expiryDate;
            insurance.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
            insurance.productType = 3;
            insurance.title = 'Insurance Renewal Pending';
            insurance.description = 'Insurance #' + insurance.policyNo + ' of ' + insurance.productName;
          }
          return insurance;
        });

        var warranties = result[3].map(function (item) {
          var warranty = item;
          if ((0, _moment2.default)(warranty.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDateTime = (0, _moment2.default)(warranty.expiryDate, _moment2.default.ISO_8601);

            warranty.dueDate = warranty.expiryDate;
            warranty.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
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
          if (!error && response.statusCode === 200) {
            // request was success, should early return response to client
            reply({
              status: true
            }).code(200);
          } else {
            reply({
              status: false,
              error: error
            }).code(500);
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

        return reply({ status: true });
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false });
      });
    }
  }], [{
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
      smtpTransporter.sendMail(mailOptions);
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
      smtpTransporter.sendMail(mailOptions);
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
      smtpTransporter.sendMail(mailOptions);
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
          message: 'Hey there, \nPlease click on the link to download BinBill App and start building your eHome : http://play.google.com/store/apps/details?id=com.bin.binbillcustomer \nWhere there is a Bill,there is BinBill.',
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