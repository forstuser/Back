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

function weekAndDay(d) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const prefixes = [1, 2, 3, 4, 5];

  return {monthWeek: prefixes[Math.round(d.date() / 7)], day: days[d.day()]};
}

const dateFormatString = 'yyyy-mm-dd';
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
const date = new Date();
const monthStartDay = new Date(date.getFullYear(), date.getMonth(), 1);
const monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
const yearStartDay = new Date(date.getFullYear(), 0, 1);
const yearLastDay = new Date(date.getFullYear() + 1, 0, 0);

function customSortCategories(categoryData) {
  const OtherCategory = categoryData.find((elem) => {
    return elem.cType === 9;
  });

  const categoryDataWithoutOthers = categoryData.filter((elem) => {
    return (elem.cType !== 9);
  });

  const newCategoryData = [];

  let pushed = false;

  categoryDataWithoutOthers.forEach((elem) => {
    if (parseFloat(OtherCategory.totalAmount) > parseFloat(elem.totalAmount) &&
        !pushed) {
      newCategoryData.push(OtherCategory);
      pushed = true;
    }
    newCategoryData.push(elem);
  });

  if (!pushed) {
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
  }

  prepareInsightData(user, request) {
    const minDate = request.query.mindate;
    const maxDate = request.query.maxdate;
    return this.prepareCategoryData(user, {}).then((result) => {
      const categoryData = !(minDate || maxDate) ? {
        weeklyData: result.map((item) => {
          const expenses = item.expenses.filter((item) => item.purchaseDate >=
              moment(moment.utc().subtract(6, 'd')).utc().startOf('d') &&
              item.purchaseDate <= moment.utc().endOf('d'));
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            cName: item.categoryName,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: (totalAmount ||
                0).toFixed(2),
            totalTax: (totalTax ||
                0).toFixed(2),
          };
        }),
        monthlyData: result.map((item) => {
          const expenses = item.expenses.filter((item) => item.purchaseDate >=
              moment().utc().startOf('month') &&
              item.purchaseDate <= moment.utc().endOf('month'));
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            cName: item.categoryName,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: (totalAmount ||
                0).toFixed(2),
            totalTax: (totalTax ||
                0).toFixed(2),
          };
        }),
        yearlyData: result.map((item) => {
          const expenses = item.expenses.filter((item) => item.purchaseDate >=
              moment().utc().startOf('year') &&
              item.purchaseDate <= moment.utc().endOf('year'));
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
            cName: item.categoryName,
            cURL: item.categoryInsightUrl,
            cImageURl: item.categoryImageUrl,
            totalAmount: (totalAmount ||
                0).toFixed(2),
            totalTax: (totalTax ||
                0).toFixed(2),
          };
        }),
      } : {
        customDateData: result.map((item) => {
          const expenses = item.expenses.filter((item) => item.purchaseDate >=
              moment(minDate).utc().startOf('d') &&
              item.purchaseDate <= moment(maxDate).utc().endOf('d'));
          const totalAmount = shared.sumProps(expenses,
              'value');
          const totalTax = shared.sumProps(expenses,
              'taxes');
          return {
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

      categoryData.weeklyData = customSortCategories(categoryData.weeklyData,
          'totalAmount');
      categoryData.monthlyData = customSortCategories(categoryData.monthlyData,
          'totalAmount');
      categoryData.yearlyData = customSortCategories(categoryData.yearlyData,
          'totalAmount');

      const totalWeeklyAmounts = shared.sumProps(categoryData.weeklyData,
          'totalAmount');
      const totalWeeklyTaxes = shared.sumProps(categoryData.weeklyData,
          'totalTax');
      const totalYearlyAmounts = shared.sumProps(categoryData.yearlyData,
          'totalAmount');
      const totalYearlyTaxes = shared.sumProps(categoryData.yearlyData,
          'totalTax');
      const totalMonthlyAmounts = shared.sumProps(categoryData.monthlyData,
          'totalAmount');
      const totalMonthlyTaxes = shared.sumProps(categoryData.monthlyData,
          'totalTax');
      return {
        status: true,
        message: 'Insight restore successful',
        categoryData,
        weekStartDate: shared.formatDate(
            moment.utc().subtract(6, 'd').startOf('d'), dateFormatString),
        monthStartDate: shared.formatDate(monthStartDay, dateFormatString),
        weekEndDate: shared.formatDate(moment.utc(), dateFormatString),
        monthLastDate: shared.formatDate(monthLastDay, dateFormatString),
        yearStartDate: shared.formatDate(yearStartDay, dateFormatString),
        yearEndDate: shared.formatDate(yearLastDay, dateFormatString),
        totalYearlySpend: (totalYearlyAmounts ||
            0).toFixed(2),
        totalWeeklySpend: (totalWeeklyAmounts ||
            0).toFixed(2),
        totalWeeklyTaxes: (totalWeeklyTaxes ||
            0).toFixed(2),
        totalYearlyTaxes: (totalYearlyTaxes ||
            0).toFixed(2),
        totalMonthlySpend: (totalMonthlyAmounts ||
            0).toFixed(2),
        totalMonthlyTaxes: (totalMonthlyTaxes ||
            0).toFixed(2),
        forceUpdate: request.pre.forceUpdate,
      };
    }).catch(err => {
      console.log({API_Logs: err});
      return ({
        status: false,
        message: 'Insight restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      });
    });
  }

  prepareCategoryData(user, options) {
    const categoryOption = {
      category_level: 1,
      status_type: 1,
    };

    const productOptions = {
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
        then((results) => {
          return results[0].map((categoryItem) => {
            const category = categoryItem.toJSON();
            const products = _.chain(results[1]).
                map((productItem) => {
                  const product = productItem.toJSON();
                  product.dataIndex = 1;
                  return product;
                }).
                filter(
                    (productItem) => productItem.masterCategoryId ===
                        category.id);
            const amcs = _.chain(results[2]).
                map((amcItem) => {
                  const amc = amcItem.toJSON();
                  amc.dataIndex = 2;
                  return amc;
                }).
                filter(
                    (amcItem) => amcItem.masterCategoryId === category.id);
            const insurances = _.chain(results[3]).
                map((insuranceItem) => {
                  const insurance = insuranceItem.toJSON();
                  insurance.dataIndex = 3;
                  return insurance;
                }).
                filter(
                    (insuranceItem) => insuranceItem.masterCategoryId ===
                        category.id);
            const repairs = _.chain(results[4]).
                map((repairItem) => {
                  const repair = repairItem.toJSON();
                  repair.dataIndex = 4;
                  return repair;
                }).
                filter(
                    (repairItem) => repairItem.masterCategoryId ===
                        category.id);
            const warranties = _.chain(results[5]).
                map((warrantyItem) => {
                  const warranty = warrantyItem.toJSON();
                  warranty.dataIndex = 5;
                  return warranty;
                }).
                filter(
                    (warrantyItem) => warrantyItem.masterCategoryId ===
                        category.id);
            category.products = products;
            category.amcs = amcs;
            category.insurances = insurances;
            category.repairs = repairs;
            category.warranties = warranties;
            category.expenses = [
              ...products,
              ...amcs,
              ...insurances,
              ...repairs,
              ...warranties];

            return category;
          });
        });
  }

  prepareCategoryInsight(user, request) {
    const masterCategoryId = request.params.id;
    return this.prepareCategoryData(user, {category_id: masterCategoryId}).
        then((result) => {
          const distinctInsightWeekly = [];
          const distinctInsightMonthly = [];
          const distinctInsight = [];
          result.expenses.map((item) => {
            const expense = item.orderBy(['purchaseDate'], ['asc']);
            const index = distinctInsight.findIndex(
                distinctItem => (moment(distinctItem.date).valueOf() ===
                    moment(expense.purchaseDate).valueOf()));
            if (index === -1) {
              distinctInsight.push({
                value: expense.value,
                month: monthArray[moment(expense.purchaseDate).
                    month()],
                monthId: moment(expense.purchaseDate).month() + 1,
                purchaseDate: moment(expense.purchaseDate),
                week: weekAndDay(
                    moment(expense.purchaseDate)).monthWeek,
                day: weekAndDay(moment(expense.purchaseDate)).day,
                tax: expense.taxes,
              });
            } else {
              distinctInsight[index].value += expense.value;
              distinctInsight[index].tax += expense.taxes;
            }

            return expense;
          });

          const distinctInsightTemp = distinctInsight.map((item) => {
            const dayItem = {
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

            const monthItem = {
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
            const monthIndex = distinctInsightMonthly.findIndex(
                distinctItem => (distinctItem.month === item.month));
            const weekIndex = distinctInsightWeekly.findIndex(
                distinctItem => (distinctItem.week === item.week));
            if (weekIndex !== -1 && monthIndex !== -1) {
              const currentWeekInsight = distinctInsightWeekly[weekIndex];
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
              const currentMonthInsight = distinctInsightMonthly[monthIndex];
              currentMonthInsight.value += monthItem.value;
              currentMonthInsight.totalCost += monthItem.totalCost;
              currentMonthInsight.totalTax += monthItem.totalTax;
              currentMonthInsight.tax += monthItem.tax;
            }

            return dayItem;
          });

          const productList = result.expenses.orderBy(['purchaseDate'],
              ['asc']);
          productList.sort(
              (a, b) => moment(b.purchaseDate) - moment(a.purchaseDate));
          const productListWeekly = productList.filter(
              item => moment(item.purchaseDate).valueOf() >=
                  moment.utc().startOf('month').valueOf() &&
                  moment(item.purchaseDate).valueOf() <=
                  moment.utc().valueOf()).
              slice(0, 10);
          const productListMonthly = productList.filter(
              item => moment(item.purchaseDate).valueOf() >=
                  moment(moment.utc().startOf('year').valueOf()) &&
                  moment(item.purchaseDate).valueOf() <=
                  moment(moment.utc()).valueOf()).slice(0, 10);
          distinctInsightMonthly.sort(
              (a, b) => moment(b.purchaseDate) - moment(a.purchaseDate));
          distinctInsightWeekly.sort(
              (a, b) => moment(b.purchaseDate) - moment(a.purchaseDate));

          const insightData = shared.retrieveDaysInsight(
              distinctInsightTemp.filter(
                  item => moment(item.purchaseDate).valueOf() >=
                      moment.utc().subtract(6, 'd').startOf('d').valueOf() &&
                      moment(item.purchaseDate).valueOf() <=
                      moment.utc().valueOf()));
          insightData.sort(
              (a, b) => moment(a.purchaseDate) - moment(b.purchaseDate));

          const insightWeekly = distinctInsightWeekly.filter(
              item => moment(item.purchaseDate).valueOf() >=
                  moment.utc().startOf('month').valueOf() &&
                  moment(item.purchaseDate).valueOf() <=
                  moment.utc().valueOf());
          const insightMonthly = distinctInsightMonthly.filter(
              item => moment(item.purchaseDate).valueOf() >=
                  moment.utc().startOf('year').valueOf() &&
                  moment(item.purchaseDate).valueOf() <=
                  moment.utc().valueOf());
          return {
            status: true,
            productList: productList.filter(
                item => moment(item.purchaseDate).valueOf() >=
                    moment.utc().subtract(6, 'd').startOf('d').valueOf() &&
                    moment(item.purchaseDate).valueOf() <=
                    moment.utc().valueOf()).
                slice(0, 10),
            productListWeekly,
            productListMonthly,
            insight: distinctInsight && distinctInsight.length > 0 ? {
              categoryName: result[1].name,
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
              totalDays: insightData.length,
              insightData,
              insightWeekly,
              insightMonthly,
            } : {
              startDate: moment.utc().subtract(6, 'd').startOf('d'),
              endDate: moment.utc(),
              totalSpend: 0,
              totalDays: 0,
              insightData: distinctInsight,
            },
            categoryName: result.name,
            forceUpdate: request.pre.forceUpdate,
          };
        }).
        catch((err) => {
          console.log({API_Logs: err});
          return {
            status: false,
            err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
  }

  fetchProductDetails(user, masterCategoryId) {
    const whereClause = {
      user_id: user.ID,
      status_id: {
        $ne: 3,
      },
      master_category_id: masterCategoryId,
    };
    const dateWhereClause = {
      $gte: moment.utc().startOf('year'),
      $lte: moment.utc(),
    };
    return this.modals.productBills.findAll({
      where: whereClause,
      include: [
        {
          model: this.modals.consumerBillDetails,
          as: 'consumerBill',
          where: {
            status_id: {
              $ne: 3,
            },
            purchase_date: dateWhereClause,
          },
          attributes: [
            [
              'invoice_number',
              'invoiceNo'],
            [
              'total_purchase_value',
              'totalCost'],
            'taxes',
            [
              'purchase_date',
              'purchaseDate']],
          include: [
            {
              model: this.modals.billDetailCopies,
              as: 'billDetailCopies',
              include: [
                {
                  model: this.modals.billCopies,
                  as: 'billCopies',
                  attributes: [],
                }],
              attributes: [
                [
                  'bill_copy_id',
                  'billCopyId'],
                [
                  this.modals.sequelize.literal(
                      '`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`'),
                  'billCopyType'],
                [
                  this.modals.sequelize.fn('CONCAT', 'bills/',
                      this.modals.sequelize.col(
                          '`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'),
                      '/files'),
                  'fileUrl']],
            },
            {
              model: this.modals.consumerBills,
              as: 'bill',
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col(
                      '`consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                  {
                    user_status: 5,
                    admin_status: 5,
                  },
                ],
              },
              attributes: [],
            },
            {
              model: this.modals.offlineSeller,
              as: 'productOfflineSeller',
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col(
                      '`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'),
                      2)],
              },
              attributes: [
                'ID',
                [
                  'offline_seller_name',
                  'sellerName'],
                [
                  'seller_url',
                  'url']],
              required: false,
            },
            {
              model: this.modals.onlineSeller,
              as: 'productOnlineSeller',
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col(
                      '`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'),
                      1)],
              },
              attributes: [
                'ID',
                [
                  'seller_name',
                  'sellerName'],
                [
                  'seller_url',
                  'url']],
              required: false,
            }],
          required: true,
        },
        {
          model: this.modals.table_brands,
          as: 'brand',
          attributes: [
            [
              'brand_name',
              'name'],
            [
              'brand_description',
              'description'],
            [
              'brand_id',
              'id']],
          required: false,
        },
        {
          model: this.modals.table_color,
          as: 'color',
          attributes: [['color_name', 'name'], ['color_id', 'id']],
          required: false,
        },
        {
          model: this.modals.amcBills,
          as: 'amcDetails',
          attributes: [
            [
              'bill_amc_id',
              'id'],
            'policyNo',
            'premiumType',
            'premiumAmount',
            'effectiveDate',
            'expiryDate'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3,
            },
            expiryDate: {
              $gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
            },
          },
          required: false,
        },
        {
          model: this.modals.insuranceBills,
          as: 'insuranceDetails',
          attributes: [
            [
              'bill_insurance_id',
              'id'],
            'policyNo',
            'premiumType',
            'premiumAmount',
            'effectiveDate',
            'expiryDate',
            'amountInsured',
            'plan'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3,
            },
            expiryDate: {
              $gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
            },
          },
          required: false,
        },
        {
          model: this.modals.warranty,
          as: 'warrantyDetails',
          attributes: [
            [
              'bill_warranty_id',
              'id'],
            'warrantyType',
            'policyNo',
            'premiumType',
            'premiumAmount',
            'effectiveDate',
            'expiryDate'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3,
            },
            expiryDate: {
              $gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
            },
          },
          required: false,
        },
        {
          model: this.modals.productMetaData,
          as: 'productMetaData',
          attributes: [
            [
              'form_element_value',
              'value'],
            [
              this.modals.sequelize.fn('upper', this.modals.sequelize.col(
                  '`productMetaData->categoryForm`.`form_element_type`')),
              'type'],
            [
              this.modals.sequelize.fn('upper', this.modals.sequelize.col(
                  '`productMetaData->categoryForm`.`form_element_name`')),
              'name']],
          include: [
            {
              model: this.modals.categoryForm,
              as: 'categoryForm',
              attributes: [],
            },
            {
              model: this.modals.categoryFormMapping,
              as: 'selectedValue',
              on: {
                $or: [
                  this.modals.sequelize.where(this.modals.sequelize.col(
                      '`productMetaData`.`category_form_id`'),
                      this.modals.sequelize.col(
                          '`productMetaData->categoryForm`.`category_form_id`')),
                ],
              },
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col(
                      '`productMetaData`.`form_element_value`'),
                      this.modals.sequelize.col(
                          '`productMetaData->selectedValue`.`mapping_id`')),
                  this.modals.sequelize.where(this.modals.sequelize.col(
                      '`productMetaData->categoryForm`.`form_element_type`'),
                      2)],
              },
              attributes: [['dropdown_name', 'value']],
              required: false,
            }],
          required: false,
        }, {
          model: this.modals.categories,
          as: 'masterCategory',
          attributes: [],
        }, {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
        }],
      attributes: [
        [
          'bill_product_id',
          'id'],
        [
          'product_name',
          'productName'],
        [
          'value_of_purchase',
          'value'],
        'taxes',
        [
          'category_id',
          'categoryId'],
        [
          'master_category_id',
          'masterCategoryId'],
        [
          this.modals.sequelize.col('`masterCategory`.`category_name`'),
          'masterCategoryName'],
        [
          this.modals.sequelize.col('`category`.`category_name`'),
          'categoryName'],
        [
          this.modals.sequelize.fn('CONCAT', 'categories/',
              this.modals.sequelize.col(`category.category_id`), '/image/'),
          'cImageURL'],
        [
          'brand_id',
          'brandId'],
        [
          'color_id',
          'colorId'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.col('`productBills`.`bill_product_id`')),
          'productURL']],
      order: [['bill_product_id', 'DESC']],
    });
  }
}

export default InsightAdaptor;
