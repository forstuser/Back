/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
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

var _pucs = require('./pucs');

var _pucs2 = _interopRequireDefault(_pucs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function weekAndDay(d) {
    var days = [1, 2, 3, 4, 5, 6, 7];
    var prefixes = [1, 2, 3, 4, 5];

    return {
        monthWeek: prefixes[Math.round(_moment2.default.utc(d).date() / 7)],
        day: days[_moment2.default.utc(d).day()]
    };
}

var dateFormatString = 'YYYY-MM-DD';
var monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var monthStartDay = _moment2.default.utc().startOf('month');
var monthLastDay = _moment2.default.utc().endOf('month');
var yearStartDay = _moment2.default.utc().startOf('year');
var yearLastDay = _moment2.default.utc().startOf('year');

function customSortCategories(categoryData) {
    var OtherCategory = categoryData.find(function (elem) {
        return elem.id === 9;
    });

    var categoryDataWithoutOthers = categoryData.filter(function (elem) {
        return elem.id !== 9;
    });

    var newCategoryData = [];

    var pushed = false;

    categoryDataWithoutOthers.forEach(function (elem) {
        if (OtherCategory && elem && parseFloat(OtherCategory.totalAmount) > parseFloat(elem.totalAmount) && !pushed) {
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
        this.pucAdaptor = new _pucs2.default(modals);
    }

    _createClass(InsightAdaptor, [{
        key: 'prepareInsightData',
        value: function prepareInsightData(user, request) {
            var _this = this;

            var minDate = request.query.mindate;
            var maxDate = request.query.maxdate;
            return this.prepareCategoryData(user, {}).then(function (result) {

                var categoryData = !(minDate || maxDate) ? {
                    weeklyData: result.map(function (item) {
                        var expenses = item.expenses.filter(function (item) {
                            return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('day').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                        });
                        var totalAmount = _shared2.default.sumProps(expenses, 'value');
                        var totalTax = _shared2.default.sumProps(expenses, 'taxes');
                        return {
                            id: item.id,
                            cName: item.name,
                            cURL: item.categoryInsightUrl,
                            cImageURl: item.categoryImageUrl,
                            totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                            totalTax: parseFloat(totalTax || 0).toFixed(2)
                        };
                    }),
                    monthlyData: result.map(function (item) {
                        var expenses = item.expenses.filter(function (item) {
                            return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                        });
                        var totalAmount = _shared2.default.sumProps(expenses, 'value');
                        var totalTax = _shared2.default.sumProps(expenses, 'taxes');
                        return {
                            id: item.id,
                            cName: item.name,
                            cURL: item.categoryInsightUrl,
                            cImageURl: item.categoryImageUrl,
                            totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                            totalTax: parseFloat(totalTax || 0).toFixed(2)
                        };
                    }),
                    yearlyData: result.map(function (item) {
                        var expenses = item.expenses.filter(function (item) {
                            return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                        });
                        var totalAmount = _shared2.default.sumProps(expenses, 'value');
                        var totalTax = _shared2.default.sumProps(expenses, 'taxes');
                        return {
                            id: item.id,
                            cName: item.name,
                            cURL: item.categoryInsightUrl,
                            cImageURl: item.categoryImageUrl,
                            totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                            totalTax: parseFloat(totalTax || 0).toFixed(2)
                        };
                    }),
                    overallData: result.map(function (item) {
                        var expenses = item.expenses.filter(function (item) {
                            return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                        });
                        var totalAmount = _shared2.default.sumProps(expenses, 'value');
                        var totalTax = _shared2.default.sumProps(expenses, 'taxes');
                        return {
                            id: item.id,
                            cName: item.name,
                            cURL: item.categoryInsightUrl,
                            cImageURl: item.categoryImageUrl,
                            totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                            totalTax: parseFloat(totalTax || 0).toFixed(2)
                        };
                    })
                } : {
                    customDateData: result.map(function (item) {
                        var expenses = item.expenses.filter(function (item) {
                            return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc(minDate).utc().startOf('d').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc(maxDate).utc().endOf('d').valueOf();
                        });
                        var totalAmount = _shared2.default.sumProps(expenses, 'value');
                        var totalTax = _shared2.default.sumProps(expenses, 'taxes');
                        return {
                            id: item.id,
                            cName: item.name,
                            cURL: item.categoryInsightUrl,
                            cImageURl: item.categoryImageUrl,
                            totalAmount: (totalAmount || 0).toFixed(2),
                            totalTax: (totalTax || 0).toFixed(2)
                        };
                    })
                };

                if (minDate || maxDate) {
                    categoryData.customDateData = _lodash2.default.chain(categoryData.customDateData).map(function (elem) {
                        elem.totalAmount = parseFloat(elem.totalAmount);
                        return elem;
                    }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
                        elem.totalAmount = elem.totalAmount.toString();
                        return elem;
                    }).value();

                    var totalAmounts = _shared2.default.sumProps(categoryData.customDateData, 'totalAmount');
                    var totalTaxes = _shared2.default.sumProps(categoryData.customDateData, 'totalTax');
                    return {
                        status: true,
                        message: 'Insight restore successful',
                        categoryData: categoryData,
                        totalSpend: (totalAmounts || 0).toFixed(2),
                        totalTaxes: (totalTaxes || 0).toFixed(2),
                        startDate: minDate,
                        endDate: maxDate,
                        forceUpdate: request.pre.forceUpdate
                    };
                }

                categoryData.weeklyData = _lodash2.default.chain(categoryData.weeklyData).map(function (elem) {
                    elem.totalAmount = parseFloat(elem.totalAmount);
                    return elem;
                }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
                    elem.totalAmount = elem.totalAmount.toString();
                    return elem;
                }).value();

                categoryData.monthlyData = _lodash2.default.chain(categoryData.monthlyData).map(function (elem) {
                    elem.totalAmount = parseFloat(elem.totalAmount);
                    return elem;
                }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
                    elem.totalAmount = elem.totalAmount.toString();
                    return elem;
                }).value();

                categoryData.yearlyData = _lodash2.default.chain(categoryData.yearlyData).map(function (elem) {
                    elem.totalAmount = parseFloat(elem.totalAmount);
                    return elem;
                }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
                    elem.totalAmount = elem.totalAmount.toString();
                    return elem;
                }).value();

                categoryData.overallData = _lodash2.default.chain(categoryData.overallData).map(function (elem) {
                    elem.totalAmount = parseFloat(elem.totalAmount);
                    return elem;
                }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
                    elem.totalAmount = elem.totalAmount.toString();
                    return elem;
                }).value();

                categoryData.weeklyData = customSortCategories(categoryData.weeklyData, 'totalAmount');
                categoryData.monthlyData = customSortCategories(categoryData.monthlyData, 'totalAmount');
                categoryData.yearlyData = customSortCategories(categoryData.yearlyData, 'totalAmount');
                categoryData.overallData = customSortCategories(categoryData.overallData, 'totalAmount');

                var totalWeeklyAmounts = _shared2.default.sumProps(categoryData.weeklyData, 'totalAmount');
                var totalWeeklyTaxes = _shared2.default.sumProps(categoryData.weeklyData, 'totalTax');
                var totalYearlyAmounts = _shared2.default.sumProps(categoryData.yearlyData, 'totalAmount');
                var totalYearlyTaxes = _shared2.default.sumProps(categoryData.yearlyData, 'totalTax');
                var totalOverallAmounts = _shared2.default.sumProps(categoryData.overallData, 'totalAmount');
                var totalOverallTaxes = _shared2.default.sumProps(categoryData.overallData, 'totalTax');
                var totalMonthlyAmounts = _shared2.default.sumProps(categoryData.monthlyData, 'totalAmount');
                var totalMonthlyTaxes = _shared2.default.sumProps(categoryData.monthlyData, 'totalTax');
                return {
                    status: true,
                    message: 'Insight restore successful',
                    categoryData: categoryData,
                    weekStartDate: _moment2.default.utc().subtract(6, 'd').startOf('d').format(dateFormatString),
                    monthStartDate: _moment2.default.utc(monthStartDay, _moment2.default.ISO_8601).format(dateFormatString),
                    weekEndDate: _moment2.default.utc().format(dateFormatString),
                    monthLastDate: _moment2.default.utc(monthLastDay, _moment2.default.ISO_8601).format(dateFormatString),
                    yearStartDate: _moment2.default.utc(yearStartDay, _moment2.default.ISO_8601).format(dateFormatString),
                    yearEndDate: _moment2.default.utc(yearLastDay, _moment2.default.ISO_8601).format(dateFormatString),
                    totalYearlySpend: parseFloat(totalYearlyAmounts || 0).toFixed(2),
                    totalWeeklySpend: parseFloat(totalWeeklyAmounts || 0).toFixed(2),
                    totalWeeklyTaxes: parseFloat(totalWeeklyTaxes || 0).toFixed(2),
                    totalYearlyTaxes: parseFloat(totalYearlyTaxes || 0).toFixed(2),
                    totalMonthlySpend: parseFloat(totalMonthlyAmounts || 0).toFixed(2),
                    totalMonthlyTaxes: parseFloat(totalMonthlyTaxes || 0).toFixed(2),
                    totalOverallSpend: parseFloat(totalOverallAmounts || 0).toFixed(2),
                    totalOverallTaxes: parseFloat(totalOverallTaxes || 0).toFixed(2),
                    forceUpdate: request.pre.forceUpdate
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
                    message: 'Insight restore failed',
                    err: err,
                    forceUpdate: request.pre.forceUpdate
                };
            });
        }
    }, {
        key: 'prepareCategoryData',
        value: function prepareCategoryData(user, options, language) {
            var categoryOption = {
                category_level: 1,
                status_type: 1
            };

            var productOptions = {
                status_type: [5, 11, 12],
                product_status_type: [5, 11],
                user_id: user.id || user.ID
            };

            if (options.category_id) {
                categoryOption.category_id = options.category_id;
                productOptions.main_category_id = options.category_id;
            } else {
                categoryOption.category_id = {
                    $notIn: [10]
                };
            }
            return Promise.all([this.categoryAdaptor.retrieveCategories(categoryOption, false, language), this.productAdaptor.retrieveProducts(productOptions, language), this.amcAdaptor.retrieveAMCs(productOptions), this.insuranceAdaptor.retrieveInsurances(productOptions), this.repairAdaptor.retrieveRepairs(productOptions), this.warrantyAdaptor.retrieveWarranties(productOptions), this.pucAdaptor.retrievePUCs(productOptions)]).then(function (results) {
                return results[0].map(function (categoryItem) {
                    var category = categoryItem;
                    var products = _lodash2.default.chain(results[1]).map(function (productItem) {
                        var product = productItem;
                        product.dataIndex = 1;
                        return product;
                    }).filter(function (productItem) {
                        return productItem.masterCategoryId === category.id;
                    });
                    var amcs = _lodash2.default.chain(results[2]).map(function (amcItem) {
                        var amc = amcItem;
                        amc.dataIndex = 2;
                        return amc;
                    }).filter(function (amcItem) {
                        return amcItem.masterCategoryId === category.id;
                    });
                    var insurances = _lodash2.default.chain(results[3]).map(function (insuranceItem) {
                        var insurance = insuranceItem;
                        insurance.dataIndex = 3;
                        return insurance;
                    }).filter(function (insuranceItem) {
                        return insuranceItem.masterCategoryId === category.id;
                    });
                    var repairs = _lodash2.default.chain(results[4]).map(function (repairItem) {
                        var repair = repairItem;
                        repair.dataIndex = 4;
                        return repair;
                    }).filter(function (repairItem) {
                        return repairItem.masterCategoryId === category.id;
                    });
                    var warranties = _lodash2.default.chain(results[5]).map(function (warrantyItem) {
                        var warranty = warrantyItem;
                        warranty.dataIndex = 5;
                        return warranty;
                    }).filter(function (warrantyItem) {
                        return warrantyItem.masterCategoryId === category.id;
                    });
                    var pucs = _lodash2.default.chain(results[6]).map(function (pucItem) {
                        var puc = pucItem;
                        puc.dataIndex = 6;
                        return puc;
                    }).filter(function (pucItem) {
                        return pucItem.masterCategoryId === category.id;
                    });
                    category.expenses = _lodash2.default.chain([].concat(_toConsumableArray(products), _toConsumableArray(amcs), _toConsumableArray(insurances), _toConsumableArray(repairs), _toConsumableArray(warranties), _toConsumableArray(pucs)) || []).sortBy(function (item) {
                        return _moment2.default.utc(item.purchaseDate || item.updatedDate);
                    }).reverse().value();

                    return category;
                });
            });
        }
    }, {
        key: 'prepareCategoryInsight',
        value: function prepareCategoryInsight(user, request) {
            var _this2 = this;

            var masterCategoryId = request.params.id;
            return this.prepareCategoryData(user, { category_id: masterCategoryId }).then(function (result) {
                var productList = _lodash2.default.chain(result[0].expenses).filter(function (item) {
                    return item.purchaseDate && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                }).orderBy(['purchaseDate'], ['asc']).value();

                var distinctInsightWeekly = [];
                var distinctInsightMonthly = [];
                var distinctInsightYearly = [];
                var distinctInsight = [];
                productList.map(function (item) {
                    var expense = item;
                    var index = distinctInsight.findIndex(function (distinctItem) {
                        return _moment2.default.utc(distinctItem.purchaseDate).startOf('day').diff(_moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601).startOf('day'), 'days', true) === 0;
                    });
                    if (index === -1) {
                        distinctInsight.push({
                            value: expense.value,
                            month: monthArray[_moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601).month()],
                            monthId: _moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601).month() + 1,
                            purchaseDate: _moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601),
                            year: _moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601).year(),
                            week: weekAndDay(_moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601)).monthWeek,
                            day: weekAndDay(_moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601)).day,
                            tax: expense.taxes
                        });
                    } else {
                        distinctInsight[index].value += expense.value || 0;
                        distinctInsight[index].tax += expense.taxes || 0;
                    }

                    return expense;
                });

                var distinctInsightTemp = distinctInsight.map(function (item) {
                    var dayItem = {
                        value: item.value || 0,
                        month: item.month,
                        monthId: item.monthId,
                        purchaseDate: item.purchaseDate,
                        week: item.week,
                        day: item.day,
                        year: item.year,
                        tax: item.tax || 0
                    };

                    var weekItem = {
                        value: item.value || 0,
                        month: item.month,
                        monthId: item.monthId,
                        purchaseDate: item.purchaseDate,
                        week: item.week,
                        day: item.day,
                        year: item.year,
                        tax: item.tax || 0
                    };

                    var monthItem = {
                        value: item.value || 0,
                        month: item.month,
                        monthId: item.monthId,
                        purchaseDate: item.purchaseDate,
                        week: item.week,
                        day: item.day,
                        year: item.year,
                        tax: item.tax || 0
                    };

                    var yearItem = {
                        value: item.value || 0,
                        month: item.month,
                        monthId: item.monthId,
                        purchaseDate: item.purchaseDate,
                        week: item.week,
                        year: item.year,
                        day: item.day,
                        tax: item.tax || 0
                    };
                    var monthIndex = distinctInsightMonthly.findIndex(function (distinctItem) {
                        return distinctItem.month === monthItem.month && distinctItem.year === monthItem.year;
                    });
                    var weekIndex = distinctInsightWeekly.findIndex(function (distinctItem) {
                        return distinctItem.week === weekItem.week && distinctItem.month === weekItem.month && distinctItem.year === weekItem.year;
                    });
                    var yearIndex = distinctInsightYearly.findIndex(function (distinctItem) {
                        return distinctItem.year === yearItem.year;
                    });
                    if (weekIndex !== -1 && monthIndex !== -1) {
                        var currentWeekInsight = distinctInsightWeekly[weekIndex];
                        currentWeekInsight.value += weekItem.value || 0;
                        currentWeekInsight.tax += weekItem.tax || 0;
                    } else {
                        distinctInsightWeekly.push(weekItem);
                    }

                    if (monthIndex === -1) {
                        distinctInsightMonthly.push(monthItem);
                    } else {
                        var currentMonthInsight = distinctInsightMonthly[monthIndex];
                        currentMonthInsight.value += monthItem.value || 0;
                        currentMonthInsight.tax += monthItem.tax || 0;
                    }

                    if (yearIndex === -1) {
                        distinctInsightYearly.push(yearItem);
                    } else {
                        var currentYearInsight = distinctInsightYearly[yearIndex];
                        currentYearInsight.value += yearItem.value || 0;
                        currentYearInsight.tax += yearItem.tax || 0;
                    }

                    return dayItem;
                });

                var productListWeekly = productList.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                }).map(function (item) {
                    item.purchaseDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('days');
                    return item;
                });
                var productListMonthly = productList.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                }).map(function (item) {
                    item.purchaseDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('days');
                    return item;
                });

                var overallProductList = productList.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                }).map(function (item) {
                    item.purchaseDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('days');
                    return item;
                });

                distinctInsightMonthly.sort(function (a, b) {
                    return _moment2.default.utc(b.purchaseDate) - _moment2.default.utc(a.purchaseDate);
                });
                distinctInsightWeekly.sort(function (a, b) {
                    return _moment2.default.utc(b.purchaseDate) - _moment2.default.utc(a.purchaseDate);
                });
                distinctInsightYearly.sort(function (a, b) {
                    return _moment2.default.utc(b.purchaseDate) - _moment2.default.utc(a.purchaseDate);
                });
                var insightData = _shared2.default.retrieveDaysInsight(distinctInsightTemp.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('day').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                }));
                insightData.sort(function (a, b) {
                    return _moment2.default.utc(a.purchaseDate) - _moment2.default.utc(b.purchaseDate);
                });
                var insightWeekly = distinctInsightWeekly.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                });
                var insightMonthly = distinctInsightMonthly.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                });
                var overallInsight = distinctInsightYearly.filter(function (item) {
                    return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                });
                return {
                    status: true,
                    productList: productList.filter(function (item) {
                        return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('day').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf();
                    }),
                    productListWeekly: productListWeekly,
                    productListMonthly: productListMonthly,
                    overallProductList: overallProductList,
                    insight: distinctInsight && distinctInsight.length > 0 ? {
                        categoryName: result[0].name,
                        startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
                        endDate: _moment2.default.utc(),
                        currentMonthId: _moment2.default.utc().month() + 1,
                        currentWeek: weekAndDay(_moment2.default.utc()).monthWeek,
                        currentDay: weekAndDay(_moment2.default.utc()).day,
                        monthStartDate: _moment2.default.utc().startOf('month'),
                        monthEndDate: _moment2.default.utc(),
                        yearStartDate: _moment2.default.utc().startOf('year'),
                        yearEndDate: _moment2.default.utc(),
                        totalSpend: _shared2.default.sumProps(insightData, 'value'),
                        totalYearlySpend: _shared2.default.sumProps(insightMonthly, 'value'),
                        totalMonthlySpend: _shared2.default.sumProps(insightWeekly, 'value'),
                        totalOverallSpend: _shared2.default.sumProps(overallInsight, 'value'),
                        totalDays: insightData.length,
                        insightData: insightData,
                        insightWeekly: insightWeekly,
                        insightMonthly: insightMonthly,
                        overallInsight: overallInsight
                    } : {
                        categoryName: result[0].name,
                        startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
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
                        overallInsight: []
                    },
                    categoryName: result[0].name,
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
                    err: err,
                    forceUpdate: request.pre.forceUpdate
                };
            });
        }
    }]);

    return InsightAdaptor;
}();

exports.default = InsightAdaptor;