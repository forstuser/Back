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

var _refueling = require('./refueling');

var _refueling2 = _interopRequireDefault(_refueling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    this.refuelingAdaptor = new _refueling2.default(modals);
  }

  async prepareInsightData(user, request) {
    let { min_date, max_date, for_lifetime, for_year, for_month } = request.query;
    let calc_month = for_month ? for_month - 1 : (0, _moment2.default)().month();
    for_lifetime = !!for_lifetime && for_lifetime.toLowerCase() === 'true';
    const for_month_date = [for_year || (0, _moment2.default)().year(), calc_month, 1];
    const for_year_date = [for_year, 0, 1];
    min_date = (min_date ? (0, _moment2.default)(min_date, _moment2.default.ISO_8601).startOf('day') : for_year && !for_month ? (0, _moment2.default)(for_year_date).startOf('year') : (0, _moment2.default)(for_month_date).startOf('month')).format();
    max_date = (max_date ? (0, _moment2.default)(max_date, _moment2.default.ISO_8601).endOf('day') : for_year && !for_month ? (0, _moment2.default)(for_year_date).endOf('year') : (0, _moment2.default)(for_month_date).endOf('month')).format();
    try {
      const result = await this.prepareCategoryData(user, for_lifetime ? {} : { document_date: { $between: [min_date, max_date] } });

      let category_insight = result.map(item => {
        const expenses = item.expenses.filter(item => for_lifetime ? _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrBefore(_moment2.default.utc()) : _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrAfter(_moment2.default.utc(min_date).startOf('d')) && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrBefore(_moment2.default.utc()));
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
      category_insight = _lodash2.default.chain(category_insight.filter(elem => elem.id !== 9)).map(elem => {
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
    let calc_month = for_month ? for_month - 1 : (0, _moment2.default)().month();
    const for_month_date = [for_year || (0, _moment2.default)().year(), calc_month, 1];
    const for_year_date = [for_year, 0, 1];
    min_date = (min_date ? (0, _moment2.default)(min_date, _moment2.default.ISO_8601).startOf('day') : for_year && !for_month ? (0, _moment2.default)(for_year_date).startOf('year') : (0, _moment2.default)(for_month_date).startOf('month')).format();
    max_date = (max_date ? (0, _moment2.default)(max_date, _moment2.default.ISO_8601).endOf('day') : for_year && !for_month ? (0, _moment2.default)(for_year_date).endOf('year') : (0, _moment2.default)(for_month_date).endOf('month')).format();
    try {
      const [category] = await this.prepareCategoryData(user, JSON.parse(JSON.stringify({
        category_id, document_date: for_lifetime ? { $lte: (0, _moment2.default)() } : { $between: [min_date, max_date] },
        ref_id: { $or: [{ $not: null }, { $is: null }] }
      })));
      const productList = _lodash2.default.chain(category.expenses).filter(item => item.purchaseDate && _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601).isSameOrBefore(_moment2.default.utc().valueOf())).orderBy(['purchaseDate'], ['desc']).value();
      return {
        status: true, productList,
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
      user_id: user.id || user.ID, document_date, main_category_id: category_id,
      ref_id: { $or: [{ $not: null }, { $is: null }] }
    }));

    if (!category_id) {
      categoryOption.category_id = { $notIn: [9, 10] };
    }

    let [categories, products, amcs, insurances, repairs, warranties, pucs, fuel_expenses] = await Promise.all([this.categoryAdaptor.retrieveCategories({
      options: JSON.parse(JSON.stringify(categoryOption)),
      isSubCategoryRequiredForAll: false,
      isBrandFormRequired: false, language
    }), this.productAdaptor.retrieveProducts(productOptions, language), this.amcAdaptor.retrieveAMCs(productOptions), this.insuranceAdaptor.retrieveInsurances(productOptions), this.repairAdaptor.retrieveRepairs(productOptions), this.warrantyAdaptor.retrieveWarranties(productOptions), this.pucAdaptor.retrievePUCs(productOptions), this.refuelingAdaptor.retrieveRefueling(productOptions)]);

    products = products.map(pItem => {
      pItem.dataIndex = 1;
      return pItem;
    });
    amcs = amcs.map(amcItem => {
      amcItem.dataIndex = 2;
      return amcItem;
    });
    insurances = insurances.map(insurance => {
      insurance.dataIndex = 3;
      return insurance;
    });
    repairs = repairs.map(repair => {
      repair.dataIndex = 4;
      return repair;
    });
    warranties = warranties.map(warranty => {
      warranty.dataIndex = 5;
      return warranty;
    });
    pucs = pucs.map(puc => {
      puc.dataIndex = 6;
      return puc;
    });
    fuel_expenses = fuel_expenses.map(fuel_expense => {
      fuel_expense.dataIndex = 7;
      fuel_expense.purchaseDate = fuel_expense.document_date;
      fuel_expense.masterCategoryId = fuel_expense.main_category_id;
      return fuel_expense;
    });
    return categories.map(category => {
      category.expenses = _lodash2.default.chain([...products.filter(pItem => pItem.masterCategoryId === category.id), ...amcs.filter(amcItem => amcItem.masterCategoryId === category.id), ...insurances.filter(insurance => insurance.masterCategoryId === category.id), ...repairs.filter(repair => repair.masterCategoryId === category.id), ...warranties.filter(warranty => warranty.masterCategoryId === category.id), ...pucs.filter(puc => puc.masterCategoryId === category.id), ...fuel_expenses.filter(fuel_expense => fuel_expense.main_category_id === category.id)] || []).sortBy(item => _moment2.default.utc(item.purchaseDate || item.document_date || item.updatedDate)).reverse().value();

      return category;
    });
  }
}

exports.default = InsightAdaptor;