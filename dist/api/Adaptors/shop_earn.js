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

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ShopEarnAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdapter = new _product2.default(modals);
    this.sellerAdapter = new _sellers2.default(modals);
  }

  async retrieveSKUs(options) {
    try {
      const { user_id, queryOptions } = options;
      let { category_id, brand_ids, sub_category_ids, measurement_values, measurement_types, bar_code, title, limit, offset, id } = queryOptions || {};
      title = { $iLike: `%${title || ''}%` };
      limit = limit || 50;
      offset = offset || 0;
      category_id = (category_id || '').trim().split(',').filter(item => !!item);
      brand_ids = (brand_ids || '').trim().split(',').filter(item => !!item);
      sub_category_ids = (sub_category_ids || '').trim().split(',').filter(item => !!item);
      measurement_values = (measurement_values || '').trim().split(',').filter(item => !!item);
      measurement_types = (measurement_types || '').trim().split(',').filter(item => !!item);
      console.log(brand_ids);
      const [skuItems, sku_ids] = await _bluebird2.default.all([this.modals.sku.findAll({
        where: JSON.parse(JSON.stringify({
          status_type: 1,
          category_id: category_id.length > 0 ? category_id : undefined,
          brand_id: brand_ids.length > 0 ? brand_ids : undefined,
          sub_category_id: sub_category_ids.length > 0 ? sub_category_ids : undefined, title, id
        })),
        include: [{
          model: this.modals.sku_measurement,
          where: JSON.parse(JSON.stringify({
            status_type: 1,
            measurement_value: measurement_values.length > 0 ? measurement_values : undefined,
            measurement_type: measurement_types.length > 0 ? measurement_types : undefined,
            bar_code
          })),
          attributes: {
            exclude: ['status_type', 'updated_by', 'updated_at', 'created_at']
          },
          required: false
        }],
        order: [['id']],
        attributes: {
          exclude: ['status_type', 'updated_by', 'updated_at', 'created_at']
        },
        limit,
        offset
      }), this.modals.sku.findAll({
        where: JSON.parse(JSON.stringify({
          status_type: 1,
          category_id: category_id.length > 0 ? category_id : undefined,
          sub_category_id: sub_category_ids.length > 0 ? sub_category_ids : undefined, title
        })),
        attributes: ['brand_id'],
        order: [['id']]
      })]);

      const brands = await this.modals.sku_brands.findAll({
        where: {
          id: _lodash2.default.uniq(sku_ids.map(item => {
            item = item.toJSON();
            return item.brand_id;
          }))
        }
      });

      return {
        sku_items: skuItems.map(item => item.toJSON()).filter(item => item.sku_measurements && item.sku_measurements.length > 0), brands: brands.map(item => item.toJSON())
      };
    } catch (e) {
      throw e;
    }
  }

  async retrieveSKUItem(options) {
    try {
      let { bar_code, id } = options;
      const bar_code_filter = bar_code;
      bar_code = bar_code ? { $iLike: bar_code } : bar_code;
      let skuItems = await this.modals.sku.findAll({
        where: JSON.parse(JSON.stringify({ status_type: 1, id })),
        include: [{
          model: this.modals.sku_measurement,
          where: JSON.parse(JSON.stringify({
            status_type: 1,
            bar_code
          })),
          required: true,
          attributes: []
        }],
        order: [['id']]
      });

      skuItems = skuItems.map(item => item.toJSON());
      const skuItem = skuItems.length > 0 ? skuItems[0] : undefined;
      if (skuItem) {
        skuItem.sku_measurements = (await this.retrieveSKUMeasurements({ status_type: 1, sku_id: skuItem.id })).map(item => {
          item.selected = item.bar_code.toLowerCase() === bar_code_filter.toLowerCase();
          return item;
        });
      }

      return skuItem;
    } catch (e) {
      throw e;
    }
  }

  async retrieveSKUMeasurements(options) {
    let skuMeasurements = this.modals.sku_measurement.findAll({
      where: JSON.parse(JSON.stringify(options))
    });

    return skuMeasurements.map(item => item.toJSON());
  }

  async retrieveReferenceData() {
    try {
      let [main_categories, categories, sub_categories, measurement_types] = await _bluebird2.default.all([this.modals.sku_categories.findAll({ where: { level: 1, status_type: 1 } }), this.modals.sku_categories.findAll({ where: { level: 2, status_type: 1 } }), this.modals.sku_categories.findAll({ where: { level: 3, status_type: 1 } }), this.modals.measurement.findAll({ where: { status_type: 1 } })]);

      measurement_types = measurement_types.map(item => item.toJSON());
      sub_categories = sub_categories.map(item => item.toJSON());

      categories = categories.map(item => item.toJSON());
      let brands = await _bluebird2.default.all(categories.map(item => this.modals.sku_brands.findAll({ where: { status_type: 1, id: item.brand_ids } })));
      categories = categories.map((item, index) => {
        item.sub_categories = sub_categories.filter(bItem => bItem.ref_id === item.id);
        item.brands = brands[index].map(bItem => bItem.toJSON());
        return item;
      });
      return {
        main_categories: JSON.parse(JSON.stringify(main_categories.map(item => {
          item = item.toJSON();
          item.categories = categories.filter(bItem => bItem.ref_id === item.id);
          return item;
        }))), measurement_types
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async retrieveSKUWishList(options) {
    try {
      const { user_id } = options;
      const user_sku_data = await this.retrieveUserSKUs({
        where: { user_id },
        attributes: ['wishlist_items', 'past_selections', 'my_seller_ids']
      });
      if (user_sku_data) {
        const sku_id = _lodash2.default.uniq(user_sku_data.past_selections.map(item => item.id));
        console.log(sku_id);
        user_sku_data.past_selections = user_sku_data.past_selections && user_sku_data.past_selections.length > 0 ? (await this.retrieveSKUs({
          queryOptions: {
            id: sku_id,
            limit: 10000
          }
        })).sku_items : [];
      }

      console.log(JSON.stringify(user_sku_data));
      return user_sku_data;
    } catch (e) {
      throw e;
    }
  }

  async retrieveWalletDetails(options) {
    try {
      const { user_id } = options;
      const user_wallet_details = await this.modals.user_wallet({
        where: { user_id, status_type: [14, 16] }
      });
      return user_wallet_details.map(item => item.toJSON());
    } catch (e) {
      throw e;
    }
  }

  async retrieveCashBackTransactions(options) {
    try {
      const { user_id } = options;
      const transaction_detail = await this.modals.cashback_jobs({
        where: { user_id }
      });
      return transaction_detail.map(item => item.toJSON());
    } catch (e) {
      throw e;
    }
  }

  async createUserSKUWishList(reply, request, user_id) {
    let { id, sku_measurement } = request.payload;
    let { measurement_type, measurement_value } = sku_measurement || {};
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: { user_id },
        attributes: ['wishlist_items', 'past_selections']
      });
      let { wishlist_items, past_selections } = userSKUWishList || {};
      past_selections = past_selections || [];
      let payload_added = false;
      if (id) {
        wishlist_items = (wishlist_items && wishlist_items.length > 0 ? wishlist_items.map(item => {
          let { measurement_type: item_measurement_type, measurement_value: item_measurement_value } = item.sku_measurement;

          if (item.id === id && item_measurement_type === measurement_type && item_measurement_value === measurement_value) {
            if (request.payload.quantity === 0) {
              return undefined;
            }
            item = request.payload;
            payload_added = true;
          }

          return item;
        }) : [{}].map(item => {
          payload_added = true;
          if (request.payload.quantity === 0) {
            return undefined;
          }
          return request.payload;
        })).filter(item => !!item);
        if (!payload_added) {
          wishlist_items.push(request.payload);
        }
      } else {
        request.payload.status_type = 11;
        request.payload.updated_by = user_id;
        const userSku = await this.addUserSKU(request.payload);
        wishlist_items.push(userSku.toJSON());
      }

      await this.addSKUToWishList({
        wishlist_items, is_new: !userSKUWishList,
        user_id, past_selections
      });
      return reply.response({
        status: true,
        result: {
          wishlist_items,
          past_selections
        }
      });
    } catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to create wish list.', err
      });
    }
  }

  async addToPastSelection(reply, request, user_id) {
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: { user_id },
        attributes: ['wishlist_items', 'past_selections']
      });
      let { past_selections, wishlist_items } = userSKUWishList || {};
      let wishlists = [request.payload];
      past_selections = past_selections || [];
      wishlists.forEach(item => {
        let { measurement_type: item_measurement_type, measurement_value: item_measurement_value } = item.sku_measurement;
        const alreadySelected = past_selections.find(pItem => {
          let { measurement_type, measurement_value } = pItem.sku_measurement;
          return item.id === pItem.id && item_measurement_type === measurement_type && item_measurement_value === measurement_value;
        });

        if (!alreadySelected) {
          item.count = 1;
          past_selections.push(item);
        } else {
          alreadySelected.count += 1;
          alreadySelected.added_date = item.added_date;
        }
      });

      console.log('\n\n\n\n\n\n', JSON.stringify({ past_selections }));
      await this.addSKUToWishList({ past_selections, wishlist_items, user_id });
      return reply.response({
        status: true,
        result: { past_selections }
      });
    } catch (err) {
      console.log('\n\n\n\n\n', err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to update past selection', err
      });
    }
  }

  async resetUserSKUWishList(reply, request, user_id) {
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: { user_id },
        attributes: ['wishlist_items', 'past_selections']
      });
      let { wishlist_items, past_selections } = userSKUWishList || {};
      past_selections = past_selections || [];
      wishlist_items.forEach(item => {
        let { measurement_type: item_measurement_type, measurement_value: item_measurement_value } = item.sku_measurement;
        const alreadySelected = past_selections.find(pItem => {
          let { measurement_type, measurement_value } = pItem.sku_measurement;
          return item.id === pItem.id && item_measurement_type === measurement_type && item_measurement_value === measurement_value;
        });

        if (!alreadySelected) {
          item.count = 1;
          past_selections.push(item);
        } else {
          alreadySelected.count += 1;
          alreadySelected.added_date = item.added_date;
        }
      });
      await this.addSKUToWishList({
        wishlist_items: [], past_selections,
        is_new: !userSKUWishList, user_id
      });
      return reply.response({
        status: true,
        result: { wishlist_items: [], past_selections }
      });
    } catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to create transaction.', err
      });
    }
  }

  async retrieveSKUData(parameters) {
    const result = await this.modals.sku.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveUserSKUs(options) {
    const result = await this.modals.user_index.findAll(options);
    return result && result.length > 0 ? result[0].toJSON() : undefined;
  }

  async addSKUToWishList(options) {
    let { wishlist_items, past_selections, is_new, user_id } = options;
    wishlist_items = wishlist_items.filter(item => item.quantity > 0);
    return (await is_new) ? this.modals.user_index.create(JSON.parse(JSON.stringify({ wishlist_items, past_selections, user_id }))) : this.modals.user_index.update(JSON.parse(JSON.stringify({ wishlist_items, past_selections })), { where: { user_id } });
  }

  async addUserSKU(options) {
    return await this.modals.sku.create(options);
  }

  async updateUserSKUExpenses(parameters) {
    let { id, job_id, expense_id, options } = parameters;
    return await this.modals.expense_sku_items.update(options, { where: JSON.parse(JSON.stringify({ id, job_id, expense_id })) });
  }

  async addUserSKUExpenses(options) {
    return await this.modals.expense_sku_items.bulkCreate(options, { returning: true });
  }
}
exports.default = ShopEarnAdaptor;