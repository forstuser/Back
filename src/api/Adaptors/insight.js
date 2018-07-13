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
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthStartDay = moment.utc().startOf('month');
const monthLastDay = moment.utc().endOf('month');
const yearStartDay = moment.utc().startOf('year');
const yearLastDay = moment.utc().startOf('year');

function customSortCategories(categoryData) {
  const OtherCategory = categoryData.find((elem) => elem.id === 9);

  const categoryDataWithoutOthers = categoryData.filter(
      (elem) => (elem.id !== 9));

  const newCategoryData = [];

  let pushed = false;

  categoryDataWithoutOthers.forEach((elem) => {
    if ((OtherCategory && elem) && (parseFloat(OtherCategory.totalAmount) >
        parseFloat(elem.totalAmount)) && !pushed) {
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

  async prepareInsightData(user, request) {
    let {min_date, max_date, for_lifetime, for_year, for_month} = request.query;
    let calc_month = for_month ? for_month - 1 : moment().month();
    for_lifetime = (!!for_lifetime && for_lifetime.toLowerCase() === 'true');
    const for_month_date = [for_year || moment().year(), calc_month, 1];
    const for_year_date = [for_year, 0, 1];
    min_date = (min_date ? moment(min_date, moment.ISO_8601).startOf('day') :
        for_year && !for_month ? moment(for_year_date).startOf('year') :
            moment(for_month_date).startOf('month')).format();
    max_date = (max_date ? moment(max_date, moment.ISO_8601).endOf('day') :
        for_year && !for_month ? moment(for_year_date).endOf('year') :
            moment(for_month_date).endOf('month')).format();
    try {
      const result = await this.prepareCategoryData(user, for_lifetime ?
          {} : {document_date: {$between: [min_date, max_date]}});

      let category_insight = result.map((item) => {
        const expenses = item.expenses.filter(
            (item) => for_lifetime ?
                moment.utc(item.purchaseDate, moment.ISO_8601).
                    isSameOrBefore(moment.utc()) :
                moment.utc(item.purchaseDate, moment.ISO_8601).
                    isSameOrAfter(moment.utc(min_date).startOf('d')) &&
                moment.utc(item.purchaseDate, moment.ISO_8601).
                    isSameOrBefore(moment.utc()));
        const totalAmount = shared.sumProps(expenses, 'value');
        const totalTax = shared.sumProps(expenses, 'taxes');
        return {
          id: item.id, cName: item.name,
          cURL: item.categoryInsightUrl,
          cImageURl: item.categoryImageUrl,
          totalAmount: parseFloat(totalAmount || 0).toFixed(2),
          totalTax: parseFloat(totalTax || 0).toFixed(2),
        };
      });
      category_insight = _.chain(
          category_insight.filter((elem) => (elem.id !== 9))).map((elem) => {
        elem.totalAmount = parseFloat(elem.totalAmount);
        return elem;
      }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map((elem) => {
        elem.totalAmount = elem.totalAmount.toString();
        return elem;
      }).value();

      const totalAmounts = shared.sumProps(category_insight,
          'totalAmount');
      const totalTaxes = shared.sumProps(category_insight,
          'totalTax');
      console.log(totalAmounts, totalTaxes);
      return {
        status: true,
        message: 'Insight restore successful',
        categoryData: category_insight,
        totalSpend: parseFloat(totalAmounts || 0).toFixed(2),
        totalTaxes: parseFloat(totalTaxes || 0).toFixed(2),
        startDate: min_date,
        endDate: max_date,
        forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      console.log(err);
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
        status: false, message: 'Insight restore failed',
        err, forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  async prepareCategoryInsight(user, request) {
    const category_id = request.params.id;
    let {min_date, max_date, for_lifetime, for_year, for_month} = request.query;
    for_lifetime = (!!for_lifetime && for_lifetime.toLowerCase() === 'true');
    let calc_month = for_month ? for_month - 1 : moment().month();
    const for_month_date = [for_year || moment().year(), calc_month, 1];
    const for_year_date = [for_year, 0, 1];
    min_date = (min_date ? moment(min_date, moment.ISO_8601).startOf('day') :
        for_year && !for_month ? moment(for_year_date).startOf('year') :
            moment(for_month_date).startOf('month')).format();
    max_date = (max_date ? moment(max_date, moment.ISO_8601).endOf('day') :
        for_year && !for_month ? moment(for_year_date).endOf('year') :
            moment(for_month_date).endOf('month')).format();
    try {
      const [category] = await this.prepareCategoryData(user,
          JSON.parse(JSON.stringify({
            category_id,
            document_date: for_lifetime ?
                {$lte: moment()} : {$between: [min_date, max_date]},
            ref_id: {
              $or: [{$not: null}, {$is: null}],
            },
          })));
      const productList = _.chain(category.expenses).
          filter((item) => (item.purchaseDate &&
              moment.utc(item.purchaseDate, moment.ISO_8601).
                  isSameOrBefore(moment.utc().valueOf()))).
          orderBy(['purchaseDate'], ['desc']).value();
      return {
        status: true,
        productList,
        categoryName: category.name,
        forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
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
    }
  }

  async prepareCategoryData(user, options, language) {
    const {document_date, category_id} = options;
    const categoryOption = {category_level: 1, status_type: 1, category_id};
    const productOptions = JSON.parse(JSON.stringify({
      status_type: [5, 11, 12], product_status_type: [5, 11],
      user_id: user.id || user.ID, document_date, main_category_id: category_id,
      ref_id: {$or: [{$not: null}, {$is: null}]},
    }));

    if (!category_id) {
      categoryOption.category_id = {$notIn: [9, 10]};
    }

    let [categories, products, amcs, insurances, repairs, warranties, pucs] = await Promise.all(
        [
          this.categoryAdaptor.retrieveCategories({
            options: JSON.parse(JSON.stringify(categoryOption)),
            isSubCategoryRequiredForAll: false,
            isBrandFormRequired: false, language,
          }), this.productAdaptor.retrieveProducts(productOptions, language),
          this.amcAdaptor.retrieveAMCs(productOptions),
          this.insuranceAdaptor.retrieveInsurances(productOptions),
          this.repairAdaptor.retrieveRepairs(productOptions),
          this.warrantyAdaptor.retrieveWarranties(productOptions),
          this.pucAdaptor.retrievePUCs(productOptions)]);

    products = products.map((pItem) => {
      pItem.dataIndex = 1;
      return pItem;
    });
    amcs = amcs.map((amcItem) => {
      amcItem.dataIndex = 2;
      return amcItem;
    });
    insurances = insurances.map((insurance) => {
      insurance.dataIndex = 3;
      return insurance;
    });
    repairs = repairs.map((repair) => {
      repair.dataIndex = 4;
      return repair;
    });
    warranties = warranties.map((warranty) => {
      warranty.dataIndex = 5;
      return warranty;
    });
    pucs = pucs.map((puc) => {
      puc.dataIndex = 6;
      return puc;
    });
    return categories.map((category) => {
      category.expenses = _.chain([
        ...products.filter((pItem) => pItem.masterCategoryId === category.id),
        ...amcs.filter((amcItem) => amcItem.masterCategoryId === category.id),
        ...insurances.filter(
            (insurance) => insurance.masterCategoryId === category.id),
        ...repairs.filter((repair) => repair.masterCategoryId === category.id),
        ...warranties.filter(
            (warranty) => warranty.masterCategoryId === category.id),
        ...pucs.filter((puc) => puc.masterCategoryId === category.id)] || []).
          sortBy((item) => moment.utc(item.purchaseDate || item.updatedDate)).
          reverse().value();

      return category;
    });
  }
}

export default InsightAdaptor;
