/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _shop_earn = require('../Adaptors/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _job = require('../Adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _google = require('../../helpers/google');

var _google2 = _interopRequireDefault(_google);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals;
let shopEarnAdaptor;
let jobAdaptor;
let userAdaptor;
let sellerAdaptor;

class SellerController {
  constructor(modal) {
    shopEarnAdaptor = new _shop_earn2.default(modal);
    jobAdaptor = new _job2.default(modal);
    userAdaptor = new _user2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
    modals = modal;
  }

  static async getMySellers(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: { user_id },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        });

        let { search_value, limit, offset, latitude, longitude, city } = request.query || {};
        const { seller_offer_ids, my_seller_ids: sid } = user_index_data || {};
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

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveSellers({
            user_id, seller_offer_ids, limit, offset,
            latitude, longitude, city
          }, {
            where: JSON.parse(JSON.stringify({
              sid, $or: { seller_name, contact_no }
            })),
            attributes: [['sid', 'id'], ['seller_name', 'name'], 'owner_name', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'location_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = sid) as cashback_total,(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = sid) as loyalty_total,(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = sid) as credit_total, ${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = sid)` : 0} as offer_count`)]
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
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
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        });
        let { my_seller_ids, seller_offer_ids } = user_index_data || {};
        let { search_value, limit, offset, latitude, longitude, city } = request.query || {};
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

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveSellers({
            user_id, seller_offer_ids, latitude, longitude,
            limit, city, offset
          }, {
            where: JSON.parse(JSON.stringify({
              $or: { seller_name, contact_no },
              status_type: [1, 11]
            })),
            attributes: [['sid', 'id'], ['seller_name', 'name'], 'owner_name', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'location_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = sid) as cashback_total,(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = sid) as loyalty_total,(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = sid) as credit_total, ${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = sid)` : 0} as offer_count`)]
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
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
          attributes: ['my_seller_ids', 'seller_offer_ids']
        });

        let { search_value, limit, offset, latitude, longitude, city } = request.query || {};
        const { seller_offer_ids } = user_index_data || {};
        const { sid } = request.params;
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

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveSellerById({ user_id, seller_offer_ids }, {
            where: JSON.parse(JSON.stringify({
              sid, $or: { seller_name, contact_no }
            })),
            attributes: [['sid', 'id'], ['seller_name', 'name'], 'owner_name', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'location_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = sid) as cashback_total,(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = sid) as loyalty_total,(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = sid) as credit_total, ${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = sid)` : 0} as offer_count`)]
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
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
        const [user_index_data, seller_exist] = await Promise.all([userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        }), sellerAdaptor.doesSellerExist({ sid: request.params.id })]);
        if (seller_exist) {
          let { seller_offer_ids, my_seller_ids } = user_index_data || {};

          my_seller_ids = my_seller_ids || [];
          const already_in_list = my_seller_ids.includes(parseInt(request.params.id));
          if (!user_index_data) {
            my_seller_ids.push(parseInt(request.params.id));
            await userAdaptor.createUserIndexedData({ my_seller_ids, user_id }, { where: { user_id } });
          } else if (!already_in_list) {
            my_seller_ids.push(parseInt(request.params.id));
            await userAdaptor.updateUserIndexedData({ my_seller_ids }, { where: { user_id } });
          } else {

            return reply.response({
              status: false,
              message: 'Seller already in your list.'
            });
          }

          return reply.response({
            status: true,
            result: (await sellerAdaptor.retrieveSellers({ user_id, seller_offer_ids }, {
              where: JSON.parse(JSON.stringify({ sid: request.params.id })),
              attributes: [['sid', 'id'], ['seller_name', 'name'], 'owner_name', 'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded', 'address', 'city_id', 'state_id', 'location_id', 'latitude', 'longitude', 'url', 'contact_no', 'email', 'seller_type_id', modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = sid) as cashback_total,(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = sid) as loyalty_total,(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = sid) as credit_total, ${seller_offer_ids && seller_offer_ids.length > 0 ? `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids || []).join(',')}) and seller_offers.seller_id = sid)` : 0} as offer_count,(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = sid) as ratings`)]
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
          user_id: user ? user.id || user.ID : undefined,
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
        const [user_index_data] = await Promise.all([userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        })]);

        let { seller_offer_ids, my_seller_ids } = user_index_data || {};
        my_seller_ids = (my_seller_ids || []).filter(item => item !== parseInt(request.params.id));
        await userAdaptor.updateUserIndexedData({ my_seller_ids }, { where: { user_id } });

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
          user_id: user ? user.id || user.ID : undefined,
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
          seller_name, contact_no, email, address, city_id, state_id, location_id, gstin,
          pan_no, reg_no, longitude, latitude
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
        const [user_index_data, seller] = await Promise.all([userAdaptor.retrieveUserIndexedData({
          where: { user_id, status_type: [1, 11] },
          attributes: ['my_seller_ids', 'seller_offer_ids']
        }), sellerAdaptor.retrieveOrCreateSellers(seller_options, JSON.parse(JSON.stringify({
          seller_name, contact_no, email, address, city_id,
          status_type: 11, state_id, location_id, gstin,
          updated_by: user_id, pan_no, reg_no, longitude, latitude,
          seller_type_id: 4
        })))]);
        seller.id = seller.sid;
        let { seller_offer_ids, my_seller_ids } = user_index_data || {};

        my_seller_ids = my_seller_ids || [];
        const already_in_list = my_seller_ids.includes(parseInt(seller.id));
        if (!user_index_data) {
          my_seller_ids.push(parseInt(seller.id));
          await userAdaptor.createUserIndexedData({ my_seller_ids, user_id }, { where: { user_id } });
        } else if (!already_in_list) {
          my_seller_ids.push(parseInt(seller.id));
          await userAdaptor.updateUserIndexedData({ my_seller_ids }, { where: { user_id } });
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
          user_id: user ? user.id || user.ID : undefined,
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
}

exports.default = SellerController;