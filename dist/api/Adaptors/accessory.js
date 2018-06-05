'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _sellers = require('./sellers');

var _sellers2 = _interopRequireDefault(_sellers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AccessoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdapter = new _product2.default(modals);
    this.sellerAdapter = new _sellers2.default(modals);
  }

  async getAccessoryCategories(options) {
    const { user_id, queryOptions } = options;
    const accessoryCategories = await this.retrieveAccessoryCategories({
      where: { status_type: 1 },
      attributes: ['category_id'],
      order: [['priority']]
    });

    const [categories, products] = await _bluebird2.default.all([this.retrieveCategoryNames({
      where: {
        category_id: accessoryCategories.map(item => item.category_id)
      },
      attributes: ['category_id', 'category_name']
    }), this.retrieveProducts({
      where: {
        user_id,
        status_type: [5, 11],
        category_id: accessoryCategories.map(item => item.category_id)
      },
      attributes: ['brand_id', 'main_category_id', 'category_id', 'product_name', 'id']
    })]);

    return categories.map(item => {
      item.products = products.filter(productItem => productItem.category_id === item.category_id);
      return item;
    });
  }

  async getAccessoriesList(options) {
    const { user_id, queryOptions } = options;
    console.log(queryOptions);
    const productOptions = {
      user_id,
      status_type: [5, 11]
    };

    let { categoryid, bbclass } = queryOptions;
    const accessoryOptions = {};
    const categoryNameOptions = {};
    let [accessoryCategories, categories, products] = await this.retrieveAccessoryCategoryProducts({
      categoryid,
      productOptions,
      accessoryOptions,
      categoryNameOptions
    });
    const accessoryProductOptions = {
      accessory_id: accessoryCategories.map(item => item.id),
      bb_class: 2
    };

    if (bbclass) {
      accessoryProductOptions.bb_class = bbclass;
    }

    const accessoryProducts = await this.retrieveAccessoryProducts({
      where: accessoryProductOptions
    });
    accessoryCategories = accessoryCategories.map(item => {
      item.accessory_items = accessoryProducts.filter(apItem => apItem.accessory_id === item.id);
      return item;
    });
    return categories.map(item => {
      item.accessories = accessoryCategories.filter(acItem => acItem.category_id === item.category_id);
      item.products = products;
      return item;
    }).filter(item => item.accessories.length > 0);
  }

  async retrieveAccessoryCategoryProducts(parameters) {
    let { categoryid, productOptions, accessoryOptions, categoryNameOptions } = parameters;
    if (categoryid) {
      productOptions.category_id = categoryid;
      accessoryOptions.category_id = categoryid;
      categoryNameOptions.category_id = categoryid;
      return await _bluebird2.default.all([this.retrieveAccessoryCategories({
        where: accessoryOptions,
        attributes: ['id', 'title', 'category_id'],
        order: [['priority']]
      }), this.retrieveCategoryNames({
        where: categoryNameOptions,
        attributes: ['category_id', 'category_name']
      }), this.retrieveProducts({
        where: productOptions,
        attributes: ['brand_id', 'main_category_id', 'category_id', 'product_name', 'id']
      })]);
    } else {
      const products = await this.retrieveProducts({
        where: productOptions,
        attributes: ['brand_id', 'main_category_id', 'category_id', 'product_name', 'id']
      });
      const categoryIds = products.map(item => item.category_id);
      accessoryOptions.category_id = categoryIds;
      categoryNameOptions.category_id = categoryIds;
      accessoryOptions.priority = {
        $between: [1, 6]
      };
      return await _bluebird2.default.all([this.retrieveAccessoryCategories({
        where: accessoryOptions,
        attributes: ['id', 'title', 'category_id'],
        order: [['priority']]
      }), this.retrieveCategoryNames({
        where: categoryNameOptions,
        attributes: ['category_id', 'category_name']
      }), products]);
    }
  }

  async getOrderHistory(options) {

    const transactions = await this.retrieveTransactions({
      where: {
        created_by: options.user_id
      },
      order: [['updated_at', 'desc']]
    });
    const accessory_product_ids = transactions.map(transaction => transaction.accessory_product_id);
    const product_ids = transactions.map(transaction => transaction.product_id);
    const payment_mode_ids = transactions.map(transaction => transaction.payment_mode_id);
    const [accessoryProducts, products, paymentModes] = await _bluebird2.default.all([
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
    })]);

    return transactions.map(item => {
      item.accessory_product = accessoryProducts.find(pmItem => pmItem.id === item.accessory_product_id);
      item.product = products.find(pmItem => pmItem.id === item.product_id);
      item.payment_mode = paymentModes.find(pmItem => pmItem.id === item.payment_mode_id);
      return item;
    });
  }

  async createTransaction(options) {
    // find create find seller
    // create the transaction
    // create product and reference it to existing product

    const seller = await this.sellerAdapter.retrieveOrCreateOfflineSellers({
      'seller_name': options.seller_detail.name,
      'address': options.seller_detail.address,
      'contact_no': options.seller_detail.phone
    }, {
      'seller_name': options.seller_detail.name,
      'address': options.seller_detail.address,
      'contact_no': options.seller_detail.phone
    });

    let [result, parentProduct, accessoryProduct] = await _bluebird2.default.all([this.addTransaction({
      'amount_paid': options.price,
      'accessory_product_id': options.accessory_product_id,
      'delivery_address': options.delivery_address,
      'details_url': options.details_url,
      'estimated_delivery_date': options.delivery_date,
      'online_seller_id': options.online_seller_id,
      'payment_mode_id': options.payment_mode,
      'product_id': options.product_id,
      'quantity': options.quantity,
      'seller_id': seller.id,
      'status_type': options.status_type,
      'transaction_id': options.transaction_id
    }), this.modals.products.findOne({
      where: {
        'id': options.product_id
      }
    }), this.modals.table_accessory_products.findOne({
      where: {
        id: options.accessory_product_id
      }
    })]);

    parentProduct = parentProduct.toJSON();
    accessoryProduct = accessoryProduct.toJSON();
    return await _bluebird2.default.all([result, this.productAdapter.createEmptyProduct({
      'accessory_id': options.accessory_product_id,
      'category_id': parentProduct.category_id,
      'ref_id': options.product_id,
      'product_name': accessoryProduct.title,
      'purchase_cost': options.price,
      'seller_id': result.id,
      'user_id': options.user_id,
      'job_id': parentProduct.job_id,
      'main_category_id': parentProduct.main_category_id,
      'status_type': 11
    })]);
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

  addTransaction(options) {
    return this.modals.table_transaction.create(options).then(result => result.toJSON());
  }

}
exports.default = AccessoryAdaptor;