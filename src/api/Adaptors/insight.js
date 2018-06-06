/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';
import shared from '../../helpers/shared';
import moment from 'moment';
import CategoryAdaptor from './category';
import ProductAdaptor from './product';
import AmcAdaptor from './amcs';
import InsuranceAdaptor from './insurances';
import RepairAdaptor from './repairs';
import WarrantyAdaptor from './warranties';
import PUCAdaptor from './pucs';

function weekAndDay(d) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const prefixes = [1, 2, 3, 4, 5];

  return {
    monthWeek: prefixes[Math.round(moment.utc(d).date() / 7)],
    day: days[moment.utc(d).day()],
  };
}

const dateFormatString = 'YYYY-MM-DD';
const monthArray = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'];
const monthStartDay = moment.utc().startOf('month');
const monthLastDay = moment.utc().endOf('month');
const yearStartDay = moment.utc().startOf('year');
const yearLastDay = moment.utc().startOf('year');

function customSortCategories(categoryData) {
  const OtherCategory = categoryData.find((elem) => {
    return elem.id === 9;
  });

  const categoryDataWithoutOthers = categoryData.filter((elem) => {
    return (elem.id !== 9);
  });

  const newCategoryData = [];

  let pushed = false;

  categoryDataWithoutOthers.forEach((elem) => {
    if ((OtherCategory && elem) && (parseFloat(OtherCategory.totalAmount) >
        parseFloat(elem.totalAmount)) &&
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

class InsightAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.productAdaptor = new ProductAdaptor(modals);
    this.amcAdaptor = new AmcAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.pucAdaptor = new PUCAdaptor(modals);
  }

  prepareInsightData(user, request) {
    const minDate = request.query.mindate;
    const maxDate = request.query.maxdate;
    return this.prepareCategoryData(user, {}).then((result) => {

      const categoryData = !(minDate || maxDate) ? {
        weeklyData: result.map((item) => {
          const expenses = item.expenses.filter(
              (item) => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().subtract(6, 'd').startOf('day').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf());
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            id: item.id,
            cName: item.name,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: parseFloat(totalAmount ||
                0).toFixed(2),
            totalTax: parseFloat(totalTax ||
                0).toFixed(2),
          };
        }),
        monthlyData: result.map((item) => {
          const expenses = item.expenses.filter(
              (item) => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().startOf('month').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf());
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            id: item.id,
            cName: item.name,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: parseFloat(totalAmount ||
                0).toFixed(2),
            totalTax: parseFloat(totalTax ||
                0).toFixed(2),
          };
        }),
        yearlyData: result.map((item) => {
          const expenses = item.expenses.filter(
              (item) => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().startOf('year').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf());
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            id: item.id,
            cName: item.name,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: parseFloat(totalAmount ||
                0).toFixed(2),
            totalTax: parseFloat(totalTax ||
                0).toFixed(2),
          };
        }),
        overallData: result.map((item) => {
          const expenses = item.expenses.filter(
              (item) => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() <=
                  moment.utc().valueOf());
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            id: item.id,
            cName: item.name,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: parseFloat(totalAmount ||
                0).toFixed(2),
            totalTax: parseFloat(totalTax ||
                0).toFixed(2),
          };
        }),
      } : {
        customDateData: result.map((item) => {
          const expenses = item.expenses.filter(
              (item) => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc(minDate).utc().startOf('d').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc(maxDate).utc().endOf('d').valueOf());
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            id: item.id,
            cName: item.name,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: (totalAmount ||
                0).toFixed(2),
            totalTax: (totalTax ||
                0).toFixed(2),
          };
        }),
      };

      if (minDate || maxDate) {
        categoryData.customDateData = _.chain(categoryData.customDateData).
            map((elem) => {
              elem.totalAmount = parseFloat(elem.totalAmount);
              return elem;
            }).
            orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
            map((elem) => {
              elem.totalAmount = elem.totalAmount.toString();
              return elem;
            }).
            value();

        const totalAmounts = shared.sumProps(categoryData.customDateData,
            'totalAmount');
        const totalTaxes = shared.sumProps(categoryData.customDateData,
            'totalTax');
        return {
          status: true,
          message: 'Insight restore successful',
          categoryData,
          totalSpend: (totalAmounts ||
              0).toFixed(2),
          totalTaxes: (totalTaxes ||
              0).toFixed(2),
          startDate: minDate,
          endDate: maxDate,
          forceUpdate: request.pre.forceUpdate,
        };
      }

      categoryData.weeklyData = _.chain(categoryData.weeklyData).map((elem) => {
        elem.totalAmount = parseFloat(elem.totalAmount);
        return elem;
      }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map((elem) => {
        elem.totalAmount = elem.totalAmount.toString();
        return elem;
      }).value();

      categoryData.monthlyData = _.chain(categoryData.monthlyData).
          map((elem) => {
            elem.totalAmount = parseFloat(elem.totalAmount);
            return elem;
          }).
          orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
          map((elem) => {
            elem.totalAmount = elem.totalAmount.toString();
            return elem;
          }).
          value();

      categoryData.yearlyData = _.chain(categoryData.yearlyData).map((elem) => {
        elem.totalAmount = parseFloat(elem.totalAmount);
        return elem;
      }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map((elem) => {
        elem.totalAmount = elem.totalAmount.toString();
        return elem;
      }).value();

      categoryData.overallData = _.chain(categoryData.overallData).
          map((elem) => {
            elem.totalAmount = parseFloat(elem.totalAmount);
            return elem;
          }).
          orderBy(['totalAmount', 'cName'], ['desc', 'asc']).
          map((elem) => {
            elem.totalAmount = elem.totalAmount.toString();
            return elem;
          }).
          value();

      categoryData.weeklyData = customSortCategories(categoryData.weeklyData,
          'totalAmount');
      categoryData.monthlyData = customSortCategories(categoryData.monthlyData,
          'totalAmount');
      categoryData.yearlyData = customSortCategories(categoryData.yearlyData,
          'totalAmount');
      categoryData.overallData = customSortCategories(categoryData.overallData,
          'totalAmount');

      const totalWeeklyAmounts = shared.sumProps(categoryData.weeklyData,
          'totalAmount');
      const totalWeeklyTaxes = shared.sumProps(categoryData.weeklyData,
          'totalTax');
      const totalYearlyAmounts = shared.sumProps(categoryData.yearlyData,
          'totalAmount');
      const totalYearlyTaxes = shared.sumProps(categoryData.yearlyData,
          'totalTax');
      const totalOverallAmounts = shared.sumProps(categoryData.overallData,
          'totalAmount');
      const totalOverallTaxes = shared.sumProps(categoryData.overallData,
          'totalTax');
      const totalMonthlyAmounts = shared.sumProps(categoryData.monthlyData,
          'totalAmount');
      const totalMonthlyTaxes = shared.sumProps(categoryData.monthlyData,
          'totalTax');
      return {
        status: true,
        message: 'Insight restore successful',
        categoryData,
        weekStartDate: moment.utc().
            subtract(6, 'd').
            startOf('d').
            format(dateFormatString),
        monthStartDate: moment.utc(monthStartDay, moment.ISO_8601).
            format(dateFormatString),
        weekEndDate: moment.utc().format(dateFormatString),
        monthLastDate: moment.utc(monthLastDay, moment.ISO_8601).
            format(dateFormatString),
        yearStartDate: moment.utc(yearStartDay, moment.ISO_8601).
            format(dateFormatString),
        yearEndDate: moment.utc(yearLastDay, moment.ISO_8601).
            format(dateFormatString),
        totalYearlySpend: parseFloat(totalYearlyAmounts ||
            0).toFixed(2),
        totalWeeklySpend: parseFloat(totalWeeklyAmounts ||
            0).toFixed(2),
        totalWeeklyTaxes: parseFloat(totalWeeklyTaxes ||
            0).toFixed(2),
        totalYearlyTaxes: parseFloat(totalYearlyTaxes ||
            0).toFixed(2),
        totalMonthlySpend: parseFloat(totalMonthlyAmounts ||
            0).toFixed(2),
        totalMonthlyTaxes: parseFloat(totalMonthlyTaxes ||
            0).toFixed(2),
        totalOverallSpend: parseFloat(totalOverallAmounts ||
            0).toFixed(2),
        totalOverallTaxes: parseFloat(totalOverallTaxes ||
            0).toFixed(2),
        forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return ({
        status: false,
        message: 'Insight restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      });
    });
  }

  prepareCategoryData(user, options, language) {
    const categoryOption = {
      category_level: 1,
      status_type: 1,
    };

    const productOptions = {
      status_type: [5, 11, 12],
      product_status_type: [5, 11],
      user_id: user.id || user.ID,
    };

    if (options.category_id) {
      categoryOption.category_id = options.category_id;
      productOptions.main_category_id = options.category_id;
    } else {
      categoryOption.category_id = {
        $notIn: [10],
      };
    }
    return Promise.all([
      this.categoryAdaptor.retrieveCategories(categoryOption, false, language),
      this.productAdaptor.retrieveProducts(productOptions, language),
      this.amcAdaptor.retrieveAMCs(productOptions),
      this.insuranceAdaptor.retrieveInsurances(productOptions),
      this.repairAdaptor.retrieveRepairs(productOptions),
      this.warrantyAdaptor.retrieveWarranties(productOptions),
      this.pucAdaptor.retrievePUCs(productOptions)]).then((results) => {
      return results[0].map((categoryItem) => {
        const category = categoryItem;
        const products = _.chain(results[1]).map((productItem) => {
          const product = productItem;
          product.dataIndex = 1;
          return product;
        }).filter(
            (productItem) => productItem.masterCategoryId ===
                category.id);
        const amcs = _.chain(results[2]).map((amcItem) => {
          const amc = amcItem;
          amc.dataIndex = 2;
          return amc;
        }).filter((amcItem) => amcItem.masterCategoryId === category.id);
        const insurances = _.chain(results[3]).map((insuranceItem) => {
          const insurance = insuranceItem;
          insurance.dataIndex = 3;
          return insurance;
        }).filter(
            (insuranceItem) => insuranceItem.masterCategoryId ===
                category.id);
        const repairs = _.chain(results[4]).map((repairItem) => {
          const repair = repairItem;
          repair.dataIndex = 4;
          return repair;
        }).filter(
            (repairItem) => repairItem.masterCategoryId ===
                category.id);
        const warranties = _.chain(results[5]).map((warrantyItem) => {
          const warranty = warrantyItem;
          warranty.dataIndex = 5;
          return warranty;
        }).filter(
            (warrantyItem) => warrantyItem.masterCategoryId ===
                category.id);
        const pucs = _.chain(results[6]).map((pucItem) => {
          const puc = pucItem;
          puc.dataIndex = 6;
          return puc;
        }).filter(
            (pucItem) => pucItem.masterCategoryId ===
                category.id);
        category.expenses = _.chain([
          ...products,
          ...amcs,
          ...insurances,
          ...repairs,
          ...warranties,
          ...pucs,
        ] || []).sortBy((item) => {
          return moment.utc(item.purchaseDate || item.updatedDate);
        }).reverse().value();

        return category;
      });
    });
  }

  prepareCategoryInsight(user, request) {
    const masterCategoryId = request.params.id;
    return this.prepareCategoryData(user, {category_id: masterCategoryId}).
        then((result) => {
          const productList = _.chain(result[0].expenses).
              filter((item) => (item.purchaseDate &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf())).
              orderBy(['purchaseDate'],
                  ['desc']).
              value();

          const distinctInsightWeekly = [];
          const distinctInsightMonthly = [];
          const distinctInsightYearly = [];
          const distinctInsight = [];
          productList.map((item) => {
            const expense = item;
            const index = distinctInsight.findIndex(
                distinctItem => (moment.utc(distinctItem.purchaseDate).
                    startOf('day').
                    diff(moment.utc(expense.purchaseDate, moment.ISO_8601).
                            startOf('day'),
                        'days', true) === 0));
            if (index === -1) {
              distinctInsight.push({
                value: expense.value,
                month: monthArray[moment.utc(expense.purchaseDate,
                    moment.ISO_8601).month()],
                monthId: moment.utc(expense.purchaseDate, moment.ISO_8601).
                    month() + 1,
                purchaseDate: moment.utc(expense.purchaseDate, moment.ISO_8601),
                year: moment.utc(expense.purchaseDate, moment.ISO_8601).year(),
                week: weekAndDay(moment.utc(expense.purchaseDate,
                    moment.ISO_8601)).monthWeek,
                day: weekAndDay(
                    moment.utc(expense.purchaseDate, moment.ISO_8601)).day,
                tax: expense.taxes,
              });
            } else {
              distinctInsight[index].value += expense.value || 0;
              distinctInsight[index].tax += expense.taxes || 0;
            }

            return expense;
          });

          const distinctInsightTemp = distinctInsight.map((item) => {
            const dayItem = {
              value: item.value || 0,
              month: item.month,
              monthId: item.monthId,
              purchaseDate: item.purchaseDate,
              week: item.week,
              day: item.day,
              year: item.year,
              tax: item.tax || 0,
            };

            const weekItem = {
              value: item.value || 0,
              month: item.month,
              monthId: item.monthId,
              purchaseDate: item.purchaseDate,
              week: item.week,
              day: item.day,
              year: item.year,
              tax: item.tax || 0,
            };

            const monthItem = {
              value: item.value || 0,
              month: item.month,
              monthId: item.monthId,
              purchaseDate: item.purchaseDate,
              week: item.week,
              day: item.day,
              year: item.year,
              tax: item.tax || 0,
            };

            const yearItem = {
              value: item.value || 0,
              month: item.month,
              monthId: item.monthId,
              purchaseDate: item.purchaseDate,
              week: item.week,
              year: item.year,
              day: item.day,
              tax: item.tax || 0,
            };
            const monthIndex = distinctInsightMonthly.findIndex(
                distinctItem => (distinctItem.month === monthItem.month) &&
                    (distinctItem.year === monthItem.year));
            const weekIndex = distinctInsightWeekly.findIndex(
                distinctItem => (distinctItem.week === weekItem.week) &&
                    (distinctItem.month === weekItem.month) &&
                    (distinctItem.year === weekItem.year));
            const yearIndex = distinctInsightYearly.findIndex(
                distinctItem => (distinctItem.year === yearItem.year));
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

          const productListWeekly = productList.filter(
              item => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().startOf('month').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf()).map((item) => {
            item.purchaseDate = moment.utc(item.purchaseDate, moment.ISO_8601).
                startOf('days');
            return item;
          });
          const productListMonthly = productList.filter(
              item => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().startOf('year').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf()).map((item) => {
            item.purchaseDate = moment.utc(item.purchaseDate, moment.ISO_8601).
                startOf('days');
            return item;
          });

          const overallProductList = productList.filter(
              item => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() <=
                  moment.utc().valueOf()).map((item) => {
            item.purchaseDate = moment.utc(item.purchaseDate, moment.ISO_8601).
                startOf('days');
            return item;
          });

          distinctInsightMonthly.sort(
              (a, b) => moment.utc(b.purchaseDate) -
                  moment.utc(a.purchaseDate));
          distinctInsightWeekly.sort(
              (a, b) => moment.utc(b.purchaseDate) -
                  moment.utc(a.purchaseDate));
          distinctInsightYearly.sort(
              (a, b) => moment.utc(b.purchaseDate) -
                  moment.utc(a.purchaseDate));
          const insightData = shared.retrieveDaysInsight(
              distinctInsightTemp.filter(
                  item => moment.utc(item.purchaseDate, moment.ISO_8601).
                          valueOf() >=
                      moment.utc().subtract(6, 'd').startOf('day').valueOf() &&
                      moment.utc(item.purchaseDate, moment.ISO_8601).
                          valueOf() <=
                      moment.utc().valueOf()));
          insightData.sort(
              (a, b) => moment.utc(a.purchaseDate) -
                  moment.utc(b.purchaseDate));
          const insightWeekly = distinctInsightWeekly.filter(
              item => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().startOf('month').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf());
          const insightMonthly = distinctInsightMonthly.filter(
              item => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() >=
                  moment.utc().startOf('year').valueOf() &&
                  moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                  moment.utc().valueOf());
          const overallInsight = distinctInsightYearly.filter(
              item => moment.utc(item.purchaseDate, moment.ISO_8601).
                      valueOf() <=
                  moment.utc().valueOf());
          return {
            status: true,
            productList: productList.filter(
                item => moment.utc(item.purchaseDate, moment.ISO_8601).
                        valueOf() >=
                    moment.utc().subtract(6, 'd').startOf('day').valueOf() &&
                    moment.utc(item.purchaseDate, moment.ISO_8601).valueOf() <=
                    moment.utc().valueOf()),
            productListWeekly,
            productListMonthly,
            overallProductList,
            insight: distinctInsight && distinctInsight.length > 0 ? {
              categoryName: result[0].name,
              startDate: moment.utc().subtract(6, 'd').startOf('d'),
              endDate: moment.utc(),
              currentMonthId: moment.utc().month() + 1,
              currentWeek: weekAndDay(moment.utc()).monthWeek,
              currentDay: weekAndDay(moment.utc()).day,
              monthStartDate: moment.utc().startOf('month'),
              monthEndDate: moment.utc(),
              yearStartDate: moment.utc().startOf('year'),
              yearEndDate: moment.utc(),
              totalSpend: shared.sumProps(insightData, 'value'),
              totalYearlySpend: shared.sumProps(insightMonthly, 'value'),
              totalMonthlySpend: shared.sumProps(insightWeekly, 'value'),
              totalOverallSpend: shared.sumProps(overallInsight, 'value'),
              totalDays: insightData.length,
              insightData,
              insightWeekly,
              insightMonthly,
              overallInsight,
            } : {
              categoryName: result[0].name,
              startDate: moment.utc().subtract(6, 'd').startOf('d'),
              endDate: moment.utc(),
              currentMonthId: moment.utc().month() + 1,
              currentWeek: weekAndDay(moment.utc()).monthWeek,
              currentDay: weekAndDay(moment.utc()).day,
              monthStartDate: moment.utc().startOf('month'),
              monthEndDate: moment.utc(),
              yearStartDate: moment.utc().startOf('year'),
              yearEndDate: moment.utc(),
              totalSpend: 0.00,
              totalYearlySpend: 0.00,
              totalMonthlySpend: 0.00,
              totalDays: 0,
              insightData: [],
              insightWeekly: [],
              insightMonthly: [],
              overallInsight: [],
            },
            categoryName: result[0].name,
            forceUpdate: request.pre.forceUpdate,
          };
        }).
        catch((err) => {
          console.log(
              `Error on ${new Date()} for user ${user.id ||
              user.ID} is as follow: \n \n ${err}`);
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
              err,
            }),
          }).catch((ex) => console.log('error while logging on db,', ex));
          return {
            status: false,
            err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
  }
}

export default InsightAdaptor;
