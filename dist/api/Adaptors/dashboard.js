/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
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
    this.date = new Date();
  }

  _createClass(DashboardAdaptor, [
    {
      key: 'retrieveDashboardResult',
      value: function retrieveDashboardResult(user, request) {
        return Promise.all([
          this.filterUpcomingService(user),
          this.prepareInsightData(user),
          this.retrieveRecentSearch(user),
          this.modals.mailBox.count({where: {user_id: user.id, status_id: 4}}),
          this.modals.products.count({
            where: {
              user_id: user.id,
              status_type: [5, 8],
              main_category_id: {
                $notIn: [9, 10],
              },
            },
            include: [
              {
                model: this.modals.bills,
                where: {
                  status_type: 5,
                },
                required: true,
              }],
          }),
          this.modals.products.count({
            where: {
              user_id: user.id,
              status_type: [5, 8, 11],
              main_category_id: [2, 3],
            },
          }),
          this.productAdaptor.retrieveUsersLastProduct({
            user_id: user.id,
            status_type: [5, 8, 11],
          })]).then(function(result) {
          // console.log(require('util').inspect(result[0], false, null));
          var upcomingServices = result[0].map(function(elem) {
            if (elem.productType === 1) {
              console.log('found 1');
              console.log(elem);
              var dueAmountArr = elem.productMetaData.filter(function(e) {
                return e.name.toLowerCase() === 'due amount';
              });

              if (dueAmountArr.length > 0) {
                elem.value = dueAmountArr[0].value;
              }
            }

            return elem;
          });

          var distinctInsight = [];
          console.log({
            insightData: result[1],
          });
          var insightData = result[1].map(function(item) {
            var insightItem = item;
            var index = distinctInsight.findIndex(function(distinctItem) {
              return (0, _moment2.default)(distinctItem.purchaseDate).
                  startOf('day').
                  valueOf() === (0, _moment2.default)(insightItem.purchaseDate).
                  startOf('day').
                  valueOf();
            });

            if (index === -1) {
              distinctInsight.push(insightItem);
            } else {
              distinctInsight[index].value += insightItem.value;
            }

            return insightItem;
          });
          var insightItems = _shared2.default.retrieveDaysInsight(
              distinctInsight);

          var insightResult = insightItems && insightItems.length > 0 ? {
            startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            endDate: _moment2.default.utc(),
            totalSpend: _shared2.default.sumProps(insightItems, 'value'),
            totalDays: 7,
            insightData: insightItems,
          } : {
            startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            endDate: _moment2.default.utc(),
            totalSpend: 0,
            totalDays: 7,
            insightData: insightData,
          };

          upcomingServices.sort(function(a, b) {
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

            if (_moment2.default.utc(aDate, 'YYYY-MM-DD').
                    isBefore(_moment2.default.utc(bDate, 'YYYY-MM-DD'))) {
              return -1;
            }

            return 1;
          });
          var product = result[6];

          return {
            status: true,
            message: 'Dashboard restore Successful',
            notificationCount: result[3],
            recentSearches: result[2].map(function(item) {
              var search = item.toJSON();
              return search.searchValue;
            }).slice(0, 5),
            upcomingServices: upcomingServices,
            insight: insightResult,
            forceUpdate: request.pre.forceUpdate,
          showDashboard: !!(result[4] && result[4] > 0),
          hasProducts: !!(result[5] && result[5] > 0),
            product: !!(result[4] && result[4] > 0) ? product : {},
          };
        }).catch(function(err) {
          console.log(err);
          return {
            status: false,
            message: 'Dashboard restore failed',
            err: err,
            forceUpdate: request.pre.forceUpdate,
            showDashboard: false,
          };
        });
      }
    }, {
      key: 'prepareDashboardResult',
      value: function prepareDashboardResult(isNewUser, user, token, request) {
        if (!isNewUser) {
          return Promise.all([
            this.modals.products.count({
              where: {
                user_id: user.id,
                status_type: [5, 8, 11],
                main_category_id: {
                  $notIn: [9, 10],
                },
              },
              include: [
                {
                  model: this.modals.bills,
                  where: {
                    status_type: 5,
                  },
                  required: true,
                }],
            }), this.modals.products.count({
              where: {
                user_id: user.id,
                status_type: [5, 8, 11],
                main_category_id: [2, 3],
              },
            })]).then(function(result) {
          var billCounts = parseInt(result[0]);
          var productCounts = parseInt(result[1]);
            if (billCounts) {
              return {
                status: true,
                message: 'User Exist',
                billCounts: billCounts,
              hasProducts: !!(productCounts && productCounts > 0),
                showDashboard: !!(billCounts && billCounts > 0),
                isExistingUser: !isNewUser,
                authorization: token,
                userId: user.id,
                forceUpdate: request.pre.forceUpdate,
              };
            }

            return {
              status: true,
              message: 'Existing User',
              authorization: token,
            hasProducts: !!(productCounts && productCounts > 0),
              billCounts: 0,
              showDashboard: false,
              isExistingUser: !isNewUser,
              userId: user.id,
              forceUpdate: request.pre.forceUpdate,
            };
          }).catch(function(err) {
            console.log({API_Logs: err});
            return {
              status: false,
              authorization: token,
              message: 'Unable to Login User',
              showDashboard: false,
              err: err,
              forceUpdate: request.pre.forceUpdate,
            };
          });
        }

        _notification2.default.sendMailOnDifferentSteps('Welcome to BinBill!',
            user.email, user, 1);
        return {
          status: true,
          message: 'New User',
          authorization: token,
          billCounts: 0,
          showDashboard: false,
          isExistingUser: false,
          userId: user.id,
          forceUpdate: request.pre.forceUpdate,
        };
      }
    }, {
      key: 'filterUpcomingService',
      value: function filterUpcomingService(user) {
        return Promise.all([
          this.productAdaptor.retrieveProducts({
            user_id: user.id,
            status_type: 5,
            main_category_id: [6, 8],
          }), this.amcAdaptor.retrieveAMCs({
            user_id: user.id,
            status_type: 5,
          }), this.insuranceAdaptor.retrieveInsurances({
            user_id: user.id,
            status_type: 5,
          }), this.warrantyAdaptor.retrieveWarranties({
            user_id: user.id,
            status_type: 5,
          })]).then(function(result) {
          var products = result[0].map(function(item) {
            var product = item;

            product.productMetaData.map(function(metaItem) {
              var metaData = metaItem;
              if (metaData.name.toLowerCase().includes('due') &&
                  metaData.name.toLowerCase().includes('date') &&
                  metaData.value &&
                  (0, _moment2.default)(metaData.value).isValid()) {
                var dueDateTime = (0, _moment2.default)(metaData.value);
                product.dueDate = metaData.value;
                product.dueIn = dueDateTime.diff(_moment2.default.utc(),
                    'days');
              }

              if (metaData.name.toLowerCase().includes('address')) {
                product.address = metaData.value;
              }

              return metaData;
            });

          product.productType = 1;
            return product;
          });

          products = products.filter(function(item) {
            return item.dueIn !== undefined && item.dueIn !== null &&
                item.dueIn <= 30 && item.dueIn >= 0;
          });

          var amcs = result[1].map(function(item) {
            var amc = item;
            if ((0, _moment2.default)(amc.expiryDate).isValid()) {
              var dueDateTime = (0, _moment2.default)(amc.expiryDate);
              amc.dueDate = amc.expiryDate;
              amc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
              amc.productType = 4;
            }

            return amc;
          });
          amcs = amcs.filter(function(item) {
            return item.dueIn !== undefined && item.dueIn !== null &&
                item.dueIn <= 30 && item.dueIn >= 0;
          });

          var insurances = result[2].map(function(item) {
            var insurance = item;
            if ((0, _moment2.default)(insurance.expiryDate).isValid()) {
              var dueDateTime = (0, _moment2.default)(insurance.expiryDate);
              insurance.dueDate = insurance.expiryDate;
              insurance.dueIn = dueDateTime.diff(_moment2.default.utc(),
                  'days');
              insurance.productType = 3;
            }
            return insurance;
          });

          insurances = insurances.filter(function(item) {
            return item.dueIn !== undefined && item.dueIn !== null &&
                item.dueIn <= 30 && item.dueIn >= 0;
          });

          var warranties = result[3].map(function(item) {
            var warranty = item;
            if ((0, _moment2.default)(warranty.expiryDate).isValid()) {
              var dueDateTime = (0, _moment2.default)(warranty.expiryDate);
              warranty.dueDate = warranty.expiryDate;
              warranty.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
              warranty.productType = 2;
            }
            return warranty;
          });

          warranties = warranties.filter(function(item) {
            return item.dueIn !== undefined && item.dueIn !== null &&
                item.dueIn <= 30 && item.dueIn >= 0;
          });

          return [].concat(_toConsumableArray(products),
              _toConsumableArray(warranties), _toConsumableArray(insurances),
              _toConsumableArray(amcs));
        });
      }
    }, {
      key: 'prepareInsightData',
      value: function prepareInsightData(user) {
        return Promise.all([
          this.productAdaptor.retrieveProducts({
            status_type: [5, 11],
            user_id: user.id,
            document_date: {
              $lte: _moment2.default.utc(),
              $gte: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            },
          }), this.amcAdaptor.retrieveAMCs({
            status_type: [5, 11],
            user_id: user.id,
            document_date: {
              $lte: _moment2.default.utc(),
              $gte: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            },
          }), this.insuranceAdaptor.retrieveInsurances({
            status_type: [5, 11],
            user_id: user.id,
            document_date: {
              $lte: _moment2.default.utc(),
              $gte: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            },
          }), this.repairAdaptor.retrieveRepairs({
            status_type: [5, 11],
            user_id: user.id,
            document_date: {
              $lte: _moment2.default.utc(),
              $gte: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            },
          }), this.warrantyAdaptor.retrieveWarranties({
            status_type: [5, 11],
            user_id: user.id,
            document_date: {
              $lte: _moment2.default.utc(),
              $gte: _moment2.default.utc().subtract(6, 'd').startOf('d'),
            },
          })]).then(function(results) {
          return [].concat(_toConsumableArray(results[0]),
              _toConsumableArray(results[1]), _toConsumableArray(results[2]),
              _toConsumableArray(results[3]), _toConsumableArray(results[4]));
        });
      },
    }, {
      key: 'retrieveRecentSearch',
      value: function retrieveRecentSearch(user) {
        return this.modals.recentSearches.findAll({
          where: {
            user_id: user.id,
          },
          order: [['searchDate', 'DESC']],
          attributes: ['searchValue'],
        });
      },
    }]);

  return DashboardAdaptor;
}();

exports.default = DashboardAdaptor;