'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import ProductAdapter from './product';

class AccessoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    // this.productAdapter = ProductAdapter(modals);
  }

  getAccessoriesList(options) {
    const { user_id, queryOptions } = options;
    console.log(queryOptions);
    return _bluebird2.default.try(() => this.retrieveProducts({
      where: {
        user_id,
        status_type: [5, 11]
      },
      attributes: ['brand_id', 'main_category_id', 'category_id', 'product_name', 'id']
    })).then(products => {
      //get the category IDs
      const categoryIds = products.map(item => item.category_id);

      const accessoryOptions = {
        category_id: categoryIds
      };

      const categoryNameOptions = {
        category_id: categoryIds
      };

      if (queryOptions.categoryid) {
        accessoryOptions.category_id = queryOptions.categoryid;
        categoryNameOptions.category_id = queryOptions.categoryid;
      } else {
        accessoryOptions.priority = {
          $between: [1, 6]
        };
      }

      return _bluebird2.default.all([this.retrieveAccessoryCategories({
        where: accessoryOptions,
        attributes: ['id', 'title', 'category_id'],
        order: [['priority']]
      }), this.retrieveCategoryNames({
        where: categoryNameOptions,
        attributes: ['category_id', 'category_name']
      })]);
    }).spread((accessoryCategories, categoryNames) => {
      console.log(JSON.stringify({ accessoryCategories, categoryNames }));
      const productOptions = {
        accessory_id: accessoryCategories.map(item => item.id)
      };

      if (!queryOptions.bbclass) {
        productOptions.bb_class = 2;
      } else {
        productOptions.bb_class = queryOptions.bbclass;
      }

      return _bluebird2.default.all([accessoryCategories, this.retrieveAccessoryProducts({
        where: productOptions
      }), categoryNames]);
    }).spread((accessoryCategories, accessoryProducts, categoryNames) => {

      accessoryCategories = accessoryCategories.map(item => {
        item.accessory_items = accessoryProducts.filter(apItem => apItem.accessory_id === item.id);
        return item;
      });

      return categoryNames.map(item => {
        item.accessories = accessoryCategories.filter(acItem => acItem.category_id === item.category_id);
        return item;
      }).filter(item => item.accessories.length > 0);
    });
  }

  getOrderHistory(options) {

    return _bluebird2.default.try(() => this.retrieveTransactions({
      where: {
        created_by: options.user_id
      },
      order: [['updated_at', 'desc']]
    })).then(transactions => {
      const accessory_product_ids = transactions.map(transaction => transaction.accessory_product_id);
      const product_ids = transactions.map(transaction => transaction.product_id);
      const payment_mode_ids = transactions.map(transaction => transaction.payment_mode_id);
      return _bluebird2.default.all([
      // these transactions have the accessory product id
      // get the accessory products using that
      this.retrieveAccessoryProducts({
        where: {
          id: accessory_product_ids
        }
      }),
      // they also have product id
      // get the consumer product using that
      this.retrieveProducts({
        where: {
          id: product_ids
        }
      }),
      // payment mode is also there.
      // add the payment mode in the result of each transactions well.
      this.retrievePaymentMode({
        where: {
          id: payment_mode_ids
        }
      }), transactions]);
    }).spread((accessoryProducts, products, paymentModes, transactions) => transactions.map(item => {
      item.accessory_product = accessoryProducts.find(pmItem => pmItem.id === item.accessory_product_id);
      item.product = products.find(pmItem => pmItem.id === item.product_id);
      item.payment_mode = paymentModes.find(pmItem => pmItem.id === item.payment_mode_id);
      return item;
    }));
  }

  retrieveProducts(options) {
    return this.modals.products.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveAccessoryCategories(options) {
    return this.modals.table_accessory_categories.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveCategoryNames(options) {
    return this.modals.categories.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveAccessoryProducts(options) {
    return this.modals.table_accessory_products.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveTransactions(options) {
    return this.modals.table_transaction.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrievePaymentMode(options) {
    return this.modals.table_payment_mode.findAll(options).then(result => result.map(item => item.toJSON()));
  }
}
exports.default = AccessoryAdaptor;