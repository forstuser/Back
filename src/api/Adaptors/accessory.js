import Promise from 'bluebird';
import ProductAdapter from './product';
import SellerAdapter from './sellers';

export default class AccessoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdapter = new ProductAdapter(modals);
    this.sellerAdapter = new SellerAdapter(modals);
  }

  getAccessoriesList(options) {
    const {user_id, queryOptions} = options;
    console.log(queryOptions);
    return Promise.try(() => this.retrieveProducts({
      where: {
        user_id,
        status_type: [5, 11],
      },
      attributes: [
        'brand_id',
        'main_category_id',
        'category_id',
        'product_name',
        'id',
      ],
    })).then((products) => {
      //get the category IDs
      const categoryIds = products.map((item) => item.category_id);

      const accessoryOptions = {
        category_id: categoryIds,
      };

      const categoryNameOptions = {
        category_id: categoryIds,
      };

      if (queryOptions.categoryid) {
        accessoryOptions.category_id = queryOptions.categoryid;
        categoryNameOptions.category_id = queryOptions.categoryid;
      } else {
        accessoryOptions.priority = {
          $between: [1, 6],
        };
      }

      return Promise.all([
        this.retrieveAccessoryCategories({
          where: accessoryOptions,
          attributes: ['id', 'title', 'category_id'],
          order: [['priority']],
        }),
        this.retrieveCategoryNames({
          where: categoryNameOptions,
          attributes: ['category_id', 'category_name'],
        })]);
    }).spread((accessoryCategories, categoryNames) => {
      console.log(JSON.stringify({accessoryCategories, categoryNames}));
      const productOptions = {
        accessory_id: accessoryCategories.map(item => item.id),
      };

      if (!queryOptions.bbclass) {
        productOptions.bb_class = 2;
      } else {
        productOptions.bb_class = queryOptions.bbclass;
      }

      return Promise.all([
        accessoryCategories, this.retrieveAccessoryProducts({
          where: productOptions,
        }), categoryNames]);

    }).spread((accessoryCategories, accessoryProducts, categoryNames) => {

      accessoryCategories = accessoryCategories.map((item) => {
        item.accessory_items = accessoryProducts.filter(
            apItem => apItem.accessory_id === item.id);
        return item;
      });

      return categoryNames.map(item => {
        item.accessories = accessoryCategories.filter(
            acItem => acItem.category_id === item.category_id);
        return item;
      }).filter((item) => item.accessories.length > 0);

    });
  }

  getOrderHistory(options) {

    return Promise.try(() => this.retrieveTransactions({
          where: {
            created_by: options.user_id,
          },
          order: [['updated_at', 'desc']],
        }),
    ).
        then((transactions) => {
          const accessory_product_ids = transactions.map(
              transaction => transaction.accessory_product_id);
          const product_ids = transactions.map(
              transaction => transaction.product_id);
          const payment_mode_ids = transactions.map(
              transaction => transaction.payment_mode_id);
          return Promise.all([
            // these transactions have the accessory product id
            // get the accessory products using that
            this.retrieveAccessoryProducts({
              where: {
                id: accessory_product_ids,
              },
            }),
            // they also have product id
            // get the consumer product using that
            this.retrieveProducts({
              where: {
                id: product_ids,
              },
            }),
            // payment mode is also there.
            // add the payment mode in the result of each transactions well.
            this.retrievePaymentMode({
              where: {
                id: payment_mode_ids,
              },
            }),
            transactions,
          ]);
        }).
        spread((accessoryProducts, products, paymentModes,
                transactions) => transactions.map((item) => {
          item.accessory_product = accessoryProducts.find(
              (pmItem) => pmItem.id === item.accessory_product_id);
          item.product = products.find(
              (pmItem) => pmItem.id === item.product_id);
          item.payment_mode = paymentModes.find(
              (pmItem) => pmItem.id === item.payment_mode_id);
          return item;
        }));
  }

  createTransaction(options) {
    // find create find seller
    // create the transaction
    // create product and reference it to existing product

    return Promise.try(() => {

      return this.sellerAdapter.retrieveOrCreateOfflineSellers({
        'seller_name': options.seller_detail.name,
        'address': options.seller_detail.address,
        'contact_no': options.seller_detail.phone,
      }, {
        'seller_name': options.seller_detail.name,
        'address': options.seller_detail.address,
        'contact_no': options.seller_detail.phone,
      });

    }).then((seller) => Promise.all([
      this.addTransaction({
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
        'transaction_id': options.transaction_id,
      }), this.modals.products.findOne({
        where: {
          'id': options.product_id,
        },
      }),
      this.modals.table_accessory_products.findOne({
        where: {
          id: options.accessory_product_id,
        },
      }),
    ])).spread((result, parentProduct, accessoryProduct) => {
      parentProduct = parentProduct.toJSON();
      accessoryProduct = accessoryProduct.toJSON();
      return Promise.all([
        result,
        this.productAdapter.createEmptyProduct({
          'accessory_id': options.accessory_product_id,
          'category_id': parentProduct.category_id,
          'ref_id': options.product_id,
          'product_name': accessoryProduct.title,
          'purchase_cost': options.price,
          'seller_id': result.id,
          'user_id': options.user_id,
          'job_id': parentProduct.job_id,
          'main_category_id': parentProduct.main_category_id,
          'status_type': 11,
        }),
      ]);
    });

  }

  retrieveProducts(options) {
    return this.modals.products.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveAccessoryCategories(options) {
    return this.modals.table_accessory_categories.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveCategoryNames(options) {
    return this.modals.categories.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveAccessoryProducts(options) {
    return this.modals.table_accessory_products.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveTransactions(options) {
    return this.modals.table_transaction.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrievePaymentMode(options) {
    return this.modals.table_payment_mode.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  addTransaction(options) {
    return this.modals.table_transaction.create(options).
        then((result) => result.toJSON());
  }

}