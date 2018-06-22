import Promise from 'bluebird';
import _ from 'lodash';
import ProductAdapter from './product';
import SellerAdapter from './sellers';
import config from '../../config/main';

export default class AccessoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdapter = new ProductAdapter(modals);
    this.sellerAdapter = new SellerAdapter(modals);
  }

  async getAccessoryCategories(options) {
    const {user_id, queryOptions} = options;
    const accessoryCategories = await this.retrieveAccessoryCategories({
      where: {status_type: 1},
      attributes: ['category_id'],
      order: [['priority']],
    });

    const categories = await this.retrieveProductCategories({
      where: {
        status_type: 1,
        category_id: _.uniq(accessoryCategories.map(item => item.category_id)),
      },
      include: [
        {
          model: this.modals.products,
          as: 'products',
          where: {
            user_id, status_type: [5, 11],
          },
          attributes: [
            'brand_id', 'main_category_id', 'category_id',
            'product_name', 'id', 'model'],
          required: false,
        },
        {
          model: this.modals.table_accessory_categories,
          as: 'accessories',
          where: {
            status_type: 1,
          },
          include: {
            model: this.modals.table_accessory_products,
            as: 'accessory_items',
            where: {
              title: {$or: {$ne: '', $not: null}},
              details: {
                isOutOfStock: false,
                image: {$or: {$ne: '', $not: null}},
                name: {$or: {$ne: '', $not: null}},
              },
            }, attributes: [], required: true,
          },
          attributes: ['id', 'title', 'category_id', 'priority'],
          order: [['priority']],
          required: false,
        }],
      attributes: [
        'category_id', ['ref_id', 'main_category_id'], 'category_name'],
    });

    return categories.map(item => {
      item.accessories = _.orderBy(item.accessories, ['priority'], ['asc']);
      item.image_url = `/categories/${item.category_id}/images/1/thumbnail`;
      return item;
    });
  }

  async getAccessoriesList(options) {
    const {user_id, queryOptions} = options;
    console.log(queryOptions);
    const model_accessory = config.CATEGORIES.MODEL_ACCESSORIES;
    let {categoryid, bbclass, accessory_ids, offset, limit, model, brand_id} = queryOptions;
    accessory_ids = (accessory_ids || '').split(',').filter((item) => !!item);
    let [accessoryCategories, categories, products] = await this.retrieveAccessoryCategoryProducts(
        {
          accessory_ids, categoryid, offset, limit, user_id,
        });

    accessory_ids = accessory_ids.length > 0 ?
        accessory_ids :
        accessoryCategories.map(item => item.id);
    let filteredAccessoryIds = accessory_ids.filter(
        aIdItem => !model_accessory.includes(aIdItem.toString()));
    let modelBasedAccessoryIds = accessory_ids.filter(
        aIdItem => model_accessory.includes(aIdItem.toString()));
    const accessoryProductOptions = {
      accessory_id: filteredAccessoryIds,
      title: {$or: {$ne: '', $not: null}},
      details: {
        isOutOfStock: false,
        image: {$or: {$ne: '', $not: null}},
        name: {$or: {$ne: '', $not: null}},
      },
    };

    if (bbclass) {
      accessoryProductOptions.bb_class = bbclass;
    }

    const accessoryProducts = await this.retrieveAccessoryProducts({
      options: {
        where: accessoryProductOptions,
        attributes: [
          'id', 'asin', 'accessory_id', 'accessory_type_id', 'affiliate_type',
          [this.modals.sequelize.json('details.price'), 'price'],
          [this.modals.sequelize.json('details.mrp'), 'mrp'],
          [this.modals.sequelize.json('details.image'), 'image'],
          [this.modals.sequelize.json('details.url'), 'url'],
          [this.modals.sequelize.json('details.name'), 'name'],
          [this.modals.sequelize.json('details.rating'), 'rating'],
          [this.modals.sequelize.json('details.productId'), 'pid'],
          [this.modals.sequelize.json('details.isOutOfStock'), 'isOutOfStock'],
          [this.modals.sequelize.json('details.seller'), 'seller']],
      },
      modelBasedAccessoryIds,
      brand_id,
      model,
    });
    accessoryCategories = accessoryCategories.map((item) => {
      item.accessory_items = accessoryProducts.filter(
          apItem => apItem.accessory_id === item.id &&
              !apItem.isOutOfStock);
      return item;
    });
    return categories.map(item => {
      item.accessories = accessoryCategories.filter(
          acItem => acItem.category_id === item.category_id &&
              acItem.accessory_items.length > 0);
      item.products = item.products || products.filter(
          pItem => pItem.category_id === item.category_id);
      return item;
    });
  }

  async retrieveAccessoryCategoryProducts(parameters) {
    let {categoryid, accessory_ids, offset, limit, user_id} = parameters;
    const productOptions = {user_id, status_type: [5, 11]};
    const accessoryOptions = {status_type: 1};
    const categoryNameOptions = {status_type: 1};
    if (categoryid) {
      productOptions.category_id = categoryid;
      accessoryOptions.category_id = categoryid;
      categoryNameOptions.category_id = categoryid;
      if (accessory_ids.length > 0) {
        accessoryOptions.id = accessory_ids;
      }

      limit = limit || config.LIMITS.ACCESSORY;

      offset = offset || 0;
      return await Promise.all([
        this.retrieveAccessoryCategories({
          where: accessoryOptions,
          include: [
            {
              model: this.modals.table_accessory_products,
              as: 'accessory_items',
              where: {
                title: {$or: {$ne: '', $not: null}},
                details: {
                  isOutOfStock: false,
                  image: {$or: {$ne: '', $not: null}},
                  name: {$or: {$ne: '', $not: null}},
                },
              },
              attributes: [],
              required: true,
            }],
          attributes: ['id', 'title', 'category_id', 'priority'],
          order: [['priority']],
          offset,
          limit,
        }),
        this.retrieveProductCategories({
          where: categoryNameOptions,
          include: [
            {
              model: this.modals.products,
              as: 'products',
              where: productOptions,
              attributes: [
                'brand_id', 'main_category_id', 'category_id',
                'product_name', 'id', 'model'],
              required: false,
            }],
          attributes: ['category_id', 'category_name'],
        })]);
    } else {
      const products = await this.retrieveProducts({
        where: productOptions,
        attributes: [
          'brand_id',
          'main_category_id',
          'category_id',
          'product_name',
          'id',
          'model',
        ],
      });
      const categoryIds = products.map((item) => item.category_id);
      accessoryOptions.category_id = categoryIds;
      categoryNameOptions.category_id = categoryIds;
      accessoryOptions.priority = {
        $between: [1, 6],
      };
      return await Promise.all([
        this.retrieveAccessoryCategories({
          where: accessoryOptions,
          attributes: ['id', 'title', 'category_id'],
          order: [['priority']],
        }),
        this.retrieveProductCategories({
          where: categoryNameOptions,
          attributes: ['category_id', 'category_name'],
        }), products]);
    }
  }

  async getOrderHistory(options) {
    const transactions = await this.retrieveTransactions({
      where: {created_by: options.user_id},
      order: [['updated_at', 'desc']],
    });
    let accessory_product_ids, product_ids, payment_mode_ids;
    if (transactions.length > 0) {
      accessory_product_ids = transactions.map(
          transaction => transaction.accessory_product_id);
      product_ids = transactions.map(transaction => transaction.product_id);
      payment_mode_ids = transactions.map(
          transaction => transaction.payment_mode_id);
    }

    const [accessoryProducts, products, paymentModes] = await Promise.all([
      // these transactions have the accessory product id
      // get the accessory products using that
      this.retrieveAccessoryProducts(
          {
            options: {
              where: JSON.parse(JSON.stringify({id: accessory_product_ids})),
            },
          }),
      // they also have product id
      // get the consumer product using that
      this.retrieveProducts(
          {where: JSON.parse(JSON.stringify({id: product_ids}))}),
      // payment mode is also there.
      // add the payment mode in the result of each transactions well.
      this.retrievePaymentMode(
          {where: JSON.parse(JSON.stringify({id: payment_mode_ids}))}),
    ]);

    return transactions.map((item) => {
      item.accessory_product = accessoryProducts.find(
          (pmItem) => pmItem.id === item.accessory_product_id);
      item.product = products.find((pmItem) => pmItem.id === item.product_id);
      item.payment_mode = paymentModes.find(
          (pmItem) => pmItem.id === item.payment_mode_id);
      return item;
    });
  }

  async createTransaction(options) {
    // find create find seller
    // create the transaction
    // create product and reference it to existing product
    let {
      transaction_id, status_type, price, quantity, seller_detail,
      delivery_date, product_id, accessory_product_id, payment_mode,
      details_url, delivery_address, online_seller_id, user_id,
    } = options;
    let seller = {};
    if (seller_detail) {
      const {name, address, phone} = seller_detail;
      seller = await this.sellerAdapter.retrieveOrCreateOfflineSellers(
          {seller_name: name, address, contact_no: phone},
          {seller_name: name, address, contact_no: phone});
    }

    let [result, parentProduct, accessoryProduct] = await Promise.all([
      this.addTransaction({
        amount_paid: price, accessory_product_id, delivery_address,
        details_url, estimated_delivery_date: delivery_date, online_seller_id,
        payment_mode_id: payment_mode || 1, product_id, quantity,
        seller_id: seller.id, status_type, transaction_id, updated_by: user_id,
        created_by: user_id,
      }), this.modals.products.findOne({where: {id: product_id}}),
      this.modals.table_accessory_products.findOne(
          {where: {id: accessory_product_id}}),
    ]);

    parentProduct = parentProduct.toJSON();
    accessoryProduct = accessoryProduct.toJSON();
    const {category_id, job_id, main_category_id} = parentProduct;
    return await Promise.all([
      result,
      this.productAdapter.createEmptyProduct({
        accessory_id: accessory_product_id, category_id,
        ref_id: product_id, product_name: accessoryProduct.title,
        purchase_cost: price, seller_id: result.id, user_id, job_id,
        main_category_id, status_type: 11, updated_by: user_id,
        created_by: user_id,
      }),
    ]);
  }

  async retrieveProducts(options) {
    const result = await this.modals.products.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveAccessoryCategories(options) {
    const result = await this.modals.table_accessory_categories.findAll(
        options);
    return result.map(item => item.toJSON());
  }

  async retrieveProductCategories(options) {
    const result = await this.modals.categories.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveAccessoryProducts(parameters) {
    let {options, modelBasedAccessoryIds, brand_id, model} = parameters;
    brand_id = brand_id || null;
    let result = await this.modals.table_accessory_products.findAll(options);
    if ((brand_id || model) &&
        (modelBasedAccessoryIds && modelBasedAccessoryIds.length > 0)) {
      const accessory_types = await this.retrieveAccessoryType({
        where: JSON.parse(JSON.stringify({
          brand_id, model,
        })),
        attributes: ['id'],
      });
      const modelOptions = {};
      _.assign(modelOptions, options);
      modelOptions.where.accessory_id = modelBasedAccessoryIds;
      modelOptions.where.accessory_type_id = accessory_types.filter(
          atItem => atItem).map(atItem => atItem.id);
      const modelAccessories = await this.modals.table_accessory_products.findAll(
          modelOptions);
      result.push(...modelAccessories);
    }

    return result;
  }

  async retrieveAccessoryType(options) {
    const result = await this.modals.table_accessory_types.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveTransactions(options) {
    const result = await this.modals.table_transaction.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrievePaymentMode(options) {
    const result = await this.modals.table_payment_mode.findAll(options);
    return result.map(item => item.toJSON());
  }

  async addTransaction(options) {
    const result = await this.modals.table_transaction.create(options);
    return result.toJSON();
  }
}