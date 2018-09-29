/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _order = require('../Adaptors/order');

var _order2 = _interopRequireDefault(_order);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let orderAdaptor, eHomeAdaptor, notificationAdaptor, userAdaptor, modals, socket_instance, sellerAdaptor;

class OrderController {
  constructor(modal, socket) {
    orderAdaptor = new _order2.default(modal);
    notificationAdaptor = new _notification2.default(modal);
    userAdaptor = new _user2.default(modal);
    modals = modal;
    socket_instance = socket;
    sellerAdaptor = new _sellers2.default(modals, notificationAdaptor);
  }

  static async getOrderDetails(request, reply) {
    const user = request.user || _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const { id } = request.params;
        const result = await orderAdaptor.retrieveOrUpdateOrder({
          where: { id },
          attributes: ['id', 'order_details', 'order_type', 'status_type', 'seller_id', 'user_id', 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], [modals.sequelize.literal('(Select copies from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'copies'], [modals.sequelize.literal('(Select job_id from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'upload_id'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']]
        }, {}, false);
        if (result) {
          result.seller = {};
          result.user = {};
          let measurement_types = [];
          [result.seller, result.user, measurement_types, result.user_address, result[result.order_type === 2 ? 'service_user' : 'delivery_user'], result.seller_review] = await Promise.all([sellerAdaptor.retrieveSellerDetail({
            where: { id: result.seller_id }, attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings'], [modals.sequelize.json(`"seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller_details"->'business_details'`), 'business_details']]
          }), userAdaptor.retrieveUserById({ id: result.user_id }, result.user_address_id), modals.measurement.findAll({ where: { status_type: 1 } }), userAdaptor.retrieveUserAddress({
            where: JSON.parse(JSON.stringify({ id: result.user_address_id }))
          }), result.delivery_user_id ? sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: result.delivery_user_id })),
            attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types', where: JSON.parse(JSON.stringify({
                service_type_id: result.order_details[0].service_type_id
              })), model: modals.seller_service_types, required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          }) : undefined, sellerAdaptor.retrieveSellerReviews({ offline_seller_id: result.seller_id, order_id: id })]);
          let review_users = [];
          if (result.delivery_user_id) {
            const service_user_key = result.order_type === 2 ? 'service_user' : 'delivery_user';
            result[service_user_key].ratings = _lodash2.default.sumBy(result[service_user_key].reviews || [{ ratings: 0 }], 'ratings') / (result[service_user_key].reviews || [{ ratings: 0 }]).length;
            result[service_user_key].service_type = result[service_user_key].service_types.find(item => item.service_type_id === result.order_details[0].service_type_id);
            result[service_user_key].rating = result[service_user_key].ratings;
            const review_user_ids = (result[service_user_key].reviews || []).map(item => item.updated_by);
            review_users = await userAdaptor.retrieveUsers({ where: { id: review_user_ids } });
            result[service_user_key].reviews = (result[service_user_key].reviews || []).map(item => {
              item.user = review_users.find(uItem => uItem.id === item.updated_by);
              item.user_name = (item.user || {}).name;
              return item;
            });
          }

          result.seller_review = result.seller_review[0];
          result.order_details = Array.isArray(result.order_details) ? result.order_details.map(item => {
            if (item.sku_measurement && item.sku_measurement.measurement_type) {
              const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
              item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
            }
            if (item.updated_measurement && item.updated_measurement.measurement_type) {
              const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
              item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
            }

            item.unit_price = parseFloat((item.unit_price || 0).toString());
            item.selling_price = item.selling_price ? parseFloat(item.selling_price.toString()) : parseFloat((item.unit_price * parseFloat(item.quantity)).toString());
            if (item.updated_quantity) {
              item.updated_selling_price = item.updated_selling_price ? parseFloat(item.updated_selling_price.toString()) : parseFloat((item.unit_price * parseFloat(item.updated_quantity)).toString());
            }

            return item;
          }) : result.order_details;
          if (result.user_address) {
            const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = result.user_address || {};
            result.user_address_detail = `${address_line_1}${address_line_2 ? ` ${address_line_2}` : ''},${locality_name},${city_name},${state_name}-${pin_code}`;
            console.log(result.user_address_detail);
            result.user_address_detail = result.user_address_detail.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
          }
          return reply.response({
            result: JSON.parse(JSON.stringify(result)), status: true
          });
        } else {
          return reply.response({
            message: 'No order matches for the request.', status: false
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getOrderList(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const user_id = !user.seller_detail ? user.id : undefined;
        let user_index_data;
        if (!user.seller_detail) {
          user_index_data = userAdaptor.retrieveUserIndexedData({
            where: { user_id: user.id }, attributes: ['my_seller_ids']
          });
        }
        const { seller_id } = request.params;
        let { status_type } = request.query;
        status_type = status_type || [5, 17, 18];
        const include = seller_id ? [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }] : [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }];
        return reply.response({
          result: await orderAdaptor.retrieveOrderList({
            where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type })),
            attributes: ['id', 'order_details', 'order_type', 'status_type', 'seller_id', 'user_id', [modals.sequelize.literal('(Select my_seller_ids from table_user_index as user_index where user_index.user_id = "order".user_id)'), 'my_seller_ids'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']],
            include, order: [['id', 'desc']]
          }),
          seller_exist: user_index_data && user_index_data.my_seller_ids && user_index_data.my_seller_ids.length > 0,
          status: true
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
        message: 'Unable to retrieve orders.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getActiveOrders(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const user_id = !user.seller_detail ? user.id : undefined;
        let user_index_data;
        if (!user.seller_detail) {
          user_index_data = await userAdaptor.retrieveUserIndexedData({
            where: { user_id }, attributes: ['my_seller_ids']
          });
        }
        const { seller_id } = request.params;
        let { status_type } = request.query;
        status_type = status_type || [4, 16, 19, 20, 21];
        const include = seller_id ? [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }] : [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }];
        console.log('\n\n\n\n\n\n\n', user_index_data, user_index_data && user_index_data.my_seller_ids && user_index_data.my_seller_ids.length > 0);
        return reply.response({
          result: await orderAdaptor.retrieveOrderList({
            where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type })),
            include, order: [['id', 'desc']],
            attributes: ['id', 'order_details', 'order_type', 'status_type', 'seller_id', 'user_id', [modals.sequelize.literal('(Select my_seller_ids from table_user_index as user_index where user_index.user_id = "order".user_id)'), 'my_seller_ids'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']]
          }),
          seller_exist: !!(user_index_data && user_index_data.my_seller_ids && user_index_data.my_seller_ids.length > 0),
          status: true
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
        message: 'Unable to retrieve orders.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getAssistedServiceList(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const user_id = !user.seller_detail ? user.id : undefined;
        const { seller_id } = request.params;
        let { status_type } = request.query;
        status_type = status_type || [5, 17, 18];
        const include = seller_id ? [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }] : [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }];
        return reply.response({
          result: await orderAdaptor.retrieveOrderList({
            where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type, order_type: 2 })),
            include, order: [['created_at', 'desc']]
          }),
          status: true
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
        message: 'Unable to retrieve orders.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async getActiveAssistedServices(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const user_id = !user.seller_detail ? user.id : undefined;
        const { seller_id } = request.params;
        let { status_type } = request.query;
        status_type = status_type || [4, 16, 19];
        const include = seller_id ? [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }] : [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }];
        return reply.response({
          result: await orderAdaptor.retrieveOrderList({
            where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type, order_type: 2 })),
            include, order: [['created_at', 'desc']]
          }),
          status: true
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
        message: 'Unable to retrieve orders.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async placeOrder(request, reply) {
    const user = request.user || _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const user_id = user.id;
        let { seller_id, order_type, service_type_id, user_address, user_address_id, service_name } = request.payload;
        user_address = user_address || {};
        user_address.user_id = user_id;
        user_address.updated_by = user_id;
        const result = await socket_instance.place_order({
          seller_id, user_id, order_type, service_type_id,
          user_address, user_address_id, service_name
        });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Please select a valid address for order.',
            status: false
          });
        }

        return reply.response({
          message: `Looks like you haven't added any item in your wishlist yet.`,
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async modifyOrder(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const { seller_id, order_id } = request.params;
        let { user_id, order_details, delivery_user_id } = request.payload;
        console.log(JSON.stringify(request.payload));
        const result = await socket_instance.modify_order({ seller_id, user_id, order_details, order_id, delivery_user_id });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Order updation failed.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in valid state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async approveOrder(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, order_id } = request.params;
        let { user_id, seller_id: payload_seller_id, order_details } = request.payload;
        seller_id = seller_id || payload_seller_id;
        user_id = user_id || user.id;
        const result = await socket_instance.approve_order({
          seller_id, user_id, order_id, status_type: 16,
          is_user: !user.seller_detail, order_details
        });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Order approval failed.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in valid state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async startOrder(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, order_id } = request.params;
        let { user_id, seller_id: payload_seller_id, order_details } = request.payload;
        seller_id = seller_id || payload_seller_id;
        user_id = user_id || user.id;
        const result = await socket_instance.start_order({
          seller_id, user_id, order_id, status_type: 19, order_details
        });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Order approval failed.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in valid state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async endOrder(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, order_id } = request.params;
        let { user_id, seller_id: payload_seller_id, order_details } = request.payload;
        seller_id = seller_id || payload_seller_id;
        user_id = user_id || user.id;
        const result = await socket_instance.end_order({
          seller_id, user_id, order_id, status_type: 19, order_details
        });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Order approval failed.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in valid state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async rejectOrderFromConsumer(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { order_id } = request.params;
        let { seller_id } = request.payload;
        const user_id = user.id;
        const result = await socket_instance.reject_order_by_user({ seller_id, user_id, order_id, status_type: 18 });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Unable to reject order, as order is not in new state.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in new state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async cancelOrderFromConsumer(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { order_id } = request.params;
        let { seller_id } = request.payload;
        const user_id = user.id;
        const result = await socket_instance.cancel_order_by_user({ seller_id, user_id, order_id, status_type: 17 });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Unable to cancel order, as order is not in new state.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in new state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async rejectOrderFromSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { order_id, seller_id } = request.params;
        let { user_id } = request.payload;
        const result = await socket_instance.reject_order_by_seller({ seller_id, user_id, order_id, status_type: 18 });
        if (result) {
          return reply.response({ status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Unable to reject order, as order is not in new state.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in new state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async orderOutForDelivery(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, order_id } = request.params;
        let { user_id, delivery_user_id, order_details } = request.payload;
        const result = await socket_instance.order_out_for_delivery({
          seller_id,
          user_id,
          order_id,
          status_type: 19,
          delivery_user_id,
          order_details
        });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Order approval failed.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in valid state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async completeOrder(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { order_id } = request.params;
        let { seller_id } = request.payload;
        const user_id = user.id;
        const result = await socket_instance.mark_order_complete({ seller_id, user_id, order_id, status_type: 5 });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Unable to complete order, as order is not in new state.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in approved/out for delivery state.',
          status: false
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
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
        message: 'Unable to retrieve order by id.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }
}

exports.default = OrderController;