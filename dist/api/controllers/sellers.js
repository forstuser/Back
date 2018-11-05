/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _shop_earn = require('../adaptors/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _job = require('../adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _user = require('../adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _sellers = require('../adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _google = require('../../helpers/google');

var _google2 = _interopRequireDefault(_google);

var _category = require('../adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _notification = require('../adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _sms = require('../../helpers/sms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals, shopEarnAdaptor, jobAdaptor, userAdaptor, sellerAdaptor, generalAdaptor, notificationAdaptor;

class SellerController {
  constructor(modal, socket) {
    shopEarnAdaptor = new _shop_earn2.default(modal);
    userAdaptor = new _user2.default(modal);
    notificationAdaptor = new _notification2.default(modal);
    sellerAdaptor = new _sellers2.default(modal, notificationAdaptor);
    jobAdaptor = new _job2.default(modal, socket, notificationAdaptor);
    generalAdaptor = new _category2.default(modal);
    modals = modal;
  }

  static async getMySellers(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const [user_index_data, user_detail] = await _bluebird2.default.all([userAdaptor.retrieveUserIndexedData({
          where: { user_id },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        }), userAdaptor.retrieveSingleUser({ where: { id: user_id } })]);

        let { search_value, limit, offset, latitude, longitude, city, is_fmcg, is_assisted, has_pos, for_order, for_claim } = request.query || {};
        let { seller_offer_ids, my_seller_ids: id } = user_index_data || {};
        if (id) {
          search_value = search_value || '';
          let contact_no,
              seller_name = { $or: {} };
          const reg = /^\d+$/;
          if (reg.test(search_value)) {
            const result = await _google2.default.isValidPhoneNumber(search_value);
            if (result) {
              contact_no = search_value;
            } else {
              seller_name.$or.$eq = search_value;
            }
          }
          seller_name.$or.$iLike = `%${search_value}%`;
          is_fmcg = !!(is_fmcg && is_fmcg.toLowerCase() === 'true');
          is_assisted = !!(is_assisted && is_assisted.toLowerCase() === 'true');
          has_pos = !!(has_pos && has_pos.toLowerCase() === 'true');
          const where = is_fmcg ? {
            id, $or: { seller_name, contact_no }, is_onboarded: true, is_fmcg
          } : has_pos ? {
            id, $or: { seller_name, contact_no },
            is_onboarded: true, is_fmcg: true, has_pos
          } : {
            id, $or: { seller_name, contact_no }, is_onboarded: true
          };
          if (user_detail.mobile_no) {
            where.contact_no = { $ne: user_detail.mobile_no };
          }

          const sellers = await sellerAdaptor.retrieveSellers({
            user_id, seller_offer_ids, limit, offset,
            latitude, longitude, city
          }, {
            where: JSON.parse(JSON.stringify(where)),
            attributes: ['id', ['seller_name', 'name'], 'owner_name', 'seller_details', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'locality_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', 'rush_hours', 'is_fmcg', 'is_assisted', 'has_pos', [modals.sequelize.literal(`(select minimum_points from table_loyalty_rules as loyalty_rules where (loyalty_rules.user_id = ${user_id} or loyalty_rules.user_id is null) and loyalty_rules.seller_id = "sellers"."id" limit 1)`), 'minimum_points'], [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 1 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")`), 'cashback_total'], [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 2 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")`), 'redeemed_cashback'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and transaction_type = 1 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")`), 'loyalty_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (14) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")`), 'redeemed_loyalty'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16, 14) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'redeemed_credits'], [modals.sequelize.literal(`(select count(*) from table_cashback_jobs as cashback_jobs where cashback_jobs.user_id = ${user_id} and cashback_jobs.seller_id = "sellers"."id" and "cashback_jobs"."admin_status" != 2)`), 'transaction_counts'], [modals.sequelize.literal(`(select count(*) from table_orders as order_detail where order_detail.user_id = ${user_id} and order_detail.seller_id = "sellers"."id" and order_detail.job_id is null and order_detail.status_type = 5)`), 'order_counts'], [modals.sequelize.literal(`${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and end_date > '${_moment2.default.utc().format()}' and seller_offers.seller_id = "sellers"."id")` : 0}`), 'offer_count'], [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings'], [modals.sequelize.literal(`(select is_logged_out from table_seller_users as "users" where "users".id = "sellers"."user_id")`), 'is_logged_out'], 'is_data_manually_added', [modals.sequelize.literal(`(Select count(*) from table_seller_provider_types as provider_type where provider_type.seller_id = sellers.id)`), 'provider_counts'], [modals.sequelize.literal(`(Select count(*) from table_sku_seller_mapping as sku_seller where sku_seller.seller_id = sellers.id)`), 'sku_seller_counts']]
          });
          if (sellers.length > 0) {
            return reply.response({
              status: true,
              result: for_order && for_order.toLowerCase() === 'true' ? sellers.filter(item => item.contact_no !== user_detail.mobile_no) : for_claim && for_claim.toLowerCase() === 'true' ? sellers.filter(item => item.contact_no !== user_detail.mobile_no) : sellers
            });
          } else {
            return reply.response({
              status: true, result: [],
              message: is_fmcg && has_pos ? 'Seller in your list could not have .' : is_assisted ? 'No seller in your list have assisted users.' : 'No seller found '
            });
          }
        }

        return reply.response({
          status: false,
          message: 'Please add a seller in your my seller list.'
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
          message: 'Unable to retrieve seller list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getOfferSellers(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: { user_id }, attributes: ['my_seller_ids', 'seller_offer_ids']
        });

        let { search_value, limit, offset, latitude, longitude, city, is_fmcg, is_assisted, is_pos } = request.query || {};
        const { seller_offer_ids, my_seller_ids: id } = user_index_data || {};
        if (id) {
          search_value = search_value || '';
          let contact_no,
              seller_name = { $or: {} };
          const reg = /^\d+$/;
          if (reg.test(search_value)) {
            const result = await _google2.default.isValidPhoneNumber(search_value);
            if (result) {
              contact_no = search_value;
            } else {
              seller_name.$or.$eq = search_value;
            }
          }
          seller_name.$or.$iLike = `%${search_value}%`;
          if (seller_offer_ids && seller_offer_ids.length > 0) {
            return reply.response({
              status: true,
              result: await sellerAdaptor.retrieveOfferSellers({
                user_id, seller_offer_ids, limit, offset,
                latitude, longitude, city
              }, {
                where: JSON.parse(JSON.stringify({
                  id, $or: { seller_name, contact_no },
                  is_fmcg, is_assisted, is_pos,
                  seller_type_id: [1, 2]
                })),
                attributes: ['id', ['seller_name', 'name'], 'owner_name', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'`), 'basic_details'], 'rush_hours', 'is_fmcg', 'is_assisted', 'has_pos', [modals.sequelize.literal(`${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = "sellers"."id")` : 0}`), 'offer_count'], [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings']]
              })
            });
          }
          return reply.response({
            status: true, result: [],
            message: 'No offer from any seller for you.'
          });
        }

        return reply.response({
          status: true, result: [],
          message: 'Please add a seller in your my seller list.'
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'Unable to retrieve seller list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSellers(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const [user_index_data, user_detail] = await _bluebird2.default.all([userAdaptor.retrieveUserIndexedData({
          where: { user_id },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        }), userAdaptor.retrieveSingleUser({ where: { id: user_id } })]);
        let { seller_offer_ids } = user_index_data || {};
        let { search_value, limit, offset, latitude, longitude, city, is_default } = request.query || {};
        const id = is_default && is_default.toLowerCase() === 'true' && _main2.default.DEFAULT_SELLER_IDS.length > 0 ? _main2.default.DEFAULT_SELLER_IDS : undefined;
        search_value = search_value || '';
        let contact_no,
            seller_name = { $or: {} };
        const reg = /^\d+$/;
        if (reg.test(search_value)) {
          const result = await _google2.default.isValidPhoneNumber(search_value);
          if (result) {
            contact_no = search_value;
          } else {
            seller_name.$or.$eq = search_value;
          }
        }
        seller_name.$or.$iLike = `%${search_value}%`;
        const where = JSON.parse(JSON.stringify({
          id, status_type: [1, 11], is_onboarded: true
        }));
        if (seller_name && contact_no) {
          where.$or = { seller_name, contact_no };
        } else if (seller_name) {
          where.seller_name = seller_name;
        }

        if (user_detail.mobile_no && contact_no) {
          where.$or.contact_no = JSON.parse(JSON.stringify({ $eq: contact_no, $ne: user_detail.mobile_no }));
        } else if (user_detail.mobile_no) {
          where.contact_no = { $ne: user_detail.mobile_no };
        }

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveSellers({
            user_id, seller_offer_ids, latitude, longitude,
            limit, city, offset, is_onboarded: true
          }, {
            where,
            attributes: ['id', ['seller_name', 'name'], 'owner_name', 'is_fmcg', 'seller_details', 'gstin', 'pan_no', 'reg_no', 'is_assisted', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'locality_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', 'has_pos', [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 1 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")`), 'cashback_total'], [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 2 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")`), 'redeemed_cashback'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and transaction_type = 1 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")`), 'loyalty_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and transaction_type = 2 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")`), 'redeemed_loyalty'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'redeemed_credits'], [modals.sequelize.literal(`${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = "sellers"."id")` : 0}`), 'offer_count'], [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings']]
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'Unable to fetch seller list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getCashBackSellers(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        });
        let { my_seller_ids, seller_offer_ids } = user_index_data || {};
        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveCashBackSellers({
            where: JSON.parse(JSON.stringify({
              id: my_seller_ids, status_type: [1, 11], seller_type_id: 1
            })), include: {
              model: modals.cashback_wallet,
              where: { user_id }, attributes: ['id'], required: false
            }, attributes: ['id', ['seller_name', 'name'], [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"sellers"."seller_details"->'business_details'`), 'business_details'], [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 1 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")`), 'cashback_total'], [modals.sequelize.literal(`${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = "sellers"."id")` : 0}`), 'offer_count'], [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings']]
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'Unable to fetch seller list'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSellerById(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: { user_id },
          attributes: ['my_seller_ids', 'seller_offer_ids', 'wallet_seller_credit_ids', 'wallet_seller_loyalty_ids', 'wallet_seller_cashback_ids']
        });

        let { search_value, latitude, longitude, city } = request.query || {};
        const { seller_offer_ids } = user_index_data || {};
        const { id } = request.params;
        search_value = search_value || '';
        let contact_no,
            seller_name = {
          $or: {}
        };
        const reg = /^\d+$/;
        if (reg.test(search_value)) {
          const result = await _google2.default.isValidPhoneNumber(search_value);
          if (result) {
            contact_no = search_value;
          } else {
            seller_name.$or.$eq = search_value;
          }
        }
        seller_name.$or.$iLike = `%${search_value}%`;

        let seller_payment_modes = (_main2.default.SELLER_PAYMENT_MODES || '').split(',');
        return reply.response({
          status: true,
          payment_modes: seller_payment_modes.map(item => {
            item = item.split('|');
            return { id: item[1], title: item[0].split('_').join(' ') };
          }),
          result: await sellerAdaptor.retrieveSellerById({ user_id, seller_offer_ids, latitude, longitude, city }, {
            where: JSON.parse(JSON.stringify({
              id, $or: { seller_name, contact_no }
            })),
            attributes: ['id', ['seller_name', 'name'], 'owner_name', 'has_pos', 'is_assisted', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'locality_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', 'seller_details', 'is_fmcg', [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")`), 'cashback_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")`), 'loyalty_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16,14) and transaction_type = 2 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")`), 'loyalty_redeemed'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (14, 16) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_redeemed'], [modals.sequelize.literal(`${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = "sellers"."id")` : 0}`), 'offer_count'], [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings'], [modals.sequelize.literal(`(select count(*) from table_cashback_jobs as cashback_jobs where cashback_jobs.user_id = ${user_id} and cashback_jobs.seller_id = "sellers"."id" and "cashback_jobs"."admin_status" != 2)`), 'transaction_counts'], [modals.sequelize.literal(`(select count(*) from table_orders as order_detail where order_detail.user_id = ${user_id} and order_detail.seller_id = "sellers"."id" and order_detail.job_id is null and order_detail.status_type = 5)`), 'order_counts']]
          })
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
          message: 'Unable to retrieve seller.'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSellerDetails(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        let { search_value, latitude, longitude, city } = request.query || {};
        const { id } = request.params;
        search_value = search_value || '';
        let contact_no,
            seller_name = {
          $or: {}
        };
        const reg = /^\d+$/;
        if (reg.test(search_value)) {
          const result = await _google2.default.isValidPhoneNumber(search_value);
          if (result) {
            contact_no = search_value;
          } else {
            seller_name.$or.$eq = search_value;
          }
        }
        seller_name.$or.$iLike = `%${search_value}%`;

        let seller_payment_modes = (_main2.default.SELLER_PAYMENT_MODES || '').split(',');
        return reply.response({
          status: true,
          payment_modes: seller_payment_modes.map(item => {
            item = item.split('|');
            return { id: item[1], title: item[0].split('_').join(' ') };
          }),
          result: await sellerAdaptor.retrieveSellerProfile({ latitude, longitude, city }, {
            where: JSON.parse(JSON.stringify({
              id, $or: { seller_name, contact_no }
            })),
            attributes: ['id', ['seller_name', 'name'], 'owner_name', 'has_pos', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'locality_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_seller_wallet as seller_cashback where status_type in (14, 13) and is_paytm = true and seller_cashback.seller_id = "sellers"."id")`), 'cashback_redeemed'], 'seller_details', 'is_assisted', 'is_fmcg', 'rush_hours', [modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_seller_wallet as seller_cashback where status_type in (16) and seller_cashback.seller_id = "sellers"."id")`), 'cashback_total'], [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings']]
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'Unable to retrieve seller.'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getSellerCategories(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const { id } = request.params;
        const result = [];
        let seller_categories = _lodash2.default.orderBy((await sellerAdaptor.retrieveSellerCategories({ seller_id: id })), ['category_name', 'category_4_name']);
        seller_categories.forEach(item => {
          const { sub_category_id, seller_id, provider_type_id, category_4_id, brand_ids, category_name, category_4_name, provider_type } = item;
          const category_data = result.find(cdItem => cdItem.sub_category_id === sub_category_id);
          if (category_data) {
            category_data.category_brands.push({ category_4_id, category_4_name, brand_ids });
          } else {
            result.push({
              sub_category_id, seller_id, provider_type_id,
              category_name, provider_type,
              category_brands: [{ category_4_id, category_4_name, brand_ids }]
            });
          }
        });
        return reply.response({ status: true, result });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'Unable to retrieve seller.'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async linkSellerWithUser(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const [user_detail, user_index_data, seller] = await _bluebird2.default.all([userAdaptor.retrieveSingleUser({ where: { id: user_id } }), userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids', [modals.sequelize.literal(`(Select full_name from users where id = ${user_id})`), 'user_name']]
        }), sellerAdaptor.retrieveSellerDetail({ where: { id: request.params.id } })]);
        if (seller) {
          let { seller_offer_ids, my_seller_ids } = user_index_data || {};
          let { customer_ids } = seller;
          customer_ids = (customer_ids || []).map(item => item.customer_id ? item : { customer_id: item, is_credit_allowed: false, credit_limit: 0 });
          const customer_id = customer_ids.find(item => item.customer_id && item.customer_id.toString() === user_id.toString());
          if (!customer_id) {
            customer_ids.push({
              customer_id: user_id,
              is_credit_allowed: false,
              credit_limit: 0
            });
          }
          customer_ids = _lodash2.default.uniqBy(customer_ids, 'customer_id');
          my_seller_ids = my_seller_ids || [];
          const already_in_list = my_seller_ids.includes(parseInt(request.params.id));
          sellerAdaptor.retrieveOrUpdateSellerDetail({ where: { id: request.params.id } }, { customer_ids });
          if (!user_index_data) {
            my_seller_ids.push(parseInt(request.params.id));
            await userAdaptor.createUserIndexedData({ my_seller_ids, user_id }, { where: { user_id } });

            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller.user_id, payload: {
                title: `${user_detail.name || 'User'} has added you as a Seller for future orders and communication.`,
                description: 'Please click here for more detail.',
                notification_type: 2, notification_id: Math.random()
              }
            });
          } else if (!already_in_list) {
            my_seller_ids.push(parseInt(request.params.id));
            await userAdaptor.updateUserIndexedData({ my_seller_ids }, { where: { user_id } });

            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller.user_id, payload: {
                title: `${user_index_data.user_name || 'User'} has added you as a Seller for future orders and communication.`,
                description: 'Please click here for more detail.',
                notification_type: 2, notification_id: Math.random()
              }
            });
          } else {
            return reply.response({
              status: false,
              message: 'Seller already in your list.'
            });
          }

          return reply.response({
            status: true,
            result: (await sellerAdaptor.retrieveSellers({ user_id, seller_offer_ids }, {
              where: JSON.parse(JSON.stringify({ id: request.params.id })),
              attributes: ['id', ['seller_name', 'name'], 'owner_name', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'locality_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id") as cashback_total,(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id") as loyalty_total,(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id") as credit_total, ${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = "sellers"."id")` : 0} as offer_count,(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = id) as ratings`)]
            }))[0]
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid Seller selected.'
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: `Unable to link seller`
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async unLinkSellerWithUser(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const [user_index_data, seller_detail] = await _bluebird2.default.all([userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids', 'id']
        }), sellerAdaptor.retrieveSellerDetailNonJSON({
          where: { id: request.params.id },
          attributes: ['customer_ids', 'id']
        })]);

        let { my_seller_ids, id } = user_index_data || {};
        let { customer_ids } = seller_detail.toJSON();
        my_seller_ids = (my_seller_ids || []).filter(item => item !== parseInt(request.params.id));
        await userAdaptor.updateUserIndexedData({ my_seller_ids }, { where: { user_id, id } });
        customer_ids = (customer_ids || []).map(item => item.customer_id ? item : {
          customer_id: item,
          is_credit_allowed: false,
          credit_limit: 0
        }).filter(item => item.customer_id && item.customer_id.toString() !== user_id.toString());
        await seller_detail.updateAttributes({ customer_ids });
        return reply.response({
          status: true,
          message: 'Seller removed from my seller list.'
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: `Unable to un link seller`
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async addInviteSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        let {
          seller_name, contact_no, email
        } = request.payload || {};
        const seller_options = {
          $or: { $and: { seller_name: { $iLike: seller_name || '' } } }
        };
        if (contact_no && contact_no.trim()) {
          seller_options.$or.$and.contact_no = contact_no.trim();
        }

        if (email && email.trim()) {
          seller_options.$or.$and.email = {
            $iLike: email.trim()
          };
        }

        const [user_detail, user_index_data, seller] = await _bluebird2.default.all([userAdaptor.retrieveSingleUser({ where: { id: user_id } }), userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_contact_no', [modals.sequelize.literal(`(select full_name from users as "user" where "user".id = ${user_id})`), 'user_name']]
        }), sellerAdaptor.retrieveSellerDetail({
          where: seller_options,
          attributes: ['id', 'customer_ids', 'contact_no']
        })]);
        let { seller_contact_no, my_seller_ids } = user_index_data || {};
        let { name } = user_detail;

        let { customer_ids } = seller || {};
        my_seller_ids = my_seller_ids || [];
        seller_contact_no = seller_contact_no || [];
        const message = `Yay! Your Customer ${name || ''} has invited you to BinBill Partner - for online orders & much more. Get your Free App Now, contact us on 8800850275!`;
        let already_in_my_seller_list;
        if (seller) {
          customer_ids = (customer_ids || []).map(item => item.customer_id ? item : { customer_id: item, is_credit_allowed: false, credit_limit: 0 });
          const customer_id = customer_ids.find(item => item.customer_id && item.customer_id.toString() === user_id.toString());
          if (!customer_id) {
            customer_ids.push({
              customer_id: user_id,
              is_credit_allowed: false,
              credit_limit: 0
            });
          }
          already_in_my_seller_list = my_seller_ids.includes(parseInt(seller.id));
          seller_contact_no.push(seller.contact_no);
        } else {
          await (0, _sms.sendSMS)(message, [contact_no]);
          seller_contact_no.push(contact_no.trim());
        }
        seller_contact_no = _lodash2.default.uniq(seller_contact_no);
        my_seller_ids = _lodash2.default.uniq(my_seller_ids);
        customer_ids = _lodash2.default.uniqBy(customer_ids, 'customer_id');
        if (!user_index_data) {
          if (seller) {
            my_seller_ids.push(parseInt(seller.id));
          }
          await _bluebird2.default.all([userAdaptor.createUserIndexedData({ my_seller_ids, seller_contact_no, user_id }, { where: { user_id } }), seller ? sellerAdaptor.retrieveOrUpdateSellerDetail({ where: seller_options }, { customer_ids }) : '']);
        } else if (!already_in_my_seller_list) {
          if (seller) {
            my_seller_ids.push(parseInt(seller.id));
          }
          await _bluebird2.default.all([userAdaptor.updateUserIndexedData({ my_seller_ids, seller_contact_no }, { where: { user_id } }), seller ? sellerAdaptor.retrieveOrUpdateSellerDetail({ where: seller_options }, { customer_ids }) : '']);
        } else {
          return reply.response({
            status: false,
            message: 'Seller already in your list.'
          });
        }

        return reply.response({
          status: true,
          result: seller
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: `Unable to link seller`
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async addInviteSellerByName(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        let {
          seller_name, locality_id, city_id, state_id, address
        } = request.payload || {};

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveOrUpdateInvitedSellerDetail({ where: { seller_name, locality_id, city_id, state_id, address } }, {
            seller_name, locality_id, city_id, state_id,
            address, customer_id: user_id
          }, true)
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: `Unable to link seller`
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async initializeSeller(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      let { gstin, pan: pan_no, email, category_id, is_assisted, is_fmcg, has_pos } = request.payload || {};
      let { id } = token_user;
      let user = await userAdaptor.retrieveSellerUser({ where: JSON.parse(JSON.stringify({ id })) }, false, { email });
      if (user) {
        const { mobile_no: contact_no } = user;
        let seller_updates = JSON.parse(JSON.stringify({
          gstin, pan_no, contact_no, email, has_pos, is_assisted,
          seller_type_id: 2, is_fmcg: !!category_id || is_fmcg,
          status_type: 1, created_by: 1, updated_by: 1, user_id: id
        }));
        /*let seller_detail = await sellerAdaptor.retrieveSellersOnInit(
            {
              where: JSON.parse(
                  JSON.stringify(
                      {
                        status_type: {$ne: 11},
                        $or: {gstin, pan_no, contact_no, email},
                      })),
            });
        if (!seller_detail || seller_detail.length === 0) {*/
        const gst_detail = await (gstin ? _google2.default.isValidGSTIN(gstin) : true);

        if (!gst_detail) {
          console.log(`GSTIN number ${gstin} is not a valid`);
          replyObject.status = false;
          replyObject.message = 'Invalid GST number.';
          return reply.response(replyObject);
        }

        seller_updates.seller_details = {
          basic_details: {
            category_id: category_id || _main2.default.HOUSEHOLD_CATEGORY_ID
          }
        };
        console.log(JSON.stringify(seller_updates));
        let seller_detail = await sellerAdaptor.retrieveOrUpdateSellerDetail({
          where: JSON.parse(JSON.stringify({ $or: { gstin, pan_no, contact_no } }))
        }, seller_updates, true);
        replyObject.seller_detail = JSON.parse(JSON.stringify(seller_detail || seller_updates || {}));
        /*
                } else {
                  replyObject.existing_sellers = seller_detail;
                }*/
        replyObject.mobile_no = contact_no;
        if (user) {
          replyObject.name = user.name;
          replyObject.image_url = user.image_url;
          return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
        }
        return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
      }

      return reply.response({
        status: false,
        message: 'Invalid user.',
        forceUpdate: request.pre.forceUpdate
      });
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
        message: 'Unable to initialize seller.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async createLinkSeller(request, reply) {
    let replyObject = { status: true, message: 'success' };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      let { gstin, pan, category_id, is_assisted, is_fmcg, has_pos } = request.payload || {};
      let { id } = token_user;
      is_fmcg = !!category_id || is_fmcg;
      category_id = category_id || _main2.default.HOUSEHOLD_CATEGORY_ID;

      const user = await userAdaptor.retrieveSellerUser({ where: { id } }, false);

      let { mobile_no: contact_no, email } = user;
      let seller_updates = JSON.parse(JSON.stringify({
        gstin, pan_no: pan, user_id: id, contact_no,
        email, status_type: 1, is_assisted, is_fmcg, has_pos
      }));

      seller_updates.seller_details = { basic_details: { category_id } };

      let seller_detail = await sellerAdaptor.createSellerOnInit(seller_updates);
      replyObject.mobile_no = contact_no;
      replyObject.seller_detail = JSON.parse(JSON.stringify(seller_detail || seller_updates || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to create or link seller with user.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateLinkSeller(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      let { gstin, pan, id, category_id, is_assisted, is_fmcg, has_pos } = request.payload || {};
      let { id: user_id } = token_user;
      const [user, sellers] = await _bluebird2.default.all([userAdaptor.retrieveSellerUser({ where: { id: user_id } }, false), sellerAdaptor.retrieveOrUpdateSellerDetail({
        where: JSON.parse(JSON.stringify({ id })),
        attributes: ['seller_details', 'id', 'user_id']
      }, { user_id: null }, false), sellerAdaptor.retrieveOrUpdateSellerDetail({
        where: JSON.parse(JSON.stringify({ user_id, $or: { id, gstin, pan_no: pan } })),
        attributes: ['seller_details', 'id', 'user_id']
      }, { user_id: null }, false)]);

      let { mobile_no: contact_no, email } = user;
      is_fmcg = !!(category_id || sellers.is_fmcg);
      let { seller_details } = sellers;
      seller_details = seller_details || {};
      seller_details.basic_details = seller_details.basic_details || {};
      seller_details.basic_details.category_id = category_id || _main2.default.HOUSEHOLD_CATEGORY_ID;

      let seller_updates = JSON.parse(JSON.stringify({
        gstin, pan_no: pan, user_id, contact_no,
        email, seller_details, is_fmcg, is_assisted, has_pos
      }));

      let seller_detail = await sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id, $or: { gstin, pan_no: pan } })) }, seller_updates, false);
      replyObject.mobile_no = contact_no;
      replyObject.seller_detail = JSON.parse(JSON.stringify(seller_detail || seller_updates || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to link seller with user.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async retrieveReferenceData(request, reply) {
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      let { data_required } = request.query;
      console.log(data_required);
      data_required = !(!!data_required && data_required.toLowerCase() === 'false');
      let [states, provider_types, seller_data, assisted_service_types] = await _bluebird2.default.all([generalAdaptor.retrieveStates({
        where: { id: { $notIn: [0] } },
        attributes: ['id', 'state_name']
      }), sellerAdaptor.retrieveProviderTypes({ attributes: ['id', 'title', 'description'] }), token_user ? sellerAdaptor.retrieveSellerDetail({
        where: { user_id: token_user.id },
        attributes: ['id', 'seller_details', 'is_onboarded', 'gstin', 'pan_no', 'is_assisted', 'is_fmcg', 'has_pos']
      }) : {}, data_required ? sellerAdaptor.retrieveAssistedServiceTypes({
        where: { id: { $ne: 0 } },
        attributes: ['id', 'title', 'description']
      }) : []]);
      const { is_onboarded, seller_details, gstin, pan_no, id, is_assisted, is_fmcg, has_pos } = seller_data || { is_onboarded: false };
      const { basic_details, business_details } = seller_details || {};
      const image_type_ref = (_main2.default.SELLER_BUSINESS_IMAGE_TYPES || '').split(',').map(item => {
        item = item.split('|');
        return { id: item[1], title: item[0].split('_').join(' ') };
      });
      const image_map_ref = _main2.default.SELLER_BUSINESS_IMAGE_MAP.split(',').map(item => {
        item = item.split('-');
        const image_type_ids = item[1].split('|') || [1];
        return {
          id: item[0], image_types: image_type_ids.map(imageItem => {
            return image_type_ref.find(itItem => itItem.id === imageItem);
          })
        };
      });
      let categories;
      categories = await generalAdaptor.retrieveCategories({
        options: {
          ref_id: (basic_details || {}).category_id || _main2.default.HOUSEHOLD_CATEGORY_ID
        },
        isSubCategoryRequiredForAll: true
      });
      let seller_categories = (_main2.default.SELLER_CATEGORIES || '').split(',');
      let seller_payment_modes = (_main2.default.SELLER_PAYMENT_MODES || '').split(',');
      let seller_business_types = (_main2.default.SELLER_BUSINESS_TYPES || '').split(',');
      return reply.response(JSON.parse(JSON.stringify({
        status: true, is_onboarded, is_assisted, is_fmcg,
        seller_id: id, has_pos,
        next_step: !gstin && !pan_no ? 'fresh_seller' : !basic_details || basic_details && !basic_details.is_complete ? 'basic_details' /*: !business_details ?
                                                                                                                                        'business_details'*/ : 'dashboard',
        categories: data_required || !is_onboarded ? _lodash2.default.orderBy(categories, ['priority_index', 'name']) : undefined,
        main_category_id: (basic_details || {}).category_id || _main2.default.HOUSEHOLD_CATEGORY_ID,
        data: data_required || !is_onboarded ? {
          provider_types, states, categories: seller_categories.map(item => {
            item = item.split('|');
            return { id: item[1], title: item[0].split('_').join(' ') };
          }), payment_modes: seller_payment_modes.map(item => {
            item = item.split('|');
            return { id: item[1], title: item[0].split('_').join(' ') };
          }), business_types: seller_business_types.map(item => {
            item = item.split('|');
            item = { id: item[1], title: item[0].split('_').join(' ') };
            const image_maps = image_map_ref.find(imageItem => item.id === imageItem.id);
            return {
              id: item.id, title: item.title.split('_').join(' '),
              image_types: (image_maps || {}).image_types
            };
          }), assisted_service_types
        } : undefined
      })));
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
        message: 'Unable to retrieve reference data.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerBasicDetail(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      console.log(JSON.stringify(request.payload));
      let { seller_name, address, pincode, locality_id, city_id, state_id, business_name, category_id, shop_open_day, shop_open_timings, start_time, close_time, home_delivery, home_delivery_remarks, payment_modes } = request.payload || {};
      const { id } = request.params || {};
      let { id: user_id } = token_user;
      let seller_data = await sellerAdaptor.retrieveSellerDetail({ where: { id, user_id } });
      seller_name = seller_name || seller_data.seller_name;
      address = address || seller_data.address;
      pincode = pincode || seller_data.pincode;
      locality_id = locality_id || seller_data.locality_id;
      city_id = city_id || seller_data.city_id;
      state_id = state_id || seller_data.state_id;
      const seller_details = seller_data.seller_details || { basic_details: { documents: [] } };
      const basic_details = seller_details.basic_details || { documents: [] };
      basic_details.documents = basic_details.documents || [];
      basic_details.business_name = business_name || basic_details.business_name;
      basic_details.category_id = category_id || basic_details.category_id;
      basic_details.shop_open_day = shop_open_day || basic_details.shop_open_day || 0, 1, 2, 3, 4, 5, 6;
      basic_details.start_time = start_time || basic_details.start_time || '09:00 AM';
      basic_details.close_time = close_time || basic_details.close_time || '09:00 PM';
      basic_details.shop_open_timings = shop_open_timings || basic_details.shop_open_timings;
      basic_details.home_delivery = !home_delivery && home_delivery !== false ? !!basic_details.home_delivery : home_delivery.toString().toLowerCase() === 'true';
      basic_details.home_delivery_remarks = home_delivery_remarks || basic_details.home_delivery_remarks;
      basic_details.payment_modes = payment_modes || basic_details.payment_modes;
      basic_details.is_complete = true;
      seller_details.basic_details = basic_details;
      let seller_updates = JSON.parse(JSON.stringify({
        seller_name, address, pincode, seller_details,
        locality_id, city_id, state_id, is_onboarded: true
      }));

      replyObject.seller_detail = JSON.parse(JSON.stringify((await sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id })) }, seller_updates, true)) || {}));
      await sellerAdaptor.retrieveOrCreateSellerLoyaltyRules(JSON.parse(JSON.stringify({ seller_id: id })), JSON.parse(JSON.stringify({ seller_id: replyObject.seller_detail.id, status_type: 1 })));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller basic details.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerRushHours(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      const { id, flag } = request.params || {};
      let { id: user_id } = token_user;
      let seller_data = await sellerAdaptor.retrieveSellerDetail({ where: { id, user_id } });
      if (seller_data) {
        let rush_hours = flag && flag.toString() === 'true';

        replyObject.seller_detail = JSON.parse(JSON.stringify((await sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id })) }, { rush_hours }, true)) || {}));
        return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
      }

      return reply.response({
        status: false,
        message: 'Seller is not available in database.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
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
        message: 'Unable to update seller rush hours.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async linkCustomers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      const { seller_id, customer_id } = request.params || {};
      const { credit_limit, is_credit_allowed } = request.payload;
      let { id: user_id } = token_user;
      let [seller_data] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
        where: { id: seller_id, user_id },
        attributes: ['customer_ids', 'customer_invite_detail', 'id']
      }), userAdaptor.retrieveOrUpdateUserIndexedData({
        where: { user_id: customer_id },
        attributes: ['id', 'user_id', 'my_seller_ids']
      }, { seller_id: parseInt(seller_id), user_id: customer_id })]);
      seller_data.customer_invite_detail = seller_data.customer_invite_detail || [];
      let customer_id_exist = false;
      seller_data.customer_ids = (seller_data.customer_ids || []).map(item => {
        if (item.customer_id) {
          if (item.customer_id === parseInt(customer_id)) {
            customer_id_exist = true;
            item.is_credit_allowed = !is_credit_allowed && is_credit_allowed !== false ? item.is_credit_allowed || false : is_credit_allowed;
            item.credit_limit = !credit_limit && credit_limit !== 0 ? item.credit_limit || 0 : credit_limit;
            return item;
          }
          item.is_credit_allowed = item.is_credit_allowed || false;
          item.credit_limit = item.credit_limit || 0;
          return item;
        }

        if (parseInt((item || 0).toString()) === parseInt(customer_id)) {
          customer_id_exist = true;
          return {
            customer_id: parseInt((item || 0).toString()),
            is_credit_allowed: is_credit_allowed || false,
            credit_limit: credit_limit || 0
          };
        }
        return {
          customer_id: parseInt((item || 0).toString()),
          is_credit_allowed: false,
          credit_limit: 0
        };
      });
      if (!customer_id_exist) {
        seller_data.customer_ids.push({
          customer_id: parseInt(customer_id),
          is_credit_allowed: is_credit_allowed || false,
          credit_limit: credit_limit || 0
        });
      }
      seller_data.customer_ids = _lodash2.default.uniqBy(seller_data.customer_ids, 'customer_id');
      seller_data.customer_invite_detail.push({ customer_id, invited_date: (0, _moment2.default)().utcOffset(330) });
      seller_data.customer_invite_detail = _lodash2.default.uniqBy(seller_data.customer_invite_detail, 'customer_id');
      replyObject.seller_detail = JSON.parse(JSON.stringify((await sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id: seller_id })) }, seller_data, true)) || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller basic details.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async inviteCustomers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      const { mobile_no, full_name, email, is_credit_allowed, credit_limit } = request.payload || {};
      const { seller_id } = request.params || {};
      let { id: user_id } = token_user;
      let [seller_data, user_data] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
        where: { id: seller_id, user_id },
        attributes: ['customer_ids', 'customer_invite_detail', 'seller_name', 'id']
      }), userAdaptor.createUserForSeller(JSON.parse(JSON.stringify({ mobile_no })), JSON.parse(JSON.stringify({
        mobile_no, full_name, email,
        user_status_type: 2, role_type: 5
      })), seller_id)]);
      await userAdaptor.retrieveOrUpdateUserIndexedData({
        where: { user_id: user_data.id },
        attributes: ['my_seller_ids', 'id', 'user_id']
      }, { seller_id, user_id: user_data.id });
      let customer_id_exist = false;
      seller_data.customer_invite_detail = seller_data.customer_invite_detail || [];
      seller_data.customer_ids = (seller_data.customer_ids || []).map(item => {
        if (item.customer_id) {
          if (item.customer_id === parseInt(user_data.id)) {
            customer_id_exist = true;
            item.is_credit_allowed = is_credit_allowed || item.is_credit_allowed || false;
            item.credit_limit = credit_limit || item.credit_limit || 0;
            return item;
          }
          item.is_credit_allowed = item.is_credit_allowed || false;
          item.credit_limit = item.credit_limit || 0;
          return item;
        }

        if (parseInt((item || 0).toString()) === parseInt(user_data.id)) {
          customer_id_exist = true;
          return {
            customer_id: parseInt((item || 0).toString()),
            is_credit_allowed: is_credit_allowed || false,
            credit_limit: credit_limit || 0
          };
        }
        return {
          customer_id: parseInt((item || 0).toString()),
          is_credit_allowed: false,
          credit_limit: 0
        };
      });

      if (!customer_id_exist) {
        seller_data.customer_ids.push({
          customer_id: parseInt(user_data.id),
          is_credit_allowed: is_credit_allowed || false,
          credit_limit: credit_limit || 0
        });
      }

      seller_data.customer_ids = _lodash2.default.uniqBy(seller_data.customer_ids, 'customer_id');
      seller_data.customer_invite_detail.push({
        customer_id: parseInt(user_data.id),
        invited_date: (0, _moment2.default)().utcOffset(330)
      });
      seller_data.customer_invite_detail = _lodash2.default.uniqBy(seller_data.customer_invite_detail, 'customer_id');
      replyObject.seller_detail = JSON.parse(JSON.stringify((await sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id: seller_id })) }, seller_data, true, user_data)) || {}));
      const message = `Yay! Seller ${seller_data.seller_name} has invited you to BinBill for online orders, faster delivery, home services & ongoing offers. 
Download Now: http://bit.ly/binbill`;
      await (0, _sms.sendSMS)(message, [mobile_no]);
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller basic details.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerProviderTypes(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {

      const { id: seller_id } = request.params || {};
      const provider_type_details = request.payload.provider_type_detail;
      const seller_provider_types = await _bluebird2.default.all(provider_type_details.map(item => {
        const { provider_type_id, sub_category_id, category_4_id, category_brands } = item;
        return sellerAdaptor.retrieveOrCreateSellerProviderTypes(JSON.parse(JSON.stringify({ provider_type_id, seller_id, sub_category_id })), JSON.parse(JSON.stringify({
          provider_type_id, seller_id, sub_category_id,
          category_brands
        })), category_4_id);
      }));
      await modals.seller_provider_type.destroy({
        where: {
          sub_category_id: {
            $notIn: provider_type_details.map(item => item.sub_category_id)
          }, seller_id
        }
      });
      await sellerAdaptor.retrieveOrUpdateSellerDetail({ where: { id: seller_id } }, { is_onboarded: true }, false);
      replyObject.seller_provider_types = JSON.parse(JSON.stringify(seller_provider_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller provider types.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerProviderTypeBrands(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const { seller_id } = request.params || {};
      const seller_provider_types = await _bluebird2.default.all((request.payload.provider_type_detail.length ? request.payload.provider_type_detail : [{ brand_ids: [], category_4_id: 0 }]).map(item => {
        const { provider_type_id, sub_category_id, category_brands, category_4_id, brand_ids } = item;
        return sellerAdaptor.retrieveOrCreateSellerProviderBrands(JSON.parse(JSON.stringify({ provider_type_id, seller_id, sub_category_id })), JSON.parse(JSON.stringify({
          provider_type_id, seller_id, sub_category_id,
          category_brands
        })), category_4_id, brand_ids);
      }));

      replyObject.seller_provider_types = JSON.parse(JSON.stringify(seller_provider_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller provider types.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateAssistedServiceUsers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const { id: seller_id } = request.params || {};
      let { name, mobile_no, id, document_details, service_type_detail, profile_image_detail } = request.payload;
      if (service_type_detail && service_type_detail.length > 0) {
        service_type_detail = (service_type_detail || [{}]).map(item => {
          item.seller_id = seller_id;
          return item;
        });
      }
      const seller_service_types = await sellerAdaptor.retrieveOrCreateAssistedServiceUsers(JSON.parse(JSON.stringify(id ? { id } : { id, mobile_no })), JSON.parse(JSON.stringify({
        name, mobile_no, document_details, profile_image_detail,
        seller_id
      })), JSON.parse(JSON.stringify(service_type_detail || [])));

      replyObject.seller_service_types = JSON.parse(JSON.stringify(seller_service_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller assisted services.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateAssistedServiceTypes(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const { id: service_user_id, seller_id } = request.params || {};
      let { service_type_id, price, id } = request.payload;
      const seller_service_types = await sellerAdaptor.retrieveOrCreateSellerAssistedServiceTypes(JSON.parse(JSON.stringify({ id, service_user_id, seller_id })), JSON.parse(JSON.stringify({
        service_type_id, price, seller_id, service_user_id
      })));

      replyObject.seller_service_types = JSON.parse(JSON.stringify(seller_service_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller assisted services.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateAssistedUserReview(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      let token_user = _shared2.default.verifyAuthorization(request.headers);
      const { seller_id, id } = request.params || {};
      let { id: user_id } = token_user;
      request.payload.updated_by = user_id;
      const seller_service_types = await sellerAdaptor.updateAssistedUserReview(JSON.parse(JSON.stringify({ id })), request.payload);
      if (seller_service_types) {
        replyObject.seller_service_types = JSON.parse(JSON.stringify(seller_service_types));
        return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
      }
      return reply.response({
        status: false,
        message: 'Assisted service user is not available.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
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
        message: 'Unable to update review for seller assisted services.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerOffers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const { id: seller_id } = request.params || {};
      const { start_date, end_date, title, description, id, document_details } = request.payload;
      const seller_offer = await sellerAdaptor.retrieveOrCreateSellerOffers(JSON.parse(JSON.stringify({ id, seller_id })), JSON.parse(JSON.stringify({
        seller_id, start_date, end_date, title,
        description, document_details
      })));

      replyObject.seller_offer = JSON.parse(JSON.stringify(seller_offer));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller offers.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerCredits(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {

      const { id: seller_id } = request.params || {};
      const seller = await sellerAdaptor.retrieveSellerDetail({ where: { id: seller_id }, attributes: ['seller_name'] });
      const { id, amount, transaction_type, consumer_id, description } = request.payload;
      const seller_credits = await sellerAdaptor.retrieveOrCreateSellerCredits(JSON.parse(JSON.stringify({ id, user_id: consumer_id, seller_id })), JSON.parse(JSON.stringify({
        id, amount, transaction_type, description,
        user_id: consumer_id, seller_id,
        status_type: transaction_type.toString() === '1' ? 16 : 14
      })), seller.seller_name, seller_id);
      await userAdaptor.retrieveOrUpdateUserIndexedData({ where: { user_id: consumer_id } }, { credit_id: seller_credits.id, user_id: consumer_id });
      replyObject.seller_credits = JSON.parse(JSON.stringify(seller_credits));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller credits.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerPoints(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const { id: seller_id } = request.params || {};
      const seller = await sellerAdaptor.retrieveSellerDetail({ where: { id: seller_id }, attributes: ['seller_name'] });
      const { id, amount, transaction_type, consumer_id, description } = request.payload;
      const seller_points = await sellerAdaptor.retrieveOrCreateSellerPoints(JSON.parse(JSON.stringify({ id, user_id: consumer_id, seller_id })), JSON.parse(JSON.stringify({
        id, amount, transaction_type, description, seller_id,
        user_id: consumer_id,
        status_type: transaction_type === 1 ? 16 : 14
      })), seller.seller_name, seller_id);

      await userAdaptor.retrieveOrUpdateUserIndexedData({ where: { user_id: consumer_id } }, { point_id: seller_points.id, user_id: consumer_id });
      replyObject.seller_points = JSON.parse(JSON.stringify(seller_points));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller points.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateSellerLoyaltyRules(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {

      const { id: seller_id } = request.params || {};
      const { id, item_value, rule_type, minimum_points, points_per_item, user_id, order_value, allow_auto_loyalty } = request.payload;
      replyObject.loyalty_rules = await sellerAdaptor.retrieveOrCreateSellerLoyaltyRules(JSON.parse(JSON.stringify({ id, user_id, seller_id })), JSON.parse(JSON.stringify({
        id, item_value, rule_type, seller_id, allow_auto_loyalty,
        minimum_points: minimum_points || points_per_item,
        points_per_item, user_id, status_type: 1, order_value
      })));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller points.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async retrieveSellerLoyaltyRules(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {

      const { seller_id } = request.params || {};
      replyObject.loyalty_rules = await sellerAdaptor.retrieveSellerLoyaltyRules(JSON.parse(JSON.stringify({ seller_id })));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller points.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async publishSellerOffersToUsers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const { seller_id, id } = request.params || {};
      let [user_indexes, seller] = await _bluebird2.default.all([userAdaptor.retrieveUserIndexes({
        where: { user_id: request.payload.user_ids || [] },
        attributes: ['seller_offer_ids', 'user_id', 'id']
      }), sellerAdaptor.retrieveSellerDetail({ where: { id: seller_id }, attributes: ['seller_name'] })]);

      user_indexes = user_indexes || request.payload.user_ids.map(item => ({
        user_id: item, seller_offer_ids: [parseInt(id)],
        my_seller_ids: [seller_id]
      }));
      await _bluebird2.default.all(user_indexes.map(item => {
        if (item.id) {
          item.seller_offer_ids = item.seller_offer_ids || [];
          item.seller_offer_ids.push(parseInt(id));
          item.seller_offer_ids = _lodash2.default.uniq(item.seller_offer_ids);
          return userAdaptor.updateUserIndexedData(item, { where: { user_id: item.user_id, id: item.id } });
        }

        return userAdaptor.createUserIndexedData(item, { where: { user_id: item.user_id } });
      }));

      await _bluebird2.default.all(request.payload.user_ids.map(item => notificationAdaptor.notifyUserCron({
        user_id: item, seller_id, payload: {
          title: `A New Offer has been published by Seller ${seller.seller_name || ''}.`,
          description: 'Please click here for more detail.',
          image_url: `https://consumer.binbill.com/offer/${id}/images/${0}`,
          notification_type: 26
        }
      })));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller offers.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async getCategoriesForSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const seller_data = await sellerAdaptor.retrieveSellerDetail({
          where: { user_id: user.id },
          attributes: ['id', 'seller_details', 'is_onboarded', 'gstin', 'pan_no']
        });

        const { seller_details } = seller_data || {};

        const { basic_details, business_details } = seller_details || {};
        let categories;
        if (basic_details && basic_details.category_id && business_details) {
          categories = await generalAdaptor.retrieveCategories({
            options: { ref_id: basic_details.category_id },
            isSubCategoryRequiredForAll: true
          });

          return reply.response({
            status: true,
            message: 'Successful',
            categories,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'Please select category.',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getAssistedServicesForSeller(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        let { service_type_id } = request.query;
        const is_verified = service_type_id ? true : undefined;
        service_type_id = service_type_id || {
          $notIn: [0]
        };
        const { seller_id } = request.params;
        const [service_types, seller_service_users] = await _bluebird2.default.all([sellerAdaptor.retrieveAssistedServiceTypes({}), sellerAdaptor.retrieveSellerAssistedServiceUsers({
          where: JSON.parse(JSON.stringify({ is_verified })),
          include: {
            as: 'service_types', where: JSON.parse(JSON.stringify({ seller_id, service_type_id })),
            model: modals.seller_service_types, required: true,
            attributes: ['service_type_id', 'seller_id', 'price', 'id']
          }, attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details', 'profile_image_detail', [modals.sequelize.literal(`(Select count(*) as order_counts from table_orders as orders where orders.delivery_user_id = assisted_service_users.id and orders.status_type <> 5 and orders.seller_id = ${seller_id})`), 'order_counts']]
        })]);
        const reviews = [];
        seller_service_users.forEach(item => reviews.push(...(item.reviews || [])));
        const review_user_ids = _lodash2.default.uniq(reviews.map(item => item.updated_by));
        const review_users = await userAdaptor.retrieveUsers({
          where: { id: review_user_ids }, attributes: ['id', ['full_name', 'name'], 'image_name']
        });
        return reply.response({
          status: true,
          message: 'Successful',
          result: seller_service_users.map(item => {
            item.rating = _lodash2.default.sumBy(item.reviews, 'ratings') / (item.reviews || [{ ratings: 0 }]).length;
            item.service_types = item.service_types.map(typeItem => {
              const service_type = service_types.find(stItem => stItem.id === typeItem.service_type_id);
              typeItem.service_type = (service_type || {}).title;
              return typeItem;
            });

            item.reviews = (item.reviews || []).map(rItem => {
              if (rItem.updated_by) {
                const review_user = review_users.find(ruItem => ruItem.id.toString() === rItem.updated_by.toString());
                rItem.user_name = (review_user || {}).name;
              }
              return rItem;
            });
            return item;
          }),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve assisted services for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getDeliveryPersonForSellers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const [service_types, seller_service_users] = await _bluebird2.default.all([sellerAdaptor.retrieveAssistedServiceTypes({ where: { id: 0 } }), sellerAdaptor.retrieveSellerAssistedServiceUsers({
          include: {
            as: 'service_types', where: { seller_id, service_type_id: 0 },
            model: modals.seller_service_types, required: true,
            attributes: ['service_type_id', 'seller_id', 'price', 'id']
          }, attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details', 'profile_image_detail', [modals.sequelize.literal(`(Select count(*) as order_counts from table_orders as orders where orders.delivery_user_id = assisted_service_users.id and orders.status_type = 19 and orders.seller_id = ${seller_id})`), 'order_counts']]
        })]);

        const reviews = [];
        seller_service_users.forEach(item => reviews.push(...(item.reviews || [])));

        const review_user_ids = _lodash2.default.uniq(reviews.map(item => item.updated_by));
        const review_users = await userAdaptor.retrieveUsers({
          where: { id: review_user_ids }, attributes: ['id', ['full_name', 'name'], 'image_name']
        });

        return reply.response({
          status: true,
          message: 'Successful',
          result: seller_service_users.map(item => {
            item.rating = _lodash2.default.sumBy(item.reviews || [{ ratings: 0 }], 'ratings') / (item.reviews || [{ ratings: 0 }]).length;
            item.service_types = item.service_types.map(typeItem => {
              const service_type = service_types.find(stItem => stItem.id === typeItem.service_type_id);
              typeItem.service_type = (service_type || {}).title;
              return typeItem;
            });

            item.reviews = (item.reviews || []).map(rItem => {
              if (rItem.updated_by) {
                const review_user = review_users.find(ruItem => ruItem.id.toString() === rItem.updated_by.toString());
                rItem.user_name = (review_user || {}).name;
              }
              return rItem;
            });

            return item;
          }),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve assisted services for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getSellerAssistedServiceTypes(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const [service_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerAssistedServices({
          where: { seller_id, service_type_id: { $ne: 0 } },
          distinct: true, group: ['service_type_id'], attributes: ['service_type_id', [modals.sequelize.literal(`(select title from table_assisted_service_types as service_types where service_types.id = seller_service_types.service_type_id)`), 'service_name']]
        })]);

        return reply.response({
          status: true,
          message: 'Successful',
          result: service_types,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve assisted services for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerWallet(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const result = await sellerAdaptor.retrieveSellerWalletDetail({
          where: {
            seller_id, $or: [{ status_type: 16 }, { $and: { status_type: [14, 13], is_paytm: true } }]
          },
          attributes: ['id', 'seller_id', 'title', 'job_id', 'order_id', 'user_id', 'transaction_type', 'cashback_source', 'amount', 'status_type', 'is_paytm', 'created_at', [modals.sequelize.literal('(select full_name from users where users.id = "seller_wallet".user_id)'), 'user_name']], order: [['created_at', 'desc']]
        });
        const assigned_cashback = _lodash2.default.sumBy(result.filter(item => item.transaction_type === 1), 'amount');
        const redeemed_cashback = _lodash2.default.sumBy(result.filter(item => item.transaction_type === 2), 'amount');
        return reply.response({
          status: true, message: 'Successful', result,
          total_cashback: (assigned_cashback || 0) - (redeemed_cashback || 0),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerOffers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerOffers({
            where: { seller_id },
            attributes: ['id', 'seller_id', 'title', 'description', 'start_date', 'end_date', 'document_details']
          }),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerCredits(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const credits_per_user = [];
        const credits = await sellerAdaptor.retrieveSellerCreditsPerUser({
          where: { seller_id }, include: {
            model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'image_name', 'mobile_no', 'email'], required: true
          }, order: [['user_id'], ['transaction_type']], group: ['user_id', 'transaction_type', modals.sequelize.literal('"user"."id"')], attributes: ['user_id', 'transaction_type', [modals.sequelize.literal('sum(amount)'), 'total_credit']]
        });
        credits.forEach(item => {
          const user_credit = credits_per_user.find(cuItem => cuItem.user_id === item.user_id);
          item.name = item.user.name;
          item.image_name = item.user.image_name;
          item.mobile_no = item.user.mobile_no;
          item.email = item.user.email;
          item = _lodash2.default.omit(item, 'user');
          const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.address || {};
          item.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
          item.user_address_detail = item.user_address_detail.trim();
          if (user_credit) {
            switch (item.transaction_type) {
              case 1:
                switch (user_credit.transaction_type) {
                  case 1:
                    user_credit.total_credit += item.total_credit;
                    break;
                  case 2:
                    user_credit.total_credit -= item.total_credit;
                    break;
                }
                break;
              case 2:
                switch (user_credit.transaction_type) {
                  case 1:
                    user_credit.total_credit -= item.total_credit;
                    break;
                  case 2:
                    user_credit.total_credit += item.total_credit;
                    break;
                }
                break;
            }
          } else {
            credits_per_user.push(item);
          }
        });

        return reply.response({
          status: true,
          message: 'Successful',
          result: credits_per_user,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerLoyaltyPoints(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const points_per_user = [];
        const points = await sellerAdaptor.retrieveSellerLoyaltyPointsPerUser({
          where: { seller_id }, include: {
            model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'image_name', 'mobile_no', 'email'], required: true
          }, order: [['user_id'], ['transaction_type']], group: ['user_id', 'transaction_type', modals.sequelize.literal('"user"."id"')], attributes: ['user_id', 'transaction_type', [modals.sequelize.literal('sum(amount)'), 'total_points']]

        });
        points.forEach(item => {
          const user_point = points_per_user.find(cuItem => cuItem.user_id === item.user_id);
          item.name = item.user.name;
          item.image_name = item.user.image_name;
          item.mobile_no = item.user.mobile_no;
          item.email = item.user.email;
          item = _lodash2.default.omit(item, 'user');
          const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.address || {};
          item.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
          item.user_address_detail = item.user_address_detail.trim();
          if (user_point) {
            switch (item.transaction_type) {
              case 1:
                switch (user_point.transaction_type) {
                  case 1:
                    user_point.total_points += item.total_points;
                    break;
                  case 2:
                    user_point.total_points -= item.total_points;
                    break;
                }
                break;
              case 2:
                switch (user_point.transaction_type) {
                  case 1:
                    user_point.total_points -= item.total_points;
                    break;
                  case 2:
                    user_point.total_points += item.total_points;
                    break;
                }
                break;
            }
          } else {
            points_per_user.push(item);
          }
        });

        return reply.response({
          status: true,
          message: 'Successful',
          result: points_per_user,
          forceUpdate: request.pre.forceUpdate

        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerConsumers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const { mobile_no, offer_id, is_linked_offers, linked_only, user_status_type } = request.query || {};
        const seller_customers = await sellerAdaptor.retrieveSellerConsumers(seller_id, mobile_no, offer_id, user_status_type);
        return reply.response({
          status: true,
          message: 'Successful',
          result: offer_id ? is_linked_offers && is_linked_offers === 'false' ? seller_customers.filter(item => !item.linked_offer) : seller_customers.filter(item => item.linked_offer) : mobile_no || !linked_only ? seller_customers : seller_customers.filter(item => item.linked),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve users for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerConsumerCashBacks(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const seller_customers = await sellerAdaptor.retrieveSellerConsumerCashBack(seller_id);
        return reply.response({
          status: true,
          message: 'Successful',
          result: seller_customers,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve users for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerConsumerTransactions(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const seller_customers = await sellerAdaptor.retrieveSellerConsumerTransactions(seller_id);
        return reply.response({
          status: true,
          message: 'Successful',
          result: _lodash2.default.orderBy(seller_customers, ['total_transactions'], ['desc']),
          total_transactions: _lodash2.default.sumBy(seller_customers, 'total_transactions') || 0,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve users for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerConsumerDetails(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, customer_id } = request.params;
        const { mobile_no } = request.query || {};
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerCustomerDetail(seller_id, customer_id, mobile_no),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to retrieve users for seller',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerTransactions(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, customer_id } = request.params;
        const transaction_list = await sellerAdaptor.retrieveSellerTransactions({
          where: JSON.parse(JSON.stringify({
            seller_id, user_id: customer_id, admin_status: { $ne: 2 }
          })),
          attributes: ['id', 'home_delivered', 'cashback_status', 'copies', [modals.sequelize.literal(`(select sum(purchase_cost) from consumer_products as product where product.user_id = "cashback_jobs"."user_id" and product.job_id = "cashback_jobs"."job_id" and product.seller_id = ${seller_id})`), 'amount_paid'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and seller_credit.user_id = "cashback_jobs"."user_id" and seller_credit.seller_id = ${seller_id})`), 'total_credits'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16,14) and transaction_type = 2 and seller_credit.user_id = "cashback_jobs"."user_id" and seller_credit.seller_id = ${seller_id})`), 'redeemed_credits'], 'created_at', [modals.sequelize.literal(`(select full_name from users where users.id = "cashback_jobs"."user_id")`), 'user_name'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and loyalty_wallet.user_id = "cashback_jobs"."user_id" and loyalty_wallet.seller_id = ${seller_id})`), 'total_loyalty'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16, 14) and transaction_type = 2 and loyalty_wallet.user_id = "cashback_jobs"."user_id" and loyalty_wallet.seller_id = ${seller_id})`), 'redeemed_loyalty'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id" and user_wallet.seller_id = ${seller_id})`), 'total_cashback'], [modals.sequelize.literal(`(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "cashback_jobs"."user_id" and expense_skus.seller_id = ${seller_id} and expense_skus.job_id = "cashback_jobs"."id" )`), 'item_counts']],
          order: [['created_at', 'desc']]
        });

        return reply.response({
          status: true, message: 'Successful',
          total_transactions: _lodash2.default.sumBy(transaction_list, 'amount_paid') || 0,
          total_cashbacks: _lodash2.default.sumBy(transaction_list, 'total_cashback') || 0,
          result: transaction_list,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve transactions for consumer selected',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveTransactions(request, reply) {
    try {
      const user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.forceUpdate) {
        const { seller_id } = request.params;
        const transaction_list = await shopEarnAdaptor.retrieveCashBackTransactions(JSON.parse(JSON.stringify({
          seller_id,
          user_id: user.id,
          admin_status: { $ne: 2 }
        })));

        return reply.response({
          status: true, message: 'Successful',
          total_transactions: _lodash2.default.sumBy(transaction_list, 'amount_paid') || 0,
          total_cashbacks: _lodash2.default.sumBy(transaction_list, 'total_cashback') || 0,
          result: transaction_list,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve transactions for consumer selected',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerConsumerCredits(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, customer_id } = request.params;
        const { job_id } = request.query;
        const where = job_id ? {
          seller_id, user_id: customer_id, transaction_type: job_id ? {
            $notIn: modals.sequelize.literal(`(select transaction_type from table_wallet_seller_credit as credit where credit.job_id = ${job_id})`)
          } : [1, 2], job_id: null
        } : {
          seller_id, user_id: customer_id, transaction_type: [1, 2]
        };
        const result = await sellerAdaptor.retrieveSellerCreditsPerUser({
          where, attributes: ['title', 'description', 'transaction_type', 'amount', 'created_at', 'id', 'user_id'],
          order: [['created_at', 'desc']]
        });
        return reply.response({
          status: true,
          message: 'Successful',
          total_credits: _lodash2.default.sumBy(result.filter(item => item.transaction_type === 1), 'amount') - _lodash2.default.sumBy(result.filter(item => item.transaction_type === 2), 'amount'), result,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve credits for select customer',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateSellerConsumerCredits(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, customer_id, credit_id, job_id } = request.params;
        const { description } = request.payload || {};
        const credit_wallet = await sellerAdaptor.retrieveOrCreateSellerCredits({ seller_id, id: credit_id, user_id: customer_id }, { job_id, description });
        if (credit_wallet) {
          return reply.response({
            status: true,
            message: 'Successful',
            result: credit_wallet,
            forceUpdate: request.pre.forceUpdate
          });
        }

        return reply.response({
          status: false,
          message: 'Unable to link credit with job.',
          forceUpdate: request.pre.forceUpdate
        });
      }
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to update.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateSellerConsumerPoints(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, customer_id, point_id, job_id } = request.params;
        const { description } = request.payload || {};
        const loyalty_wallet = await sellerAdaptor.retrieveOrCreateSellerPoints({ seller_id, id: point_id, user_id: customer_id }, { job_id, description });
        if (loyalty_wallet) {
          return reply.response({
            status: true,
            message: 'Successful',
            result: loyalty_wallet,
            forceUpdate: request.pre.forceUpdate
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid identity of seller, customer and loyalty.',
          forceUpdate: request.pre.forceUpdate
        });
      }
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to update/link loyalty points with job.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveSellerConsumerPoints(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, customer_id } = request.params;
        const { job_id } = request.query;
        const where = job_id ? {
          seller_id, user_id: customer_id, transaction_type: {
            $notIn: modals.sequelize.literal(`(select transaction_type from table_wallet_seller_loyalty as loyalty where loyalty.job_id = ${job_id})`)
          }, job_id: null
        } : {
          seller_id, user_id: customer_id, transaction_type: [1, 2]
        };
        const result = await sellerAdaptor.retrieveSellerLoyaltyPointsPerUser({
          where, attributes: ['title', 'id', 'description', 'user_id', 'transaction_type', 'amount', 'created_at'],
          order: [['created_at', 'desc']]
        });
        return reply.response({
          status: true,
          message: 'Successful',
          total_points: _lodash2.default.sumBy(result.filter(item => item.transaction_type === 1), 'amount') - _lodash2.default.sumBy(result.filter(item => item.transaction_type === 2), 'amount'),
          result,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve loyalty points for customer.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteAssistedServiceUsers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, id } = request.params;
        await sellerAdaptor.deleteSellerAssistedServiceUsers({ seller_id, id });

        return reply.response({
          status: true,
          message: 'Successful',
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to delete selected assisted service.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteAssistedServiceTypes(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, service_user_id, id } = request.params;
        const seller_assisted_services = await sellerAdaptor.retrieveSellerAssistedServices({ where: { seller_id, service_user_id } });
        if (seller_assisted_services.length > 1) {
          const seller_assisted_service = seller_assisted_services.find(item => item.id === parseInt(id));
          if (seller_assisted_service) {
            await sellerAdaptor.deleteSellerAssistedServiceTypes({ seller_id, service_user_id, id });

            return reply.response({
              status: true,
              message: 'Successful',
              forceUpdate: request.pre.forceUpdate
            });
          }

          return reply.response({
            status: false,
            message: 'Service type is not linked with service user.',
            forceUpdate: request.pre.forceUpdate
          });
        }
        return reply.response({
          status: false,
          message: 'Service user should have more than one services or you should delete the user.',
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to delete selected assisted service.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteOffer(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, id } = request.params;
        await sellerAdaptor.deleteSellerOffers({ where: { seller_id, id } });

        return reply.response({
          status: true,
          message: 'Successful',
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Unable to delete selected assisted service.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getBrandsForSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let category_id = (request.query.category_id || '').split(',');
        category_id = category_id.length > 0 ? category_id : undefined;
        const options = {
          status_type: 1, category_id
        };
        let [brand_id, category_details] = await _bluebird2.default.all([modals.sequelize.query(`Select distinct(brand_id) from brand_details where status_type = 1 and category_id in (${category_id.join(',')})`), modals.categories.findAll({
          where: { category_id },
          attributes: ['category_id', 'category_name', 'ref_id', 'priority_index']
        })]);
        category_details = category_details.map(item => item.toJSON());
        let result = await _bluebird2.default.all(category_details.map(item => modals.brands.findAll({
          where: JSON.parse(JSON.stringify({
            status_type: 1,
            $or: [{
              category_ids: {
                $contains: [{
                  'main_category_id': parseInt(item.category_id || 0)
                }]
              }
            }, {
              category_ids: {
                $contains: [{
                  'category_id': parseInt(item.category_id || 0)
                }]
              }
            }, {
              category_ids: {
                $contains: [{
                  'sub_category_id': parseInt(item.category_id || 0)
                }]
              }
            }, {
              brand_id: brand_id[0].length > 0 ? brand_id[0].map(item => item.brand_id) : undefined
            }]
          })), include: [{
            model: modals.brandDetails,
            where: JSON.parse(JSON.stringify(options)),
            as: 'details',
            attributes: ['category_id'],
            required: false
          }], order: [['brand_name', 'ASC']],
          attributes: [['brand_name', 'brandName'], ['brand_id', 'id'], 'category_ids']
        })));
        return reply.response({
          status: true,
          message: 'Successful',
          result: _lodash2.default.orderBy(category_details.map((item, index) => {
            const filter_brands = result[index].map(bItem => bItem.toJSON());
            item.brands = filter_brands.map(bItem => _lodash2.default.omit(bItem, ['category_ids', 'details']));
            return item;
          }), ['priority_index', 'category_name']),
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
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
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveStates(request, reply) {
    try {
      return reply.response({
        result: await generalAdaptor.retrieveStates({
          attributes: ['id', 'state_name']
        }), status: true
      });
    } catch (err) {
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
        status: false
      });
    }
  }

  static async retrieveCities(request, reply) {
    try {
      const { state_id } = request.params;
      return reply.response(JSON.parse(JSON.stringify({
        status: true, cities: await generalAdaptor.retrieveCities({ where: { state_id }, attributes: ['id', 'name', 'state_id'] })
      })));
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
        message: 'Unable to retrieve cities.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async retrieveLocalities(request, reply) {
    try {
      const { state_id, city_id } = request.params;
      return reply.response(JSON.parse(JSON.stringify({
        status: true, localities: await generalAdaptor.retrieveLocalities({
          where: { city_id, state_id },
          attributes: ['id', 'name', 'pin_code', 'city_id', 'state_id']
        })
      })));
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
        message: 'Unable to retrieve localities.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }
}

exports.default = SellerController;