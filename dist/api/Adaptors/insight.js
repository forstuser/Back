/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

function weekAndDay(d) {
    const days = [1, 2, 3, 4, 5, 6, 7];
    const prefixes = [1, 2, 3, 4, 5];

    return {
        monthWeek: prefixes[Math.round(_moment2.default.utc(d).date() / 7)],
        day: days[_moment2.default.utc(d).day()]
    };
}

const dateFormatString = 'YYYY-MM-DD';
const monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthStartDay = _moment2.default.utc().startOf('month');
const monthLastDay = _moment2.default.utc().endOf('month');
const yearStartDay = _moment2.default.utc().startOf('year');
const yearLastDay = _moment2.default.utc().startOf('year');

function customSortCategories(categoryData) {
    const OtherCategory = categoryData.find(elem => {
        return elem.id === 9;
    });

    const categoryDataWithoutOthers = categoryData.filter(elem => {
        return elem.id !== 9;
    });

    const newCategoryData = [];

    let pushed = false;

    categoryDataWithoutOthers.forEach(elem => {
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

class InsightAdaptor {
    constructor(modals) {
        this.modals = modals;
        this.categoryAdaptor = new _category2.default(modals);
        this.productAdaptor = new _product2.default(modals);
        this.amcAdaptor = new _amcs2.default(modals);
        this.insuranceAdaptor = new _insurances2.default(modals);
        this.repairAdaptor = new _repairs2.default(modals);
        this.warrantyAdaptor = new _warranties2.default(modals);
        this.pucAdaptor = new _pucs2.default(modals);
    }

    prepareInsightData(user, request) {
        const minDate = request.query.mindate;
        const maxDate = request.query.maxdate;
        return this.prepareCategoryData(user, {}).then(result => {

            const categoryData = !(minDate || maxDate) ? {
                weeklyData: result.map(item => {
                    const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('day').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
                    const totalAmount = _shared2.default.sumProps(expenses, 'value');
                    const totalTax = _shared2.default.sumProps(expenses, 'taxes');
                    return {
                        id: item.id,
                        cName: item.name,
                        cURL: item.categoryInsightUrl,
                        cImageURl: item.categoryImageUrl,
                        totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                        totalTax: parseFloat(totalTax || 0).toFixed(2)
                    };
                }),
                monthlyData: result.map(item => {
                    const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
                    const totalAmount = _shared2.default.sumProps(expenses, 'value');
                    const totalTax = _shared2.default.sumProps(expenses, 'taxes');
                    return {
                        id: item.id,
                        cName: item.name,
                        cURL: item.categoryInsightUrl,
                        cImageURl: item.categoryImageUrl,
                        totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                        totalTax: parseFloat(totalTax || 0).toFixed(2)
                    };
                }),
                yearlyData: result.map(item => {
                    const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
                    const totalAmount = _shared2.default.sumProps(expenses, 'value');
                    const totalTax = _shared2.default.sumProps(expenses, 'taxes');
                    return {
                        id: item.id,
                        cName: item.name,
                        cURL: item.categoryInsightUrl,
                        cImageURl: item.categoryImageUrl,
                        totalAmount: parseFloat(totalAmount || 0).toFixed(2),
                        totalTax: parseFloat(totalTax || 0).toFixed(2)
                    };
                }),
                overallData: result.map(item => {
                    const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
                    const totalAmount = _shared2.default.sumProps(expenses, 'value');
                    const totalTax = _shared2.default.sumProps(expenses, 'taxes');
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
                customDateData: result.map(item => {
                    const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc(minDate).utc().startOf('d').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc(maxDate).utc().endOf('d').valueOf());
                    const totalAmount = _shared2.default.sumProps(expenses, 'value');
                    const totalTax = _shared2.default.sumProps(expenses, 'taxes');
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
                categoryData.customDateData = _lodash2.default.chain(categoryData.customDateData).map(elem => {
                    elem.totalAmount = parseFloat(elem.totalAmount);
                    return elem;
                }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(elem => {
                    elem.totalAmount = elem.totalAmount.toString();
                    return elem;
                }).value();

                const totalAmounts = _shared2.default.sumProps(categoryData.customDateData, 'totalAmount');
                const totalTaxes = _shared2.default.sumProps(categoryData.customDateData, 'totalTax');
                return {
                    status: true,
                    message: 'Insight restore successful',
                    categoryData,
                    totalSpend: (totalAmounts || 0).toFixed(2),
                    totalTaxes: (totalTaxes || 0).toFixed(2),
                    startDate: minDate,
                    endDate: maxDate,
                    forceUpdate: request.pre.forceUpdate
                };
            }

            categoryData.weeklyData = _lodash2.default.chain(categoryData.weeklyData).map(elem => {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
            }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(elem => {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
            }).value();

            categoryData.monthlyData = _lodash2.default.chain(categoryData.monthlyData).map(elem => {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
            }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(elem => {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
            }).value();

            categoryData.yearlyData = _lodash2.default.chain(categoryData.yearlyData).map(elem => {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
            }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(elem => {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
            }).value();

            categoryData.overallData = _lodash2.default.chain(categoryData.overallData).map(elem => {
                elem.totalAmount = parseFloat(elem.totalAmount);
                return elem;
            }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(elem => {
                elem.totalAmount = elem.totalAmount.toString();
                return elem;
            }).value();

            categoryData.weeklyData = customSortCategories(categoryData.weeklyData, 'totalAmount');
            categoryData.monthlyData = customSortCategories(categoryData.monthlyData, 'totalAmount');
            categoryData.yearlyData = customSortCategories(categoryData.yearlyData, 'totalAmount');
            categoryData.overallData = customSortCategories(categoryData.overallData, 'totalAmount');

            const totalWeeklyAmounts = _shared2.default.sumProps(categoryData.weeklyData, 'totalAmount');
            const totalWeeklyTaxes = _shared2.default.sumProps(categoryData.weeklyData, 'totalTax');
            const totalYearlyAmounts = _shared2.default.sumProps(categoryData.yearlyData, 'totalAmount');
            const totalYearlyTaxes = _shared2.default.sumProps(categoryData.yearlyData, 'totalTax');
            const totalOverallAmounts = _shared2.default.sumProps(categoryData.overallData, 'totalAmount');
            const totalOverallTaxes = _shared2.default.sumProps(categoryData.overallData, 'totalTax');
            const totalMonthlyAmounts = _shared2.default.sumProps(categoryData.monthlyData, 'totalAmount');
            const totalMonthlyTaxes = _shared2.default.sumProps(categoryData.monthlyData, 'totalTax');
            return {
                status: true,
                message: 'Insight restore successful',
                categoryData,
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
        }).catch(err => {

            this.modals.logs.create({
                api_action: request.method,
                api_path: request.url.pathname,
                log_type: 2,
                user_id: user.id || user.ID,
                log_content: JSON.stringify({
                    params: request.params,
                    query: request.query,
                    headers: request.headers,
                    payload: request.payload,
                    err
                })
            }).catch(ex => console.log('error while logging on db,', ex));
            return {
                status: false,
                message: 'Insight restore failed',
                err,
                forceUpdate: request.pre.forceUpdate
            };
        });
    }

    prepareCategoryData(user, options, language) {
        const categoryOption = {
            category_level: 1,
            status_type: 1
        };

        const productOptions = {
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
        return Promise.all([this.categoryAdaptor.retrieveCategories(categoryOption, false, language), this.productAdaptor.retrieveProducts(productOptions, language), this.amcAdaptor.retrieveAMCs(productOptions), this.insuranceAdaptor.retrieveInsurances(productOptions), this.repairAdaptor.retrieveRepairs(productOptions), this.warrantyAdaptor.retrieveWarranties(productOptions), this.pucAdaptor.retrievePUCs(productOptions)]).then(results => {
            return results[0].map(categoryItem => {
                const category = categoryItem;
                const products = _lodash2.default.chain(results[1]).map(productItem => {
                    const product = productItem;
                    product.dataIndex = 1;
                    return product;
                }).filter(productItem => productItem.masterCategoryId === category.id);
                const amcs = _lodash2.default.chain(results[2]).map(amcItem => {
                    const amc = amcItem;
                    amc.dataIndex = 2;
                    return amc;
                }).filter(amcItem => amcItem.masterCategoryId === category.id);
                const insurances = _lodash2.default.chain(results[3]).map(insuranceItem => {
                    const insurance = insuranceItem;
                    insurance.dataIndex = 3;
                    return insurance;
                }).filter(insuranceItem => insuranceItem.masterCategoryId === category.id);
                const repairs = _lodash2.default.chain(results[4]).map(repairItem => {
                    const repair = repairItem;
                    repair.dataIndex = 4;
                    return repair;
                }).filter(repairItem => repairItem.masterCategoryId === category.id);
                const warranties = _lodash2.default.chain(results[5]).map(warrantyItem => {
                    const warranty = warrantyItem;
                    warranty.dataIndex = 5;
                    return warranty;
                }).filter(warrantyItem => warrantyItem.masterCategoryId === category.id);
                const pucs = _lodash2.default.chain(results[6]).map(pucItem => {
                    const puc = pucItem;
                    puc.dataIndex = 6;
                    return puc;
                }).filter(pucItem => pucItem.masterCategoryId === category.id);
                category.expenses = _lodash2.default.chain([...products, ...amcs, ...insurances, ...repairs, ...warranties, ...pucs] || []).sortBy(item => {
                    return _moment2.default.utc(item.purchaseDate || item.updatedDate);
                }).reverse().value();

                return category;
            });
        });
    }

    prepareCategoryInsight(user, request) {
        const masterCategoryId = request.params.id;
        return this.prepareCategoryData(user, { category_id: masterCategoryId }).then(result => {
            const productList = _lodash2.default.chain(result[0].expenses).filter(item => item.purchaseDate && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf()).orderBy(['purchaseDate'], ['desc']).value();

            const distinctInsightWeekly = [];
            const distinctInsightMonthly = [];
            const distinctInsightYearly = [];
            const distinctInsight = [];
            productList.map(item => {
                const expense = item;
                const index = distinctInsight.findIndex(distinctItem => _moment2.default.utc(distinctItem.purchaseDate).startOf('day').diff(_moment2.default.utc(expense.purchaseDate, _moment2.default.ISO_8601).startOf('day'), 'days', true) === 0);
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

            const distinctInsightTemp = distinctInsight.map(item => {
                const dayItem = {
                    value: item.value || 0,
                    month: item.month,
                    monthId: item.monthId,
                    purchaseDate: item.purchaseDate,
                    week: item.week,
                    day: item.day,
                    year: item.year,
                    tax: item.tax || 0
                };

                const weekItem = {
                    value: item.value || 0,
                    month: item.month,
                    monthId: item.monthId,
                    purchaseDate: item.purchaseDate,
                    week: item.week,
                    day: item.day,
                    year: item.year,
                    tax: item.tax || 0
                };

                const monthItem = {
                    value: item.value || 0,
                    month: item.month,
                    monthId: item.monthId,
                    purchaseDate: item.purchaseDate,
                    week: item.week,
                    day: item.day,
                    year: item.year,
                    tax: item.tax || 0
                };

                const yearItem = {
                    value: item.value || 0,
                    month: item.month,
                    monthId: item.monthId,
                    purchaseDate: item.purchaseDate,
                    week: item.week,
                    year: item.year,
                    day: item.day,
                    tax: item.tax || 0
                };
                const monthIndex = distinctInsightMonthly.findIndex(distinctItem => distinctItem.month === monthItem.month && distinctItem.year === monthItem.year);
                const weekIndex = distinctInsightWeekly.findIndex(distinctItem => distinctItem.week === weekItem.week && distinctItem.month === weekItem.month && distinctItem.year === weekItem.year);
                const yearIndex = distinctInsightYearly.findIndex(distinctItem => distinctItem.year === yearItem.year);
                if (weekIndex !== -1 && monthIndex !== -1) {
                    const currentWeekInsight = distinctInsightWeekly[weekIndex];
                    currentWeekInsight.value += weekItem.value || 0;
                    currentWeekInsight.tax += weekItem.tax || 0;
                } else {
                    distinctInsightWeekly.push(weekItem);
                }

                if (monthIndex === -1) {
                    distinctInsightMonthly.push(monthItem);
                } else {
                    const currentMonthInsight = distinctInsightMonthly[monthIndex];
                    currentMonthInsight.value += monthItem.value || 0;
                    currentMonthInsight.tax += monthItem.tax || 0;
                }

                if (yearIndex === -1) {
                    distinctInsightYearly.push(yearItem);
                } else {
                    const currentYearInsight = distinctInsightYearly[yearIndex];
                    currentYearInsight.value += yearItem.value || 0;
                    currentYearInsight.tax += yearItem.tax || 0;
                }

                return dayItem;
            });

            const productListWeekly = productList.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf()).map(item => {
                item.purchaseDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('days');
                return item;
            });
            const productListMonthly = productList.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf()).map(item => {
                item.purchaseDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('days');
                return item;
            });

            const overallProductList = productList.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf()).map(item => {
                item.purchaseDate = _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).startOf('days');
                return item;
            });

            distinctInsightMonthly.sort((a, b) => _moment2.default.utc(b.purchaseDate) - _moment2.default.utc(a.purchaseDate));
            distinctInsightWeekly.sort((a, b) => _moment2.default.utc(b.purchaseDate) - _moment2.default.utc(a.purchaseDate));
            distinctInsightYearly.sort((a, b) => _moment2.default.utc(b.purchaseDate) - _moment2.default.utc(a.purchaseDate));
            const insightData = _shared2.default.retrieveDaysInsight(distinctInsightTemp.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('day').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf()));
            insightData.sort((a, b) => _moment2.default.utc(a.purchaseDate) - _moment2.default.utc(b.purchaseDate));
            const insightWeekly = distinctInsightWeekly.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
            const insightMonthly = distinctInsightMonthly.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
            const overallInsight = distinctInsightYearly.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf());
            return {
                status: true,
                productList: productList.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('day').valueOf() && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).valueOf() <= _moment2.default.utc().valueOf()),
                productListWeekly,
                productListMonthly,
                overallProductList,
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
                    insightData,
                    insightWeekly,
                    insightMonthly,
                    overallInsight
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
        }).catch(err => {
            console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
            this.modals.logs.create({
                api_action: request.method,
                api_path: request.url.pathname,
                log_type: 2,
                user_id: user.id || user.ID,
                log_content: JSON.stringify({
                    params: request.params,
                    query: request.query,
                    headers: request.headers,
                    payload: request.payload,
                    err
                })
            }).catch(ex => console.log('error while logging on db,', ex));
            return {
                status: false,
                err,
                forceUpdate: request.pre.forceUpdate
            };
        });
    }
}

exports.default = InsightAdaptor;