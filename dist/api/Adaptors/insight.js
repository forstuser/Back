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
  const OtherCategory = categoryData.find(elem => elem.id === 9);

  const categoryDataWithoutOthers = categoryData.filter(elem => elem.id !== 9);

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

  async prepareInsightData(user, request) {
    let { min_date, max_date, for_lifetime, for_year, for_month } = request.query;
    for_month = for_month ? for_month - 1 : (0, _moment2.default)().month();
    for_lifetime = !!for_lifetime && for_lifetime.toLowerCase() === 'true';
    const for_month_date = [for_year || (0, _moment2.default)().year(), for_month, 1];
    const for_year_date = [for_year, 0, 1];
    min_date = (min_date ? (0, _moment2.default)(min_date, _moment2.default.ISO_8601).startOf('day') : for_year ? (0, _moment2.default)(for_year_date).startOf('year') : (0, _moment2.default)(for_month_date).startOf('month')).format();
    max_date = (max_date ? (0, _moment2.default)(max_date, _moment2.default.ISO_8601).endOf('day') : for_year ? (0, _moment2.default)(for_year_date).endOf('year') : (0, _moment2.default)(for_month_date).endOf('month')).format();
    try {
      const result = await this.prepareCategoryData(user, for_lifetime ? {} : { document_date: { $between: [min_date, max_date] } });
      let category_insight = for_lifetime ? result.map(item => {
        const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrBefore(_moment2.default.utc()));
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
      }) : result.map(item => {
        const expenses = item.expenses.filter(item => _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrAfter(_moment2.default.utc(min_date).utc().startOf('d')) && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrBefore(_moment2.default.utc(max_date).utc().endOf('d')));
        const totalAmount = _shared2.default.sumProps(expenses, 'value');
        const totalTax = _shared2.default.sumProps(expenses, 'taxes');
        return {
          id: item.id, cName: item.name,
          cURL: item.categoryInsightUrl,
          cImageURl: item.categoryImageUrl,
          totalAmount: parseFloat(totalAmount || 0).toFixed(2),
          totalTax: parseFloat(totalTax || 0).toFixed(2)
        };
      });

      category_insight = _lodash2.default.chain(category_insight).map(elem => {
        elem.totalAmount = parseFloat(elem.totalAmount);
        return elem;
      }).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(elem => {
        elem.totalAmount = elem.totalAmount.toString();
        return elem;
      }).value();

      const totalAmounts = _shared2.default.sumProps(category_insight, 'totalAmount');
      const totalTaxes = _shared2.default.sumProps(category_insight, 'totalTax');
      console.log(totalAmounts, totalTaxes);
      return {
        status: true,
        message: 'Insight restore successful',
        categoryData: category_insight,
        totalSpend: parseFloat(totalAmounts || 0).toFixed(2),
        totalTaxes: parseFloat(totalTaxes || 0).toFixed(2),
        startDate: min_date,
        endDate: max_date,
        forceUpdate: request.pre.forceUpdate
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
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return {
        status: false, message: 'Insight restore failed',
        err, forceUpdate: request.pre.forceUpdate
      };
    }
  }

  async prepareCategoryInsight(user, request) {
    const category_id = request.params.id;
    let { min_date, max_date, for_lifetime, for_year, for_month } = request.query;
    for_lifetime = !!for_lifetime && for_lifetime.toLowerCase() === 'true';
    for_month = for_month ? for_month - 1 : (0, _moment2.default)().month();
    const for_month_date = [for_year || (0, _moment2.default)().year(), for_month, 1];
    const for_year_date = [for_year, 0, 1];
    min_date = (min_date ? (0, _moment2.default)(min_date, _moment2.default.ISO_8601).startOf('day') : for_year ? (0, _moment2.default)(for_year_date).startOf('year') : (0, _moment2.default)(for_month_date).startOf('month')).format();
    max_date = (max_date ? (0, _moment2.default)(max_date, _moment2.default.ISO_8601).endOf('day') : for_year ? (0, _moment2.default)(for_year_date).endOf('year') : (0, _moment2.default)(for_month_date).endOf('month')).format();
    try {
      const [category] = await this.prepareCategoryData(user, JSON.parse(JSON.stringify({
        category_id, document_date: for_lifetime ? { $lte: (0, _moment2.default)() } : { $between: [min_date, max_date] }
      })));
      const productList = _lodash2.default.chain(category.expenses).filter(item => item.purchaseDate && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrBefore(_moment2.default.utc().valueOf())).orderBy(['purchaseDate'], ['desc']).value();
      return {
        status: true,
        productList: productList,
        categoryName: category.name,
        forceUpdate: request.pre.forceUpdate
      };
    } catch (err) {
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
    }
  }

  async prepareCategoryData(user, options, language) {
    const { document_date, category_id } = options;

    const categoryOption = { category_level: 1, status_type: 1, category_id };
    const productOptions = JSON.parse(JSON.stringify({
      status_type: [5, 11, 12], product_status_type: [5, 11],
      user_id: user.id || user.ID, document_date, main_category_id: category_id
    }));

    if (!category_id) {
      categoryOption.category_id = {
        $notIn: [10]
      };
    }

    let [categories, products, amcs, insurances, repairs, warranties, pucs] = await Promise.all([this.categoryAdaptor.retrieveCategories(JSON.parse(JSON.stringify(categoryOption)), false, language), this.productAdaptor.retrieveProducts(productOptions, language), this.amcAdaptor.retrieveAMCs(productOptions), this.insuranceAdaptor.retrieveInsurances(productOptions), this.repairAdaptor.retrieveRepairs(productOptions), this.warrantyAdaptor.retrieveWarranties(productOptions), this.pucAdaptor.retrievePUCs(productOptions)]);
    return categories.map(category => {
      products = _lodash2.default.chain(products).map(pItem => {
        pItem.dataIndex = 1;
        return pItem;
      }).filter(pItem => pItem.masterCategoryId === category.id);
      amcs = _lodash2.default.chain(amcs).map(amcItem => {
        amcItem.dataIndex = 2;
        return amcItem;
      }).filter(amcItem => amcItem.masterCategoryId === category.id);
      insurances = _lodash2.default.chain(insurances).map(insurance => {
        insurance.dataIndex = 3;
        return insurance;
      }).filter(insurance => insurance.masterCategoryId === category.id);
      repairs = _lodash2.default.chain(repairs).map(repair => {
        repair.dataIndex = 4;
        return repair;
      }).filter(repair => repair.masterCategoryId === category.id);
      warranties = _lodash2.default.chain(warranties).map(warranty => {
        warranty.dataIndex = 5;
        return warranty;
      }).filter(warranty => warranty.masterCategoryId === category.id);
      pucs = _lodash2.default.chain(pucs).map(puc => {
        puc.dataIndex = 6;
        return puc;
      }).filter(puc => puc.masterCategoryId === category.id);
      category.expenses = _lodash2.default.chain([...products, ...amcs, ...insurances, ...repairs, ...warranties, ...pucs] || []).sortBy(item => {
        return _moment2.default.utc(item.purchaseDate || item.updatedDate);
      }).reverse().value();

      return category;
    });
  }
}

exports.default = InsightAdaptor;