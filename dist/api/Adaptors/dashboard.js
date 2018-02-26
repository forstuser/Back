/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _notification = require('./notification');

var _notification2 = _interopRequireDefault(_notification);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _pucs = require('./pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DashboardAdaptor = function () {
  function DashboardAdaptor(modals) {
    _classCallCheck(this, DashboardAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.pucAdaptor = new _pucs2.default(modals);
    this.date = _moment2.default.utc();
  }

  _createClass(DashboardAdaptor, [{
    key: 'retrieveDashboardResult',
    value: function retrieveDashboardResult(user, request) {
      return Promise.all([this.filterUpcomingService(user), this.prepareInsightData(user), this.retrieveRecentSearch(user), this.modals.mailBox.count({ where: { user_id: user.id || user.ID, status_id: 4 } }), this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: [5, 8]
        },
        include: [{
          model: this.modals.bills,
          where: {
            status_type: 5
          },
          required: true
        }]
      }), this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: 11
        }
      }), this.productAdaptor.retrieveUsersLastProduct({
        user_id: user.id || user.ID,
        status_type: [5, 8, 11]
      })]).then(function (result) {
        var upcomingServices = result[0].map(function (elem) {
          if (elem.productType === 1) {
            var dueAmountArr = elem.productMetaData.filter(function (e) {
              return e.name.toLowerCase() === 'due amount';
            });

            if (dueAmountArr.length > 0) {
              elem.value = dueAmountArr[0].value;
            }
          }

          return elem;
        });

        var distinctInsight = [];
        var insightData = result[1].map(function (item) {
          var insightItem = item;
          var index = distinctInsight.findIndex(function (distinctItem) {
            return _moment2.default.utc(distinctItem.purchaseDate, _moment2.default.ISO_8601).startOf('day').valueOf() === _moment2.default.utc(insightItem.purchaseDate, _moment2.default.ISO_8601).startOf('day').valueOf();
          });

          if (index === -1) {
            distinctInsight.push(insightItem);
          } else {
            distinctInsight[index].value += insightItem.value;
          }

          return insightItem;
        });
        var insightItems = _shared2.default.retrieveDaysInsight(distinctInsight);

        var insightResult = insightItems && insightItems.length > 0 ? {
          startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
          endDate: _moment2.default.utc(),
          totalSpend: _shared2.default.sumProps(insightItems, 'value'),
          totalDays: 7,
          insightData: insightItems
        } : {
          startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
          endDate: _moment2.default.utc(),
          totalSpend: 0,
          totalDays: 7,
          insightData: insightData
        };

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
        var product = result[6];

        return {
          status: true,
          message: 'Dashboard restore Successful',
          notificationCount: result[3],
          recentSearches: result[2].map(function (item) {
            var search = item.toJSON();
            return search.searchValue;
          }).slice(0, 5),
          upcomingServices: upcomingServices,
          insight: insightResult,
          forceUpdate: request.pre.forceUpdate,
          showDashboard: !!(result[4] && parseInt(result[4]) > 0) || !!(result[5] && parseInt(result[5]) > 0),
          hasProducts: !!(result[5] && parseInt(result[5]) > 0),
          product: product
        };
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return {
          status: false,
          message: 'Dashboard restore failed',
          err: err,
          forceUpdate: request.pre.forceUpdate,
          showDashboard: false
        };
      });
    }
  }, {
    key: 'prepareDashboardResult',
    value: function prepareDashboardResult(parameters) {
      var isNewUser = parameters.isNewUser,
          user = parameters.user,
          token = parameters.token,
          request = parameters.request;

      if (!isNewUser) {
        return Promise.all([this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: [5, 8, 11]
          },
          include: [{
            model: this.modals.bills,
            where: {
              status_type: 5
            },
            required: true
          }]
        }), this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: 11
          }
        })]).then(function (result) {
          var billCounts = parseInt(result[0]);
          var productCounts = parseInt(result[1]);
          return {
            status: true,
            message: !isNewUser ? 'Existing User' : 'New User',
            billCounts: billCounts,
            hasProducts: !!(productCounts && productCounts > 0),
            showDashboard: !!(billCounts && billCounts > 0) || !!(productCounts && productCounts > 0),
            isExistingUser: !isNewUser,
            authorization: token,
            userId: user.id || user.ID,
            forceUpdate: request.pre.forceUpdate
          };
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return {
            status: false,
            authorization: token,
            message: 'Unable to Login User',
            showDashboard: false,
            err: err,
            forceUpdate: request.pre.forceUpdate
          };
        });
      }

      if (user.email && !user.email_verified) {
        _notification2.default.sendMailOnDifferentSteps('Welcome to BinBill!', user.email, user, 1);
      }

      return {
        status: true,
        message: 'New User',
        authorization: token,
        billCounts: 0,
        showDashboard: false,
        isExistingUser: false,
        userId: user.id || user.ID,
        forceUpdate: request.pre.forceUpdate
      };
    }
  }, {
    key: 'filterUpcomingService',
    value: function filterUpcomingService(user) {
      return Promise.all([this.amcAdaptor.retrieveAMCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: _moment2.default.utc().startOf('days'),
          $lte: _moment2.default.utc().add(30, 'days').endOf('days')
        }
      }), this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: _moment2.default.utc().startOf('days'),
          $lte: _moment2.default.utc().add(30, 'days').endOf('days')
        }
      }), this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: _moment2.default.utc().startOf('days'),
          $lte: _moment2.default.utc().add(30, 'days').endOf('days')
        }
      }), this.pucAdaptor.retrievePUCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        expiry_date: {
          $gte: _moment2.default.utc().startOf('days'),
          $lte: _moment2.default.utc().add(30, 'days').endOf('days')
        }
      }), this.productAdaptor.retrieveUpcomingProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        service_schedule_id: {
          $not: null
        }
      }), this.productAdaptor.retrieveNotificationProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [6, 8]
      })]).then(function (result) {
        var amcs = result[0].map(function (item) {
          var amc = item;
          if (_moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).endOf('day');
            amc.dueDate = amc.expiryDate;
            amc.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            amc.productType = 4;
          }

          return amc;
        });
        amcs = amcs.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var insurances = result[1].map(function (item) {
          var insurance = item;
          if (_moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601).endOf('day');
            insurance.dueDate = insurance.expiryDate;
            insurance.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            insurance.productType = 3;
          }
          return insurance;
        });

        insurances = insurances.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var warranties = result[2].map(function (item) {
          var warranty = item;
          if (_moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601).endOf('day');
            warranty.dueDate = warranty.expiryDate;
            warranty.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            warranty.productType = 2;
          }
          return warranty;
        });

        warranties = warranties.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var pucProducts = result[3].map(function (item) {
          var puc = item;
          if (_moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).endOf('day');
            puc.dueDate = puc.expiryDate;
            puc.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            puc.productType = 5;
          }

          return puc;
        });

        pucProducts = pucProducts.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var productServiceSchedule = result[4].filter(function (item) {
          return item.schedule;
        }).map(function (item) {
          var scheduledProduct = item;
          var scheduledDate = scheduledProduct.schedule ? scheduledProduct.schedule.due_date : undefined;
          if (scheduledDate && _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).endOf('day');
            scheduledProduct.dueDate = dueDate_time;
            scheduledProduct.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            scheduledProduct.productType = 6;
          }

          return scheduledProduct;
        });

        productServiceSchedule = productServiceSchedule.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 7 && item.dueIn >= 0;
        });
        var metaData = result[5][0];
        var productList = result[5][1].map(function (productItem) {
          productItem.productMetaData = metaData.filter(function (item) {
            return item.productId === productItem.id;
          });

          return productItem;
        });

        productList = productList.map(function (item) {
          var productItem = item;
          productItem.productMetaData.forEach(function (metaItem) {
            var metaData = metaItem;
            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && metaData.value && (_moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid() || _moment2.default.utc(metaData.value, 'DD MMM YYYY').isValid())) {
              var dueDate_time = _moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(metaData.value, _moment2.default.ISO_8601) : _moment2.default.utc(metaData.value, 'DD MMM YYYY');
              productItem.dueDate = dueDate_time;
              productItem.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            }
            productItem.address = '';
            if (metaData.name.toLowerCase().includes('address')) {
              productItem.address = metaData.value;
            }
          });

          productItem.productType = 1;
          return productItem;
        });

        productList = productList.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        return [].concat(_toConsumableArray(productList), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs), _toConsumableArray(pucProducts), _toConsumableArray(productServiceSchedule));
      });
    }
  }, {
    key: 'prepareInsightData',
    value: function prepareInsightData(user) {
      return Promise.all([this.productAdaptor.retrieveProducts({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
        }
      }), this.amcAdaptor.retrieveAMCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
        }
      }), this.insuranceAdaptor.retrieveInsurances({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
        }
      }), this.repairAdaptor.retrieveRepairs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
        }
      }), this.warrantyAdaptor.retrieveWarranties({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
        }
      }), this.pucAdaptor.retrievePUCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
        }
      })]).then(function (results) {
        return [].concat(_toConsumableArray(results[0]), _toConsumableArray(results[1]), _toConsumableArray(results[2]), _toConsumableArray(results[3]), _toConsumableArray(results[4]), _toConsumableArray(results[5]));
      });
    }
  }, {
    key: 'retrieveRecentSearch',
    value: function retrieveRecentSearch(user) {
      return this.modals.recentSearches.findAll({
        where: {
          user_id: user.id || user.ID
        },
        order: [['searchDate', 'DESC']],
        attributes: ['searchValue']
      });
    }
  }]);

  return DashboardAdaptor;
}();

exports.default = DashboardAdaptor;