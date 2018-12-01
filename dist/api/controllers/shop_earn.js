/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _shop_earn = require('../adaptors/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _job = require('../adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _product = require('../adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _sellers = require('../adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _category = require('../adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _user = require('../adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _notification = require('../adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals, shopEarnAdaptor, jobAdaptor, productAdaptor, sellerAdaptor, categoryAdaptor, userAdaptor, notificationAdaptor;

class ShopEarnController {
  constructor(modal, socket) {
    notificationAdaptor = new _notification2.default(modal);
    shopEarnAdaptor = new _shop_earn2.default(modal);
    jobAdaptor = new _job2.default(modal, socket, notificationAdaptor);
    productAdaptor = new _product2.default(modal);
    sellerAdaptor = new _sellers2.default(modal, notificationAdaptor);
    categoryAdaptor = new _category2.default(modal);
    userAdaptor = new _user2.default(modal);
    modals = modal;
  }

  static async getSKUs(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        let { main_category_id, category_id, brand_ids, sub_category_ids, measurement_values, measurement_types, bar_code, title, limit, offset, id, seller_id } = request.query || {};
        if (main_category_id || category_id || brand_ids || sub_category_ids || measurement_values || measurement_types || bar_code || title || limit || id || seller_id) {
          const result = await modals.users.findOne({
            where: { id: user.id || user.ID }, attributes: [[modals.sequelize.literal('(Select my_seller_ids from table_user_index as "user_index" where "users".id = "user_index".user_id)'), 'my_seller_ids'], 'location', 'id', 'mobile_no']
          });
          user = result ? result.toJSON() : user;
          const seller_list = user.my_seller_ids ? await sellerAdaptor.retrieveSellersOnInit({
            where: JSON.parse(JSON.stringify({
              id: user.my_seller_ids, is_onboarded: true, is_fmcg: true,
              contact_no: { $ne: user.mobile_no }
            })),
            attributes: ['id', 'seller_name', 'seller_type_id', 'address', 'is_data_manually_added', [modals.sequelize.literal(`(Select count(*) from table_seller_provider_types as provider_type where provider_type.seller_id = sellers.id)`), 'provider_counts'], [modals.sequelize.literal(`(Select count(*) from table_sku_seller_mapping as sku_seller where sku_seller.seller_id = sellers.id)`), 'sku_seller_counts']]
          }) : undefined;
          let sku_result = await shopEarnAdaptor.retrieveSKUs({
            location: user.location, user_id: user.id,
            queryOptions: request.query, seller_list
          });
          if (request.query && request.query.title) {
            let milk_skus = [];
            if (_lodash2.default.includes(title, 'milk')) {
              milk_skus = sku_result.sku_items.filter(item => _lodash2.default.includes(_main2.default.MILK_SKU_IDS, item.id.toString()));
              sku_result.sku_items = sku_result.sku_items.filter(item => !_lodash2.default.includes(_main2.default.MILK_SKU_IDS, item.id.toString()));
            }
            let splittedSearchTerm = request.query.title.split('%'),
                searchTerm = '';
            searchTerm = splittedSearchTerm.length > 1 ? splittedSearchTerm.join(' ') : splittedSearchTerm.join('');
            const matching_skus = sku_result.sku_items.filter(item => (item.sub_category_name || '').toLowerCase() === searchTerm.toLowerCase() || _lodash2.default.includes((item.title || '').toLowerCase(), searchTerm.toLowerCase()) || splittedSearchTerm.filter(searchItem => _lodash2.default.includes((item.title || '').toLowerCase(), searchItem.toLowerCase())).length === splittedSearchTerm.length);
            const distinct_skus = sku_result.sku_items.filter(item => {
              return !((item.sub_category_name || '').toLowerCase() === searchTerm.toLowerCase() || _lodash2.default.includes((item.title || '').toLowerCase(), searchTerm.toLowerCase()) || splittedSearchTerm.filter(searchItem => _lodash2.default.includes((item.title || '').toLowerCase(), searchItem.toLowerCase())).length === splittedSearchTerm.length);
            });
            sku_result.sku_items = [...milk_skus, ...matching_skus, ...distinct_skus];
          }
          return reply.response({
            status: true, result: JSON.parse(JSON.stringify(sku_result)),
            max_wish_list_items: _main2.default.MAX_WISH_LIST_ITEMS,
            seller_list: (seller_list || []).filter(item => parseInt(item.provider_counts || 0) > 0 || parseInt(item.sku_seller_counts || 0) > 0 || item.is_data_manually_added)
          });
        }

        return reply.response({
          status: true, result: { sku_items: [], brands: [] },
          max_wish_list_items: _main2.default.MAX_WISH_LIST_ITEMS,
          seller_list: []
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSKUSuggestions(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const seller_user = await modals.seller_users.findOne({
          where: { id: user.id },
          attributes: ['id', 'is_logged_out', [modals.sequelize.literal('(select id from table_sellers as sellers where sellers.user_id = seller_users.id)'), 'seller_id']]
        });

        user = seller_user ? seller_user.toJSON() : user;
        request.params.seller_id = user.seller_id;
        const seller_id = request.params.seller_id;
        const { sku_measurement_id } = request.query;
        const [seller_list, sku_items, sku_measurement] = await _bluebird2.default.all([sellerAdaptor.retrieveSellersOnInit({
          where: { id: seller_id },
          attributes: ['id', 'seller_name', 'seller_type_id', 'address', 'is_data_manually_added', [modals.sequelize.literal(`(Select count(*) from table_seller_provider_types as provider_type where provider_type.seller_id = sellers.id)`), 'provider_counts'], [modals.sequelize.literal(`(Select count(*) from table_sku_seller_mapping as sku_seller where sku_seller.seller_id = sellers.id)`), 'sku_seller_counts']]
        }), shopEarnAdaptor.retrieveSKUData({
          where: { id: request.params.sku_id },
          attributes: ['sub_category_id', 'category_id', 'main_category_id']
        }), sku_measurement_id ? shopEarnAdaptor.retrieveSKUMeasurement({
          where: { sku_id: request.params.sku_id, id: sku_measurement_id }
        }) : {}]);
        const sku_item = sku_items[0];
        if (sku_item.sub_category_id) {
          request.params.category_id = (sku_item.category_id || '').toString();
          request.params.main_category_id = (sku_item.main_category_id || '').toString();
          request.params.sub_category_ids = (sku_item.sub_category_id || '').toString();
          request.params.limit = request.query.limit;
          request.params.offset = request.query.offset;
          let sku_result = [];
          let sku_list = await shopEarnAdaptor.retrieveSellerSKUs({
            queryOptions: request.params, seller_list
          });
          sku_list.forEach(skuItem => {
            const { sub_category_name, brand_id, category_id, sub_category_id, main_category_id, title, id, priority_index } = skuItem;
            sku_result.push(...skuItem.sku_measurements.map(item => ({
              sub_category_name, brand_id, category_id,
              sub_category_id, main_category_id,
              title, id, priority_index, sku_measurements: [item]
            })));
          });
          switch (sku_measurement.measurement_type) {
            case 2:
              sku_measurement.temp_measurement_value = parseFloat((sku_measurement.measurement_value || 0).toString()) * 1000;
              break;
            case 4:
              sku_measurement.temp_measurement_value = parseFloat((sku_measurement.measurement_value || 0).toString()) * 1000;
              break;
            case 11:
              sku_measurement.temp_measurement_value = parseFloat((sku_measurement.measurement_value || 0).toString()) / 1000;
              break;
            default:
              sku_measurement.temp_measurement_value = parseFloat((sku_measurement.measurement_value || 0).toString());
          }
          const sku_ratio = sku_measurement.temp_measurement_value && sku_measurement.temp_measurement_value > 0 ? sku_measurement.mrp / sku_measurement.temp_measurement_value : -1;
          const matching_skus = sku_result.filter(item => !!item.sku_measurements.find(mItem => {
            switch (mItem.measurement_type) {
              case 2:
                mItem.temp_measurement_value = parseFloat((mItem.measurement_value || 0).toString()) * 1000;
                break;
              case 4:
                mItem.temp_measurement_value = parseFloat((mItem.measurement_value || 0).toString()) * 1000;
                break;
              case 11:
                mItem.temp_measurement_value = parseFloat((mItem.measurement_value || 0).toString()) / 1000;
                break;
              default:
                mItem.temp_measurement_value = parseFloat((mItem.measurement_value || 0).toString());
            }
            return mItem.temp_measurement_value === sku_measurement.measurement_value && mItem.measurement_type === sku_measurement.measurement_type;
          }));
          console.log(JSON.stringify({ matching_skus }));
          matching_skus.sort((a, b) => {
            let a_sku_ratio = 0,
                b_sku_ratio = 0;
            const a_item = a.sku_measurements[0];
            const b_item = b.sku_measurements[0];
            a_sku_ratio += a_item && a_item.temp_measurement_value > 0 ? a_item.mrp / a_item.temp_measurement_value : -1;
            b_sku_ratio += b_item && b_item.temp_measurement_value > 0 ? b_item.mrp / b_item.temp_measurement_value : -1;
            return Math.abs(sku_ratio - a_sku_ratio) < Math.abs(sku_ratio - b_sku_ratio) ? -1 : Math.abs(sku_ratio - a_sku_ratio) === Math.abs(sku_ratio - b_sku_ratio) ? 0 : 1;
          });
          sku_result = sku_result.filter(item => {
            return !item.sku_measurements.find(mItem => mItem.measurement_value === sku_measurement.measurement_value && mItem.measurement_type === sku_measurement.measurement_type);
          });
          sku_result.sort((a, b) => {
            let a_sku_ratio = 0,
                b_sku_ratio = 0;
            const a_item = a.sku_measurements[0];
            const b_item = b.sku_measurements[0];
            switch (a_item.measurement_type) {
              case 2:
                a_item.temp_measurement_value = parseFloat((a_item.measurement_value || 0).toString()) * 1000;
                break;
              case 4:
                a_item.temp_measurement_value = parseFloat((a_item.measurement_value || 0).toString()) * 1000;
                break;
              case 11:
                a_item.temp_measurement_value = parseFloat((a_item.measurement_value || 0).toString()) / 1000;
                break;
              default:
                a_item.temp_measurement_value = parseFloat((a_item.measurement_value || 0).toString());
            }

            switch (b_item.measurement_type) {
              case 2:
                b_item.temp_measurement_value = parseFloat((b_item.measurement_value || 0).toString()) * 1000;
                break;
              case 4:
                b_item.temp_measurement_value = parseFloat((b_item.measurement_value || 0).toString()) * 1000;
                break;
              case 11:
                b_item.temp_measurement_value = parseFloat((b_item.measurement_value || 0).toString()) / 1000;
                break;
              default:
                b_item.temp_measurement_value = parseFloat((b_item.measurement_value || 0).toString());
            }
            a_sku_ratio += a_item && a_item.temp_measurement_value > 0 ? a_item.mrp / a_item.temp_measurement_value : -1;
            b_sku_ratio += b_item && b_item.temp_measurement_value > 0 ? b_item.mrp / b_item.temp_measurement_value : -1;
            return Math.abs(sku_ratio - a_sku_ratio) < Math.abs(sku_ratio - b_sku_ratio) ? -1 : Math.abs(sku_ratio - a_sku_ratio) === Math.abs(sku_ratio - b_sku_ratio) ? 0 : 1;
          });
          return reply.response({
            status: true, result: _lodash2.default.slice(JSON.parse(JSON.stringify([...matching_skus, ...sku_result])), 0, _main2.default.MAX_SELLER_SUGGESTIONS)
          });
        }

        return reply.response({ status: true, result: [] });
      } catch (err) {
        console.log(`Error on ${new Date()} for seller user ${user.id} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          seller_user_id: user.id,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSellerCategories(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const { seller_id } = request.params;
        const seller = (await sellerAdaptor.retrieveSellersOnInit({
          where: { id: seller_id, is_onboarded: true, is_fmcg: true },
          attributes: ['is_data_manually_added', 'id']
        }, {}))[0];
        const seller_categories = await shopEarnAdaptor.retrieveSellerCategories({ seller });
        return reply.response({
          status: true, result: seller_categories
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSKUItem(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const result = await modals.user_index.findOne({
          where: { user_id: user.id || user.ID }, attributes: [[modals.sequelize.literal('(Select location from users as "user" where "user".id = "user_index".user_id)'), 'location'], 'my_seller_ids', ['user_id', 'id']]
        });
        user = result ? result.toJSON() : user;
        const sku_item = await shopEarnAdaptor.retrieveSKUItem({
          bar_code: (request.params || {}).bar_code,
          id: (request.params || {}).id,
          location: user.location
        });
        if ((request.params || {}).bar_code && sku_item) {
          sku_item.sku_measurement = sku_item.sku_measurements.find(item => item.bar_code.toLowerCase() === (request.params || {}).bar_code.toLowerCase());
        }
        return reply.response({
          status: true,
          result: JSON.parse(JSON.stringify(sku_item))
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU Item'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSellerSKUItem(request, reply) {
    if (!request.pre.forceUpdate) {
      // this is where make us of adapter
      let user = _shared2.default.verifyAuthorization(request.headers);
      try {
        user = await sellerAdaptor.retrieveSellerDetail({
          where: { user_id: user.id },
          attributes: ['id', 'user_id', 'contact_no']
        });
        const sku_item = await shopEarnAdaptor.retrieveSKUItem({
          bar_code: (request.params || {}).bar_code,
          id: (request.params || {}).id, is_seller: true
        }, user.id);
        if ((request.params || {}).bar_code && sku_item) {
          sku_item.sku_measurement = sku_item.sku_measurements.find(item => item.bar_code.toLowerCase() === (request.params || {}).bar_code.toLowerCase());
        }
        return reply.response({
          status: true,
          result: JSON.parse(JSON.stringify(sku_item))
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU Item'
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: preRequest.forceUpdate
      });
    }
  }

  static async getReferenceData(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const result = await modals.users.findOne({
          where: { id: user.id || user.ID }, attributes: [[modals.sequelize.literal('(Select my_seller_ids from table_user_index as "user_index" where "users".id = "user_index".user_id)'), 'my_seller_ids'], 'location', 'id', 'mobile_no']
        });
        user = result ? result.toJSON() : user;
        const seller_list = user.my_seller_ids ? await sellerAdaptor.retrieveSellersOnInit({
          where: JSON.parse(JSON.stringify({
            id: user.my_seller_ids, is_onboarded: true, is_fmcg: true,
            contact_no: { $ne: user.mobile_no }
          })),
          attributes: ['id', 'seller_name', 'seller_type_id', 'address', 'is_data_manually_added', [modals.sequelize.literal(`(select is_logged_out from table_seller_users as "users" where "users".id = "sellers"."user_id")`), 'is_logged_out'], [modals.sequelize.literal(`(Select count(*) from table_seller_provider_types as provider_type where provider_type.seller_id = sellers.id)`), 'provider_counts'], [modals.sequelize.literal(`(Select count(*) from table_sku_seller_mapping as sku_seller where sku_seller.seller_id = sellers.id)`), 'sku_seller_counts']]
        }) : undefined;
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveReferenceData(),
          seller_list: (seller_list || []).filter(item => !item.is_logged_out)
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: `Unable to retrieve reference data for SKU's`
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSKUWishList(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        const result = await shopEarnAdaptor.retrieveSKUWishList({ user_id: user.id || user.ID });
        if (result && (result.wishlist_items && result.wishlist_items.length > 0 || result.past_selections && result.past_selections.length > 0)) {
          return reply.response({ status: true, result });
        }

        return reply.response({
          status: true,
          result: { wishlist_items: [], past_selections: [] },
          message: 'No Wish List please create one.'
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve wish list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getCashBackTransactions(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        return reply.response({
          status: true,
          reasons: await categoryAdaptor.retrieveReasons({ where: { query_type: 2 }, order: [['id']] }),
          result: await shopEarnAdaptor.retrieveCashBackTransactions({ user_id: user.id || user.ID })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve Cash back details'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getWalletDetail(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        const result = await shopEarnAdaptor.retrieveWalletDetails({ user_id: user.id || user.ID });
        return reply.response({
          status: true,
          total_cashback: _lodash2.default.sumBy(result.filter(item => item.transaction_type === 1), 'amount') - _lodash2.default.sumBy(result.filter(item => item.status_type === 13 && item.is_paytm || item.status_type === 14 && item.is_paytm),
          /*Only amount redeemed on payTM will be subtracted not all*/
          'amount'),
          result
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve wish list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async createSKUWishList(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        request.payload.added_date = (0, _moment2.default)().format();
        const user_id = user.id || user.ID;
        return await shopEarnAdaptor.createUserSKUWishList(reply, request, user_id);
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to create or update wish list.'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async addOfferSKUWishList(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const { id: user_id } = user;
        user = await modals.users.findOne({
          where: { id: user_id },
          attributes: ['mobile_no', 'location', 'id', 'full_name', 'email']
        });
        const { sku_id, sku_measurement_id, seller_id } = request.payload;
        const sku = await shopEarnAdaptor.retrieveSKUItem({ id: sku_id, location: user.location }, seller_id);
        sku.sku_measurement = sku.sku_measurements.find(item => item.id.toString() === sku_measurement_id.toString());
        request.payload = JSON.parse(JSON.stringify(_lodash2.default.omit(sku, 'sku_measurements')));
        request.payload.added_date = (0, _moment2.default)().format();
        request.payload.quantity = 1;
        request.payload.seller_id = seller_id;
        return await shopEarnAdaptor.createUserSKUWishList(reply, request, user_id);
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to create or update wish list.'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async addToPastSelection(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        request.payload.added_date = (0, _moment2.default)().format();
        const user_id = user.id || user.ID;
        return await shopEarnAdaptor.addToPastSelection(reply, request, user_id);
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to create or update wish list.'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async clearSKUWishList(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        const user_id = user.id || user.ID;
        return await shopEarnAdaptor.resetUserSKUWishList(reply, request, user_id);
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_details ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to reset wish list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async initializeUserExpenses(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const jobResult = await jobAdaptor.createJobs({
          job_id: `${Math.random().toString(36).substr(2, 9)}${(user.id || user.ID).toString(36)}`,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          uploaded_by: user.id || user.ID,
          user_status: 8,
          admin_status: 2,
          comments: `This job is sent for cashback expense`
        });
        const [product, cashback_jobs, wishListData] = await _bluebird2.default.all([productAdaptor.createEmptyProduct({
          job_id: jobResult.id,
          product_name: request.payload.product_name,
          user_id: user.id || user.ID,
          main_category_id: request.payload.main_category_id,
          category_id: request.payload.category_id,
          brand_id: request.payload.brand_id,
          colour_id: request.payload.colour_id,
          purchase_cost: request.payload.purchase_cost,
          taxes: request.payload.taxes,
          updated_by: user.id || user.ID,
          seller_id: request.payload.seller_id,
          status_type: 8,
          document_number: request.payload.document_number,
          document_date: request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined,
          brand_name: request.payload.brand_name,
          copies: []
        }), jobAdaptor.createCashBackJobs({
          job_id: jobResult.id,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          uploaded_by: user.id || user.ID,
          user_status: 8, admin_status: 2,
          cashback_status: 13,
          seller_status: 13
        }), shopEarnAdaptor.retrieveSKUWishList({ user_id: user.id || user.ID })]);
        const { wishlist_items, past_selections } = wishListData || {};
        return reply.response({
          status: true,
          product, cashback_jobs, wishlist_items, past_selections,
          message: 'Product, CashBack Job and Job are initialized.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to initialize product or job.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async updateExpenses(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const product = await productAdaptor.updateProduct(request.params.product_id, JSON.parse(JSON.stringify({
          purchase_cost: request.payload.value,
          taxes: request.payload.taxes,
          updated_by: user.id || user.ID,
          seller_id: request.payload.seller_id,
          status_type: 11,
          document_number: request.payload.document_number,
          document_date: request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day').format() : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day').format() : undefined
        })));

        if (product && product.seller_id) {
          const seller = await sellerAdaptor.retrieveOfflineSellerById({ id: product.seller_id });
          await _bluebird2.default.all([jobAdaptor.updateCashBackJobs({
            job_id: product.job_id, jobDetail: JSON.parse(JSON.stringify({
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
              seller_id: product.seller_id,
              cashback_status: 13,
              seller_status: 13,
              admin_status: request.payload.is_complete ? 4 : 2,
              digitally_verified: request.payload.digitally_verified,
              home_delivered: request.payload.home_delivered,
              verified_seller: seller && seller.seller_type_id === 1,
              non_verified_seller: seller && seller.seller_type_id === 2,
              online_seller: seller && seller.seller_type_id === 3,
              non_binbill_seller: seller && seller.seller_type_id === 4
            }))
          }), shopEarnAdaptor.updateUserSKUExpenses({
            expense_id: product.id, options: JSON.parse(JSON.stringify({
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
              seller_id: product.seller_id
            }))
          })]);
        } else {
          await _bluebird2.default.all([jobAdaptor.updateCashBackJobs({
            job_id: product.job_id, jobDetail: JSON.parse(JSON.stringify({
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
              cashback_status: 13,
              seller_status: 13,
              admin_status: request.payload.is_complete ? 4 : 2,
              digitally_verified: request.payload.digitally_verified,
              home_delivered: request.payload.home_delivered
            }))
          }), shopEarnAdaptor.updateUserSKUExpenses({
            expense_id: product.id, options: JSON.parse(JSON.stringify({
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID
            }))
          })]);
        }

        return reply.response({
          status: true, product,
          message: 'Product updated successfully.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update product or job.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async updateExpenseSKUs(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        let { job_id, sku_items } = request.payload;
        const cashback_job = await jobAdaptor.retrieveCashBackJobs({ job_id });
        if (cashback_job) {
          sku_items = sku_items.map(item => {
            item.job_id = cashback_job.id;
            item.expense_id = request.params.product_id;
            item.user_id = user.id || user.ID;
            item.updated_by = user.id || user.ID;
            item.status_type = 11;
            return item;
          });

          return reply.response({
            status: true,
            sku_expenses: await shopEarnAdaptor.addUserSKUExpenses(sku_items)
          });
        }

        return reply.response({
          status: false,
          message: 'No Cash back Job found for current operation.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update link sku with expense.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async cashBackApproval(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, id } = request.params;
        const utcOffset = 330;
        const seller = await sellerAdaptor.retrieveSellerDetail({ where: { id: seller_id }, attributes: ['seller_name'] });
        const seller_cashback = await jobAdaptor.retrieveSellerCashBack({
          where: { seller_id, id, status_type: 13 }, attributes: ['job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at', [modals.sequelize.literal(`(Select user_id from table_sellers as seller where seller.id = ${seller_id})`), 'seller_user_id'], [modals.sequelize.literal(`(Select full_name from users as "user" where "user".id = cashback_wallet.user_id)`), 'user_name'], [modals.sequelize.literal(`(Select sum(purchase_cost) from consumer_products as "product" where "product".job_id in (Select job_id from table_cashback_jobs as job where job.id = cashback_wallet.job_id))`), 'purchase_cost'], [modals.sequelize.literal(`(Select id from table_orders as "order" where "order".job_id = cashback_wallet.job_id)`), 'order_id']]
        });
        if (seller_cashback) {
          const startOfMonth = (0, _moment2.default)(seller_cashback.created_at).startOf('month').utcOffset(utcOffset).format();
          const endOfMonth = (0, _moment2.default)(seller_cashback.created_at).endOf('month').utcOffset(utcOffset).format();
          const startOfDay = (0, _moment2.default)(seller_cashback.created_at).startOf('day').utcOffset(utcOffset).format();
          const endOfDay = (0, _moment2.default)(seller_cashback.created_at).endOf('day').utcOffset(utcOffset).format();
          const [cash_back_job, user_cash_back_month, user_cash_back_day, user_limit_rules, user_default_limit_rules, seller_loyalty_rules] = await _bluebird2.default.all([jobAdaptor.retrieveCashBackJobs({ id: seller_cashback.job_id }), jobAdaptor.retrieveUserCashBack({
            where: {
              user_id: seller_cashback.user_id,
              status_type: [16], created_at: {
                $between: [startOfMonth, endOfMonth]
              }
            }, attributes: [[modals.sequelize.literal('sum(amount)'), 'total_amount']], group: 'user_id'
          }), jobAdaptor.retrieveUserCashBack({
            where: {
              user_id: seller_cashback.user_id,
              status_type: [16], created_at: {
                $between: [startOfDay, endOfDay]
              }
            }, attributes: [[modals.sequelize.literal('sum(amount)'), 'total_amount']], group: 'user_id'
          }), categoryAdaptor.retrieveLimitRules({
            where: {
              $or: { user_id: seller_cashback.user_id, seller_id }
            }
          }), categoryAdaptor.retrieveLimitRules({ where: { user_id: 1 } }), sellerAdaptor.retrieveSellerLoyaltyRules(JSON.parse(JSON.stringify({ seller_id })))]);

          const cash_back_month = user_cash_back_month ? user_cash_back_month.total_amount : 0;
          const cash_back_day = user_cash_back_day ? user_cash_back_day.total_amount : 0;
          const { verified_seller, digitally_verified, home_delivered, online_order } = cash_back_job;
          const { seller_user_id, user_name } = seller_cashback;
          const result = await jobAdaptor.cashBackApproval({
            cash_back_month, user_limit_rules, seller_user_id,
            user_default_limit_rules, cash_back_day, user_name,
            verified_seller, digitally_verified, online_order,
            seller_id, transaction_type: 1, cashback_source: 1,
            job_id: seller_cashback.job_id, home_delivered,
            job: cash_back_job, amount: seller_cashback.amount,
            order_id: seller_cashback.order_id,
            purchase_cost: seller_cashback.purchase_cost,
            seller_loyalty_rules
          }, seller.seller_name);
          if (seller_loyalty_rules.order_value && seller_loyalty_rules.order_value > 0 && !seller_cashback.order_id) {
            const seller_points = await sellerAdaptor.retrieveOrCreateSellerPoints({ seller_id, user_id: seller_cashback.user_id }, {
              amount: Math.floor(seller_cashback.purchase_cost / seller_loyalty_rules.order_value * seller_loyalty_rules.points_per_item),
              transaction_type: 1,
              status_type: 16,
              user_id: seller_cashback.user_id,
              seller_id,
              job_id: seller_cashback.job_id
            }, seller.seller_name, seller_id);
            await userAdaptor.retrieveOrUpdateUserIndexedData({ where: { user_id: seller_cashback.user_id } }, { point_id: seller_points.id, user_id: seller_cashback.user_id });
          }
          return reply.response({ status: true, result });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to approve cash back.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async rejectCashBack(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, id } = request.params;
        const { reason_id } = request.payload;
        const seller_cashback = await jobAdaptor.retrieveSellerCashBack({
          where: { seller_id, id, status_type: 13 }, attributes: ['job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at']
        });
        if (seller_cashback) {
          const { job_id } = seller_cashback;
          const cash_back_job = await jobAdaptor.retrieveCashBackJobs({ id: seller_cashback.job_id });

          const { verified_seller, digitally_verified, home_delivered } = cash_back_job;
          return reply.response({
            status: true,
            result: await _bluebird2.default.all([jobAdaptor.approveSellerCashBack({ job_id, status_type: 18, seller_id }), jobAdaptor.approveUserCashBack({ job_id, status_type: 18, seller_id }), jobAdaptor.updateCashBackJobs({
              id: job_id, reason_id, seller_id,
              jobDetail: {
                seller_status: 18,
                cashback_status: 18, reason_id, seller_id
              }
            }), home_delivered ? jobAdaptor.approveHomeDeliveryCashback({
              job_id, status_type: 18, seller_id,
              jobDetail: { status_type: 18, seller_id }
            }) : ''])
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to reject cash back.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async redeemCashBackAtSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const { id: user_id } = user;
        let { seller_id } = request.params;
        const { cashback_ids: id } = request.payload;
        const seller_cashback = await jobAdaptor.retrieveSellerCashBacks({
          where: { seller_id, id, status_type: 16 }, attributes: ['job_id', 'id', 'user_id', 'amount', [modals.sequelize.literal(`(Select user_id from table_sellers as seller where seller.id = ${seller_id})`), 'seller_user_id'], [modals.sequelize.literal(`(Select full_name from users as "user" where "user".id = cashback_wallet.user_id)`), 'user_name'], [modals.sequelize.literal(`(Select id from table_wallet_user_cashback as user_cashback where user_cashback.seller_id = cashback_wallet.seller_id and user_cashback.user_id = cashback_wallet.user_id and user_cashback.amount = cashback_wallet.amount and user_cashback.job_id = cashback_wallet.job_id)`), 'user_cashback_id'], 'status_type', 'created_at']
        });
        if (seller_cashback) {
          return reply.response({
            status: true,
            redeemed_amount: _lodash2.default.sumBy(seller_cashback, 'amount'),
            result: await jobAdaptor.cashBackRedemption(JSON.parse(JSON.stringify({
              seller_id, transaction_type: 2,
              seller_cashback_id: seller_cashback.map(item => item.id),
              user_cashback_id: seller_cashback.map(item => item.user_cashback_id),
              job_id: seller_cashback.map(item => item.job_id),
              user_id, seller_cashback,
              amount: seller_cashback.map(item => item.amount)
            })))
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to redeem cash back on seller.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async redeemLoyaltyAtSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const { id: user_id } = user;
        let { seller_id } = request.params;
        let { amount } = request.payload;
        let [seller_default_loyalty_rules, seller_loyalty_rules] = await _bluebird2.default.all([modals.loyalty_rules.findOne({ where: { seller_id } }), modals.loyalty_rules.findOne({ where: { seller_id, user_id } })]);
        if (!seller_default_loyalty_rules) {
          return reply.response({
            status: false,
            message: `Seller don't have any rules yet.`
          });
        }
        const loyalty_rules = seller_loyalty_rules ? seller_loyalty_rules.toJSON() : seller_default_loyalty_rules.toJSON();
        const seller_loyalties = await jobAdaptor.retrieveSellerLoyalties({
          where: { seller_id, status_type: 16, user_id }, attributes: ['job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at', [modals.sequelize.literal(`(Select user_id from table_sellers as seller where seller.id = ${seller_id})`), 'seller_user_id'], [modals.sequelize.literal(`(Select full_name from users as "user" where "user".id = ${user_id})`), 'user_name']]
        });

        if (seller_loyalties && seller_loyalties.length > 0) {
          const total_points = _lodash2.default.sumBy(seller_loyalties, 'amount');
          if (total_points < loyalty_rules.minimum_points) {
            return reply.response({
              status: false,
              message: `You doesn't have efficient loyalty points to redeem at this seller.`
            });
          }

          if (total_points < amount) {
            return reply.response({
              status: false,
              message: `You have lesser point than you requested.`,
              total_points
            });
          }
          const { seller_user_id, user_name } = seller_loyalties[0] || {};
          return reply.response({
            status: true,
            redeemed_amount: amount,
            result: await jobAdaptor.addLoyaltyToSeller(JSON.parse(JSON.stringify({
              seller_id, transaction_type: 2, user_id,
              amount, status_type: 14, seller_user_id, user_name
            })))
          });
        }

        return reply.response({
          status: false,
          message: 'Loyalty points not available for requested seller.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to redeem loyalty points.',
        forceUpdate: request.pre.forceUpdate
      }).code(200);
    }
  }

  static async redeemCashBackAtPayTM(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const { id: user_id } = user;
        user = await modals.users.findOne({ where: { id: user_id }, attributes: ['mobile_no', 'email'] });
        user = user.toJSON();
        const { mobile_no, email } = user;
        const user_cashback = await jobAdaptor.retrieveUserCashBacks({
          where: {
            user_id, $or: {
              status_type: 16,
              $and: { status_type: [14, 13], is_paytm: true }
            }
          }, attributes: ['job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at']
        });
        if (user_cashback) {
          const redeemed_amount = _lodash2.default.sumBy(user_cashback.filter(item => item.status_type === 16), 'amount') - _lodash2.default.sumBy(user_cashback.filter(item => item.status_type === 14 || item.status_type === 13), 'amount');
          return reply.response({
            status: true,
            redeemed_amount,
            result: await jobAdaptor.cashBackRedemptionAtPayTM(JSON.parse(JSON.stringify({
              transaction_type: 2,
              user_cashback_id: user_cashback.map(item => item.id),
              job_id: user_cashback.map(item => item.job_id),
              user_id, mobile_no, email, seller_cashback: user_cashback,
              amount: redeemed_amount
            })))
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to redeem cash back at PayTM.',
        forceUpdate: request.pre.forceUpdate,
        err
      }).code(200);
    }
  }

  static async redeemSellerCashBackAtPayTM(request, reply) {
    let user = _shared2.default.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const { id: user_id } = user;
        user = await modals.seller_users.findOne({ where: { id: user_id }, attributes: ['mobile_no', 'email'] });
        user = user.toJSON();
        const { seller_id } = request.params;
        const { mobile_no, email } = user;
        const user_cashback = await sellerAdaptor.retrieveSellerWalletDetail({
          where: {
            seller_id, $or: {
              status_type: [16, 14],
              $and: { status_type: [14, 13], is_paytm: true }
            }
          }, attributes: ['job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at']
        });
        if (user_cashback) {
          const redeemed_amount = _lodash2.default.sumBy(user_cashback.filter(item => item.status_type === 16), 'amount') - _lodash2.default.sumBy(user_cashback.filter(item => item.status_type === 14 || item.status_type === 13), 'amount');
          return reply.response({
            status: true,
            redeemed_amount,
            result: await jobAdaptor.sellerCashBackRedemptionAtPayTM(JSON.parse(JSON.stringify({
              transaction_type: 2,
              user_cashback_id: user_cashback.map(item => item.id),
              job_id: user_cashback.map(item => item.job_id),
              user_id, mobile_no, email, seller_cashback: user_cashback,
              amount: redeemed_amount, seller_id
            })))
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.'
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to redeem cash back at PayTM.',
        forceUpdate: request.pre.forceUpdate,
        err
      }).code(200);
    }
  }

  static async retrieveTransactions(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      try {
        const { seller_id } = request.params;
        const result = await shopEarnAdaptor.retrievePendingTransactions({ seller_id });
        return reply.response({
          status: true,
          reasons: await categoryAdaptor.retrieveRejectReasons({ where: { query_type: 3 } }),
          result: result.filter(item => item.cashback_id && item.pending_cashback >= 0)
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve transactions'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async retrieveSKUMeasurements(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      try {
        const { sku_id } = request.params;
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveSKUMeasurements({ options: { sku_id } })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU measurement details'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }
}

exports.default = ShopEarnController;