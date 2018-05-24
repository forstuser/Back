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

var _calendarServices = require('./calendarServices');

var _calendarServices2 = _interopRequireDefault(_calendarServices);

var _pucs = require('./pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _notification3 = require('../Adaptors/notification');

var _notification4 = _interopRequireDefault(_notification3);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

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
    this.calendarServiceAdaptor = new _calendarServices2.default(modals);
    this.notificationAdaptor = new _notification4.default(modals);
    this.date = _moment2.default.utc();
  }

  _createClass(DashboardAdaptor, [{
    key: 'retrieveDashboardResult',
    value: function retrieveDashboardResult(user, request) {
      var _this = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this.filterUpcomingService(user, request), _this.prepareInsightData(user, request), _this.retrieveRecentSearch(user), _this.modals.mailBox.count({ where: { user_id: user.id || user.ID, status_id: 4 } }), _this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: [5, 11]
          }
        }), _this.productAdaptor.retrieveUsersLastProduct({
          user_id: user.id || user.ID,
          status_type: [5, 11]
        }, request.language), _this.modals.user_calendar_item.count({
          where: {
            user_id: user.id || user.ID
          }
        }), _this.modals.user_calendar_item.findOne({
          where: {
            user_id: user.id || user.ID
          },
          order: [['updated_at', 'desc']]
        }), _this.modals.service_calculation.findOne({
          where: {
            updated_by: user.id || user.ID
          },
          order: [['updated_at', 'desc']]
        }), _this.calendarServiceAdaptor.retrieveCalendarItemList({ user_id: user.id || user.ID }, request.language, 4), _this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            main_category_id: [2, 3],
            status_type: [5, 11]
          }
        }), _this.modals.knowItems.count({
          where: {
            id: { $gt: request.query.lastfact || 0 }
          }
        }), _this.modals.todoUserMap.count({
          where: {
            user_id: user.id || user.ID
          }
        }), _this.modals.mealUserMap.count({
          where: {
            user_id: user.id || user.ID
          }
        }), _this.modals.wearables.count({
          where: {
            created_by: user.id || user.ID
          }
        }), _this.modals.know_user_likes.count({
          where: {
            user_id: user.id || user.ID
          }
        })]);
      }).spread(function (upcomingServices, insightData, recentSearches, notificationCount, productCount, product, calendarItemCount, latestCalendarItem, latestCalendarCalc, recent_calendar_item, service_center_products, know_item_count, todoCounts, mealCounts, wearableCounts, knowItemCounts) {
        latestCalendarItem = latestCalendarItem ? latestCalendarItem.toJSON() : {};
        latestCalendarCalc = latestCalendarCalc ? latestCalendarCalc.toJSON() : {};
        var calendar_item_updated_at = latestCalendarItem && (0, _moment2.default)(latestCalendarItem.updated_at, _moment2.default.ISO_8601).diff((0, _moment2.default)(latestCalendarCalc.updated_at, _moment2.default.ISO_8601), 'days') < 0 ? latestCalendarCalc.updated_at : latestCalendarItem ? latestCalendarItem.updated_at : (0, _moment2.default)();
        return {
          status: true,
          message: 'Dashboard restore Successful',
          notificationCount: notificationCount,
          recentSearches: recentSearches.map(function (item) {
            var search = item.toJSON();
            return search.searchValue;
          }).slice(0, 5),
          upcomingServices: _this.evaluateUpcomingServices(upcomingServices),
          insight: _this.evaluateDashboardInsight(insightData),
          forceUpdate: request.pre.forceUpdate,
          showDashboard: !!(productCount && parseInt(productCount) > 0) || !!(calendarItemCount && parseInt(calendarItemCount) > 0),
          showEazyDay: !!(todoCounts && todoCounts > 0) || !!(mealCounts && mealCounts > 0) || !!(wearableCounts && wearableCounts > 0),
          showKnowItems: !!(knowItemCounts && knowItemCounts > 0),
          total_calendar_item: calendarItemCount || 0,
          calendar_item_updated_at: calendar_item_updated_at,
          recent_calendar_item: recent_calendar_item,
          recent_products: product.slice(0, 4),
          product: product[0],
          service_center_products: service_center_products,
          know_item_count: know_item_count
        };
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

        _this.modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err: err
          })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });
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
    key: 'evaluateUpcomingServices',
    value: function evaluateUpcomingServices(upcomingServices) {
      upcomingServices = upcomingServices.map(function (elem) {
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
      return upcomingServices;
    }
  }, {
    key: 'evaluateDashboardInsight',
    value: function evaluateDashboardInsight(insightData) {
      var distinctInsight = [];
      insightData = insightData.map(function (item) {
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

      return distinctInsight && distinctInsight.length > 0 ? {
        startDate: _moment2.default.utc().startOf('M'),
        endDate: _moment2.default.utc(),
        totalSpend: _shared2.default.sumProps(distinctInsight, 'value'),
        totalDays: _moment2.default.utc().endOf('d').diff(_moment2.default.utc().startOf('M'), 'days'),
        insightData: distinctInsight
      } : {
        startDate: _moment2.default.utc().startOf('M'),
        endDate: _moment2.default.utc(),
        totalSpend: 0,
        totalDays: _moment2.default.utc().endOf('d').diff(_moment2.default.utc().startOf('M'), 'days'),
        insightData: insightData
      };
    }
  }, {
    key: 'prepareDashboardResult',
    value: function prepareDashboardResult(parameters) {
      var _this2 = this;

      var isNewUser = parameters.isNewUser,
          user = parameters.user,
          token = parameters.token,
          request = parameters.request;

      console.log(isNewUser);
      if (!isNewUser) {
        console.log('We are here', isNewUser);
        return _bluebird2.default.all([this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: [5, 11]
          }
        }), this.modals.user_calendar_item.count({
          where: {
            user_id: user.id || user.ID
          }
        }), this.modals.todoUserMap.count({
          where: {
            user_id: user.id || user.ID
          }
        }), this.modals.mealUserMap.count({
          where: {
            user_id: user.id || user.ID
          }
        }), this.modals.wearables.count({
          where: {
            created_by: user.id || user.ID
          }
        }), this.modals.know_user_likes.count({
          where: {
            user_id: user.id || user.ID
          }
        })]).spread(function (productCounts, calendarItemCounts, todoCounts, mealCounts, wearableCounts, knowItemCounts) {
          calendarItemCounts = parseInt(calendarItemCounts);
          productCounts = parseInt(productCounts);
          return {
            status: true,
            message: !isNewUser ? 'Existing User' : 'New User',
            billCounts: 0,
            showDashboard: !!(productCounts && productCounts > 0) || !!(calendarItemCounts && calendarItemCounts > 0),
            showEazyDay: !!(todoCounts && todoCounts > 0) || !!(mealCounts && mealCounts > 0) || !!(wearableCounts && wearableCounts > 0),
            showKnowItems: !!(knowItemCounts && knowItemCounts > 0),
            isExistingUser: !isNewUser,
            authorization: token,
            userId: user.id || user.ID,
            forceUpdate: request.pre.forceUpdate
          };
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          _this2.modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
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
        _notification2.default.sendMailOnDifferentSteps('Welcome to BinBill', user.email, user, 1);

        this.notificationAdaptor.notifyUser(user.id || user.ID, {
          title: 'Welcome to BinBill!',
          description: 'Hello User. Greetings from Rohit BinBill CEO. I welcome you to your eHome. We promise to constantly evolve and make managing your eHome ever efficient and smarter. As it is a new home, you may take some time to get accustomed to it. Your Home Manager and I would always welcome your suggestions to improve your eHome. Please reach me at - rohit@binbill.com or eHome@binbill.com'
        }, reply);
      }
      return {
        status: true,
        message: 'New User',
        authorization: token,
        billCounts: 0,
        showDashboard: false,
        showEazyDay: false,
        showKnowItems: false,
        isExistingUser: false,
        userId: user.id || user.ID,
        forceUpdate: request.pre.forceUpdate
      };
    }
  }, {
    key: 'filterUpcomingService',
    value: function filterUpcomingService(user, request) {
      var _this3 = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this3.amcAdaptor.retrieveAMCs({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this3.insuranceAdaptor.retrieveInsurances({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this3.warrantyAdaptor.retrieveWarranties({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          warranty_type: [1, 2],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this3.pucAdaptor.retrievePUCs({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [3],
          expiry_date: {
            $gte: _moment2.default.utc().startOf('days'),
            $lte: _moment2.default.utc().add(30, 'days').endOf('days')
          }
        }), _this3.productAdaptor.retrieveUpcomingProducts({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [3],
          service_schedule_id: {
            $not: null
          }
        }, request.language), _this3.productAdaptor.retrieveNotificationProducts({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          main_category_id: [6, 8]
        }), _this3.repairAdaptor.retrieveRepairs({
          user_id: user.id || user.ID,
          status_type: [5, 11],
          warranty_upto: {
            $ne: null
          }
        })]);
      }).spread(function (amcList, insuranceList, warrantyList, pucList, productServiceScheduleList, productDetails, repairList) {
        var amcs = amcList.map(function (item) {
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

        var insurances = insuranceList.map(function (item) {
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

        var warranties = warrantyList.map(function (item) {
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

        var repairWarranties = repairList.map(function (item) {
          var warranty = item;
          if (_moment2.default.utc(warranty.warranty_upto, _moment2.default.ISO_8601).isValid()) {
            var dueDate_time = _moment2.default.utc(warranty.warranty_upto, _moment2.default.ISO_8601).endOf('day');
            warranty.dueDate = warranty.warranty_upto;
            warranty.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
            warranty.productType = 7;
          }
          return warranty;
        });

        repairWarranties = repairWarranties.filter(function (item) {
          return item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
        });

        var pucProducts = pucList.map(function (item) {
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

        var productServiceSchedule = productServiceScheduleList.filter(function (item) {
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
        var metaData = productDetails[0];
        var productList = productDetails[1].map(function (productItem) {
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

        return [].concat(_toConsumableArray(productList), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs), _toConsumableArray(pucProducts), _toConsumableArray(productServiceSchedule), _toConsumableArray(repairWarranties));
      });
    }
  }, {
    key: 'prepareInsightData',
    value: function prepareInsightData(user, request) {
      return _bluebird2.default.all([this.productAdaptor.retrieveProducts({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().startOf('M')
        }
      }, request.language), this.amcAdaptor.retrieveAMCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().startOf('M')
        }
      }), this.insuranceAdaptor.retrieveInsurances({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().startOf('M')
        }
      }), this.repairAdaptor.retrieveRepairs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().startOf('M')
        }
      }), this.warrantyAdaptor.retrieveWarranties({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().startOf('M')
        }
      }), this.pucAdaptor.retrievePUCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: _moment2.default.utc(),
          $gte: _moment2.default.utc().startOf('M')
        }
      })]).then(function (results) {
        return _bluebird2.default.all([].concat(_toConsumableArray(results[0]), _toConsumableArray(results[1]), _toConsumableArray(results[2]), _toConsumableArray(results[3]), _toConsumableArray(results[4]), _toConsumableArray(results[5])));
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