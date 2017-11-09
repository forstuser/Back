/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function weekAndDay(d) {
  var days = [1, 2, 3, 4, 5, 6, 7];
  var prefixes = [1, 2, 3, 4, 5];

  return {monthWeek: prefixes[Math.round(d.date() / 7)], day: days[d.day()]};
}

var dateFormatString = 'yyyy-mm-dd';
var monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var date = new Date();
var monthStartDay = new Date(date.getFullYear(), date.getMonth(), 1);
var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
var yearStartDay = new Date(date.getFullYear(), 0, 1);
var yearLastDay = new Date(date.getFullYear() + 1, 0, 0);

function customSortCategories(categoryData) {
  var OtherCategory = categoryData.find(function(elem) {
    return elem.id === 9;
  });

  var categoryDataWithoutOthers = categoryData.filter(function(elem) {
    return elem.id !== 9;
  });

  var newCategoryData = [];

  var pushed = false;

  categoryDataWithoutOthers.forEach(function(elem) {
    if (OtherCategory && elem &&
        parseFloat(OtherCategory.totalAmount) > parseFloat(elem.totalAmount) &&
        !pushed) {
      newCategoryData.push(OtherCategory);
      pushed = true;
    }
    newCategoryData.push(elem);
  });

  if (!pushed && OtherCategory) {
    newCategoryData.push(OtherCategory);
  }

  return newCategoryData;
}

var InsightAdaptor = function () {
  function InsightAdaptor(modals) {
    _classCallCheck(this, InsightAdaptor);

    this.modals = modals;
    this.categoryAdaptor = new _category2.default(modals);
    this.productAdaptor = new _product2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
  }

  _createClass(InsightAdaptor, [
    {
      key: 'prepareInsightData',
      value: function prepareInsightData(user, request) {
        var minDate = request.query.mindate;
        var maxDate = request.query.maxdate;
        return this.prepareCategoryData(user, {}).then(function(result) {
          var categoryData = !(minDate || maxDate) ? {
            weeklyData: result.map(function(item) {
              var expenses = item.expenses.filter(function(item) {
                return item.purchaseDate >= (0, _moment2.default)(
                    _moment2.default.utc().subtract(6, 'd')).
                        utc().
                        startOf('d') && item.purchaseDate <=
                    _moment2.default.utc().endOf('d');
              });
              var totalAmount = _shared2.default.sumProps(expenses, 'value');
              var totalTax = _shared2.default.sumProps(expenses, 'taxes');
              console.log({
                totalAmount: totalAmount, totalTax: totalTax,
              });
              return {
                cName: item.categoryName,
                cURL: item.categoryInsightUrl,
                cImageURl: item.categoryImageUrl,
                totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                totalTax: parseFloat(totalTax || 0).toFixed(2),
              };
            }),
            monthlyData: result.map(function(item) {
              var expenses = item.expenses.filter(function(item) {
                return item.purchaseDate >=
                    (0, _moment2.default)().utc().startOf('month') &&
                    item.purchaseDate <= _moment2.default.utc().endOf('month');
              });
              var totalAmount = _shared2.default.sumProps(expenses, 'value');
              var totalTax = _shared2.default.sumProps(expenses, 'taxes');
              return {
                cName: item.categoryName,
                cURL: item.categoryInsightUrl,
                cImageURl: item.categoryImageUrl,
                totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                totalTax: parseFloat(totalTax || 0).toFixed(2),
              };
            }),
            yearlyData: result.map(function(item) {
              var expenses = item.expenses.filter(function(item) {
                return item.purchaseDate >=
                    (0, _moment2.default)().utc().startOf('year') &&
                    item.purchaseDate <= _moment2.default.utc().endOf('year');
              });
              var totalAmount = _shared2.default.sumProps(expenses, 'value');
              var totalTax = _shared2.default.sumProps(expenses, 'taxes');
              return {
                cName: item.categoryName,
                cURL: item.categoryInsightUrl,
                cImageURl: item.categoryImageUrl,
                totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                totalTax: parseFloat(totalTax || 0).toFixed(2),
              };
            }),
          } : {
            customDateData: result.map(function(item) {
              var expenses = item.expenses.filter(function(item) {
                return item.purchaseDate >=
                    (0, _moment2.default)(minDate).utc().startOf('d') &&
                    item.purchaseDate <=
                    (0, _moment2.default)(maxDate).utc().endOf('d');
              });
              var totalAmount = _shared2.default.sumProps(expenses, 'value');
              var totalTax = _shared2.default.sumProps(expenses, 'taxes');
              return {
                cName: item.name,
                cURL: item.categoryInsightUrl,
                cImageURl: item.categoryImageUrl,
                totalAmount: (totalAmount || 0).toFixed(2),
                totalTax: (totalTax || 0).toFixed(2),
              };
            }),
          };

          if (minDate || maxDate) {
            categoryData.customDateData = _lodash2.default.chain(
                categoryData.customDateData).
                map(function(elem) {
                  elem.totalAmount = parseFloat(elem.totalAmount);
                  return elem;
                }).
                orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
                map(function(elem) {
                  elem.totalAmount = elem.totalAmount.toString();
                  return elem;
                }).
                value();

            var totalAmounts = _shared2.default.sumProps(
                categoryData.customDateData, 'totalAmount');
            var totalTaxes = _shared2.default.sumProps(
                categoryData.customDateData, 'totalTax');
            return {
              status: true,
              message: 'Insight restore successful',
              categoryData: categoryData,
              totalSpend: (totalAmounts || 0).toFixed(2),
              totalTaxes: (totalTaxes || 0).toFixed(2),
              startDate: minDate,
              endDate: maxDate,
              forceUpdate: request.pre.forceUpdate,
            };
          }
          console.log(categoryData);
          categoryData.weeklyData = _lodash2.default.chain(
              categoryData.weeklyData).
              map(function(elem) {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
              }).
              orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
              map(function(elem) {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
              }).
              value();

          categoryData.monthlyData = _lodash2.default.chain(
              categoryData.monthlyData).
              map(function(elem) {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
              }).
              orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
              map(function(elem) {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
              }).
              value();

          categoryData.yearlyData = _lodash2.default.chain(
              categoryData.yearlyData).
              map(function(elem) {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
              }).
              orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
              map(function(elem) {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
              }).
              value();

          categoryData.weeklyData = customSortCategories(
              categoryData.weeklyData, 'totalAmount');
          categoryData.monthlyData = customSortCategories(
              categoryData.monthlyData, 'totalAmount');
          categoryData.yearlyData = customSortCategories(
              categoryData.yearlyData, 'totalAmount');

          console.log({
            categoryData: categoryData,
          });
          var totalWeeklyAmounts = _shared2.default.sumProps(
              categoryData.weeklyData, 'totalAmount');
          var totalWeeklyTaxes = _shared2.default.sumProps(
              categoryData.weeklyData, 'totalTax');
          var totalYearlyAmounts = _shared2.default.sumProps(
              categoryData.yearlyData, 'totalAmount');
          var totalYearlyTaxes = _shared2.default.sumProps(
              categoryData.yearlyData, 'totalTax');
          var totalMonthlyAmounts = _shared2.default.sumProps(
              categoryData.monthlyData, 'totalAmount');
          var totalMonthlyTaxes = _shared2.default.sumProps(
              categoryData.monthlyData, 'totalTax');
          return {
            status: true,
            message: 'Insight restore successful',
            categoryData: categoryData,
            weekStartDate: _shared2.default.formatDate(
                _moment2.default.utc().subtract(6, 'd').startOf('d'),
                dateFormatString),
            monthStartDate: _shared2.default.formatDate(monthStartDay,
                dateFormatString),
            weekEndDate: _shared2.default.formatDate(_moment2.default.utc(),
                dateFormatString),
            monthLastDate: _shared2.default.formatDate(monthLastDay,
                dateFormatString),
            yearStartDate: _shared2.default.formatDate(yearStartDay,
                dateFormatString),
            yearEndDate: _shared2.default.formatDate(yearLastDay,
                dateFormatString),
            totalYearlySpend: parseFloat(totalYearlyAmounts || 0).toFixed(2),
            totalWeeklySpend: parseFloat(totalWeeklyAmounts || 0).toFixed(2),
            totalWeeklyTaxes: parseFloat(totalWeeklyTaxes || 0).toFixed(2),
            totalYearlyTaxes: parseFloat(totalYearlyTaxes || 0).toFixed(2),
            totalMonthlySpend: parseFloat(totalMonthlyAmounts || 0).toFixed(2),
            totalMonthlyTaxes: parseFloat(totalMonthlyTaxes || 0).toFixed(2),
            forceUpdate: request.pre.forceUpdate,
          };
        }).catch(function(err) {
          console.log({API_Logs: err});
          return {
            status: false,
            message: 'Insight restore failed',
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }, {
      key: 'prepareCategoryData',
      value: function prepareCategoryData(user, options) {
        var categoryOption = {
          category_level: 1,
          status_type: 1,
        };

        var productOptions = {
          status_type: 5,
          user_id: user.id,
        };

        if (options.category_id) {
          categoryOption.category_id = options.category_id;
          productOptions.main_category_id = options.category_id;
        }
        return Promise.all([
          this.categoryAdaptor.retrieveCategories(categoryOption),
          this.productAdaptor.retrieveProducts(productOptions),
          this.amcAdaptor.retrieveAmcs(productOptions),
          this.insuranceAdaptor.retrieveInsurances(productOptions),
          this.repairAdaptor.retrieveRepairs(productOptions),
          this.warrantyAdaptor.retrieveWarranties(productOptions)]).
            then(function(results) {
              return results[0].map(function(categoryItem) {
                var category = categoryItem;
                var products = _lodash2.default.chain(results[1]).
                    map(function(productItem) {
                      var product = productItem.toJSON();
                      product.dataIndex = 1;
                      return product;
                    }).
                    filter(function(productItem) {
                      return productItem.masterCategoryId === category.id;
                    });
                var amcs = _lodash2.default.chain(results[2]).
                    map(function(amcItem) {
                      var amc = amcItem.toJSON();
                      amc.dataIndex = 2;
                      return amc;
                    }).
                    filter(function(amcItem) {
                      return amcItem.masterCategoryId === category.id;
                    });
                var insurances = _lodash2.default.chain(results[3]).
                    map(function(insuranceItem) {
                      var insurance = insuranceItem.toJSON();
                      insurance.dataIndex = 3;
                      return insurance;
                    }).
                    filter(function(insuranceItem) {
                      return insuranceItem.masterCategoryId === category.id;
                    });
                var repairs = _lodash2.default.chain(results[4]).
                    map(function(repairItem) {
                      var repair = repairItem.toJSON();
                      repair.dataIndex = 4;
                      return repair;
                    }).
                    filter(function(repairItem) {
                      return repairItem.masterCategoryId === category.id;
                    });
                var warranties = _lodash2.default.chain(results[5]).
                    map(function(warrantyItem) {
                      var warranty = warrantyItem.toJSON();
                      warranty.dataIndex = 5;
                      return warranty;
                    }).
                    filter(function(warrantyItem) {
                      return warrantyItem.masterCategoryId === category.id;
                    });
                category.products = products;
                category.amcs = amcs;
                category.insurances = insurances;
                category.repairs = repairs;
                category.warranties = warranties;
                category.expenses = [].concat(_toConsumableArray(products),
                    _toConsumableArray(amcs), _toConsumableArray(insurances),
                    _toConsumableArray(repairs),
                    _toConsumableArray(warranties)) || [];

                return category;
              })[0];
            });
      }
    }, {
      key: 'prepareCategoryInsight',
      value: function prepareCategoryInsight(user, request) {
        var masterCategoryId = request.params.id;
        return this.prepareCategoryData(user, {category_id: masterCategoryId}).
            then(function(result) {
              var distinctInsightWeekly = [];
              var distinctInsightMonthly = [];
              var distinctInsight = [];
              console.log(result);
              result.expenses.map(function(item) {
                var expense = item.orderBy(['purchaseDate'], ['asc']);
                var index = distinctInsight.findIndex(function(distinctItem) {
                  return (0, _moment2.default)(distinctItem.date).valueOf() ===
                      (0, _moment2.default)(expense.purchaseDate).valueOf();
                });
                if (index === -1) {
                  distinctInsight.push({
                    value: expense.value,
                    month: monthArray[(0, _moment2.default)(
                        expense.purchaseDate).month()],
                    monthId: (0, _moment2.default)(expense.purchaseDate).
                        month() + 1,
                    purchaseDate: (0, _moment2.default)(expense.purchaseDate),
                    week: weekAndDay(
                        (0, _moment2.default)(expense.purchaseDate)).monthWeek,
                    day: weekAndDay(
                        (0, _moment2.default)(expense.purchaseDate)).day,
                    tax: expense.taxes,
                  });
                } else {
                  distinctInsight[index].value += expense.value;
                  distinctInsight[index].tax += expense.taxes;
                }

                return expense;
              });

              var distinctInsightTemp = distinctInsight.map(function(item) {
                var dayItem = {
                  value: item.value,
                  month: item.month,
                  monthId: item.monthId,
                  purchaseDate: item.purchaseDate,
                  week: item.week,
                  day: item.day,
                  totalCost: item.totalCost,
                  totalTax: item.totalTax,
                  tax: item.tax,
                };

                var monthItem = {
                  value: item.value,
                  month: item.month,
                  monthId: item.monthId,
                  purchaseDate: item.purchaseDate,
                  week: item.week,
                  day: item.day,
                  totalCost: item.totalCost,
                  totalTax: item.totalTax,
                  tax: item.tax,
                };
                var monthIndex = distinctInsightMonthly.findIndex(
                    function(distinctItem) {
                      return distinctItem.month === item.month;
                    });
                var weekIndex = distinctInsightWeekly.findIndex(
                    function(distinctItem) {
                      return distinctItem.week === item.week;
                    });
                if (weekIndex !== -1 && monthIndex !== -1) {
                  var currentWeekInsight = distinctInsightWeekly[weekIndex];
                  currentWeekInsight.value += item.value;
                  currentWeekInsight.totalCost += item.totalCost;
                  currentWeekInsight.totalTax += item.totalTax;
                  currentWeekInsight.tax += item.tax;
                } else {
                  distinctInsightWeekly.push(item);
                }

                if (monthIndex === -1) {
                  distinctInsightMonthly.push(monthItem);
                } else {
                  var currentMonthInsight = distinctInsightMonthly[monthIndex];
                  currentMonthInsight.value += monthItem.value;
                  currentMonthInsight.totalCost += monthItem.totalCost;
                  currentMonthInsight.totalTax += monthItem.totalTax;
                  currentMonthInsight.tax += monthItem.tax;
                }

                return dayItem;
              });

              var productList = _lodash2.default.chain(result.expenses).
                  orderBy(['purchaseDate'], ['asc']);
              productList.sort(function(a, b) {
                return (0, _moment2.default)(b.purchaseDate) -
                    (0, _moment2.default)(a.purchaseDate);
              });
              var productListWeekly = productList.filter(function(item) {
                return (0, _moment2.default)(item.purchaseDate).valueOf() >=
                    _moment2.default.utc().startOf('month').valueOf() &&
                    (0, _moment2.default)(item.purchaseDate).valueOf() <=
                    _moment2.default.utc().valueOf();
              }).slice(0, 10);
              var productListMonthly = productList.filter(function(item) {
                return (0, _moment2.default)(item.purchaseDate).valueOf() >=
                    (0, _moment2.default)(
                        _moment2.default.utc().startOf('year').valueOf()) &&
                    (0, _moment2.default)(item.purchaseDate).valueOf() <=
                    (0, _moment2.default)(_moment2.default.utc()).valueOf();
              }).slice(0, 10);
              distinctInsightMonthly.sort(function(a, b) {
                return (0, _moment2.default)(b.purchaseDate) -
                    (0, _moment2.default)(a.purchaseDate);
              });
              distinctInsightWeekly.sort(function(a, b) {
                return (0, _moment2.default)(b.purchaseDate) -
                    (0, _moment2.default)(a.purchaseDate);
              });

              var insightData = _shared2.default.retrieveDaysInsight(
                  distinctInsightTemp.filter(function(item) {
                    return (0, _moment2.default)(item.purchaseDate).valueOf() >=
                        _moment2.default.utc().
                            subtract(6, 'd').
                            startOf('d').
                            valueOf() &&
                        (0, _moment2.default)(item.purchaseDate).valueOf() <=
                        _moment2.default.utc().valueOf();
                  }));
              insightData.sort(function(a, b) {
                return (0, _moment2.default)(a.purchaseDate) -
                    (0, _moment2.default)(b.purchaseDate);
              });

              var insightWeekly = distinctInsightWeekly.filter(function(item) {
                return (0, _moment2.default)(item.purchaseDate).valueOf() >=
                    _moment2.default.utc().startOf('month').valueOf() &&
                    (0, _moment2.default)(item.purchaseDate).valueOf() <=
                    _moment2.default.utc().valueOf();
              });
              var insightMonthly = distinctInsightMonthly.filter(
                  function(item) {
                    return (0, _moment2.default)(item.purchaseDate).valueOf() >=
                        _moment2.default.utc().startOf('year').valueOf() &&
                        (0, _moment2.default)(item.purchaseDate).valueOf() <=
                        _moment2.default.utc().valueOf();
                  });
              return {
                status: true,
                productList: productList.filter(function(item) {
                  return (0, _moment2.default)(item.purchaseDate).valueOf() >=
                      _moment2.default.utc().
                          subtract(6, 'd').
                          startOf('d').
                          valueOf() &&
                      (0, _moment2.default)(item.purchaseDate).valueOf() <=
                      _moment2.default.utc().valueOf();
                }).slice(0, 10),
                productListWeekly: productListWeekly,
                productListMonthly: productListMonthly,
                insight: distinctInsight && distinctInsight.length > 0 ? {
                  categoryName: result.name,
                  startDate: _moment2.default.utc().
                      subtract(6, 'd').
                      startOf('d'),
                  endDate: _moment2.default.utc(),
                  currentMonthId: _moment2.default.utc().month() + 1,
                  currentWeek: weekAndDay(_moment2.default.utc()).monthWeek,
                  currentDay: weekAndDay(_moment2.default.utc()).day,
                  monthStartDate: _moment2.default.utc().startOf('month'),
                  monthEndDate: _moment2.default.utc(),
                  yearStartDate: _moment2.default.utc().startOf('year'),
                  yearEndDate: _moment2.default.utc(),
                  totalSpend: _shared2.default.sumProps(insightData, 'value'),
                  totalYearlySpend: _shared2.default.sumProps(insightMonthly,
                      'value'),
                  totalMonthlySpend: _shared2.default.sumProps(insightWeekly,
                      'value'),
                  totalDays: insightData.length,
                  insightData: insightData,
                  insightWeekly: insightWeekly,
                  insightMonthly: insightMonthly,
                } : {
                  categoryName: result.name,
                  startDate: _moment2.default.utc().
                      subtract(6, 'd').
                      startOf('d'),
                  endDate: _moment2.default.utc(),
                  currentMonthId: _moment2.default.utc().month() + 1,
                  currentWeek: weekAndDay(_moment2.default.utc()).monthWeek,
                  currentDay: weekAndDay(_moment2.default.utc()).day,
                  monthStartDate: _moment2.default.utc().startOf('month'),
                  monthEndDate: _moment2.default.utc(),
                  yearStartDate: _moment2.default.utc().startOf('year'),
                  yearEndDate: _moment2.default.utc(),
                  totalSpend: 0.00,
                  totalYearlySpend: 0.00,
                  totalMonthlySpend: 0.00,
                  totalDays: 0,
                  insightData: [],
                  insightWeekly: [],
                  insightMonthly: [],
                },
                categoryName: result.name,
                forceUpdate: request.pre.forceUpdate,
              };
            }).
            catch(function(err) {
              console.log({API_Logs: err});
              return {
                status: false,
                err: err,
                forceUpdate: request.pre.forceUpdate,
              };
            });
      }
    }]);

  return InsightAdaptor;
}();

exports.default = InsightAdaptor;