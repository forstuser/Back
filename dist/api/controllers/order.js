/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _notification = require('../adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _order = require('../adaptors/order');

var _order2 = _interopRequireDefault(_order);

var _user = require('../adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _sellers = require('../adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _shop_earn = require('../adaptors/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _socket = require('../socket');

var _socket2 = _interopRequireDefault(_socket);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let orderAdaptor, eHomeAdaptor, notificationAdaptor, userAdaptor, modals, socket_instance, sellerAdaptor, shopEarnAdaptor;

const payment_status = {
  SUCCESS: 16,
  FAILED: 18,
  PENDING: 13,
  CANCELLED: 17,
  FLAGGED: 8,
  VALIDATION_ERROR: 9
};

class OrderController {
  constructor(modal, socket) {
    orderAdaptor = new _order2.default(modal);
    notificationAdaptor = new _notification2.default(modal);
    userAdaptor = new _user2.default(modal);
    modals = modal;
    socket_instance = socket;
    sellerAdaptor = new _sellers2.default(modals, notificationAdaptor);
    shopEarnAdaptor = new _shop_earn2.default(modals);
  }

  static async getOrderDetails(request, reply) {
    const user = request.user || _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const { id } = request.params;
        let result = await orderAdaptor.retrieveOrUpdateOrder({
          where: { id },
          attributes: ['id', 'order_details', 'order_type', 'collect_at_store', 'in_review', 'status_type', 'seller_id', 'user_id', 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], [modals.sequelize.literal('(Select copies from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'copies'], [modals.sequelize.literal('(Select job_id from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'upload_id'], [modals.sequelize.literal('(Select admin_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'admin_status'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']]
        }, {}, false);
        if (result) {
          result.seller = {};
          result.user = {};
          let measurement_types = [],
              order_payment;
          [result.seller, result.user, measurement_types, result.user_address, result[result.order_type === 2 ? 'service_user' : 'delivery_user'], result.seller_review, order_payment] = await Promise.all([sellerAdaptor.retrieveSellerDetail({
            where: { id: result.seller_id }, attributes: ['seller_name', 'address', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'contact_no', 'email', [modals.sequelize.literal(`(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`), 'ratings'], [modals.sequelize.json(`"seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller_details"->'business_details'`), 'business_details'], 'customer_ids', [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${result.user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16, 14) and transaction_type = 2 and seller_credit.user_id = ${result.user_id} and seller_credit.seller_id = "sellers"."id")`), 'redeemed_credits']]
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
          }) : undefined, sellerAdaptor.retrieveSellerReviews({ offline_seller_id: result.seller_id, order_id: id }), orderAdaptor.retrieveOrUpdatePaymentDetails({
            where: {
              order_id: id, seller_id: result.seller_id,
              user_id: result.user_id
            }
          })]);

          result.seller.customer_ids = (result.seller.customer_ids || []).find(item => (item.customer_id ? item.customer_id : item).toString() === result.user_id.toString());
          result.seller.customer_ids = result.seller.customer_ids && result.seller.customer_ids.customer_id ? result.seller.customer_ids : {
            customer_id: result.seller.customer_ids,
            is_credit_allowed: false,
            credit_limit: 0
          };
          result.is_credit_allowed = result.seller.customer_ids.is_credit_allowed;
          result.credit_limit = result.seller.customer_ids.credit_limit + (result.seller.redeemed_credits || 0) - (result.seller.credit_total || 0);
          result.payment_status = (order_payment || {}).status_type;
          result.payment_ref_id = (order_payment || {}).ref_id;
          result.payment_mode_id = (order_payment || {}).payment_mode_id;
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

            result.delivery_review = (result[service_user_key].reviews || [{}]).find(item => item.order_id.toString() === id.toString());
          }

          result.seller_review = result.seller_review[0];
          result.order_details = Array.isArray(result.order_details) ? result.order_details.map(item => {
            item.uid = item.id;
            if (item.sku_measurement && item.sku_measurement.measurement_type) {
              const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
              item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
              item.uid = `${item.uid}-${item.sku_measurement.id}`;
            }
            if (item.updated_measurement && item.updated_measurement.measurement_type) {
              const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
              item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
            }

            item.offer_discount = parseFloat((item.offer_discount || 0).toString());

            item.current_unit_price = item.sku_measurement ? item.sku_measurement.mrp : 0;
            if (item.suggestion) {
              item.current_unit_price = item.sku_measurement ? item.sku_measurement.mrp : 0;
              item.unit_price = parseFloat((item.unit_price ? item.unit_price : item.suggestion && item.suggestion.sku_measurement ? item.suggestion.sku_measurement.mrp : 0).toString());
              item.suggestion.offer_discount = parseFloat((item.suggestion.offer_discount || 0).toString());
              item.current_selling_price = parseFloat((item.current_unit_price * parseFloat(item.quantity)).toString());
            } else {
              item.unit_price = item.unit_price ? item.unit_price : item.current_unit_price;

              item.current_selling_price = parseFloat((item.unit_price * parseFloat(item.quantity)).toString());
            }
            item.selling_price = parseFloat((item.unit_price * parseFloat(item.quantity)).toString());
            if (item.updated_quantity) {
              item.selling_price = parseFloat((item.unit_price * parseFloat(item.updated_quantity)).toString());
            }

            item.current_selling_price = _lodash2.default.round(item.current_selling_price - item.current_selling_price * item.offer_discount / 100, 2);
            item.selling_price = _lodash2.default.round(item.suggestion ? item.selling_price - item.selling_price * item.suggestion.offer_discount / 100 : item.selling_price - item.selling_price * item.offer_discount / 100, 2);
            return item;
          }) : result.order_details;
          result.total_amount = result.total_amount || _lodash2.default.round(result.order_type && result.order_type === 1 ? _lodash2.default.sumBy(result.order_details, 'selling_price') : _lodash2.default.sumBy(result.order_details, 'total_amount'), 2);
          if (result.user_address) {
            const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = result.user_address || {};
            result.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
            result.user_address_detail = result.user_address_detail.trim();
          }
          if (user.seller_detail && result.status_type === 4 && !result.in_review) {
            await orderAdaptor.retrieveOrUpdateOrder({ where: { id }, attributes: ['id', 'in_review'] }, { in_review: true }, false);
            result.in_review = true;
            await _socket2.default.notify_user_socket({ user_id: result.user_id, order: result });
          }

          return reply.response({
            result: JSON.parse(JSON.stringify(user.seller_detail ? _lodash2.default.omit(result, ['seller', 'user_address', 'copies']) : result)), status: true
          });
        } else {
          return reply.response({ message: 'No order matches for the request.', status: false });
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
        let { status_type, page_no } = request.query;
        status_type = status_type || [5, 15, 17, 18];
        const include = seller_id ? [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }] : [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = "user"."id" and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details'], 'customer_ids']
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }];
        const orderResult = await orderAdaptor.retrieveOrderList({
          where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type })),
          limit: !page_no ? 100 : _main2.default.ORDER_LIMIT,
          offset: !page_no || page_no && (page_no.toString() === '0' || isNaN(page_no)) ? 0 : _main2.default.ORDER_LIMIT * parseInt(page_no), attributes: ['id', 'order_details', 'order_type', 'collect_at_store', 'status_type', 'seller_id', 'user_id', 'in_review', [modals.sequelize.literal('(Select my_seller_ids from table_user_index as user_index where user_index.user_id = "order".user_id)'), 'my_seller_ids'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], [modals.sequelize.literal('(Select payment_mode_id from table_payments as payment where payment.order_id = "order".id)'), 'payment_mode_id'], 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], [modals.sequelize.literal('(Select admin_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'admin_status'], 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']],
          include, order: [['id', 'desc']]
        });
        return reply.response({
          result: orderResult.orders,
          order_count: orderResult.order_count,
          last_page: orderResult.order_count > _main2.default.ORDER_LIMIT ? Math.ceil(orderResult.order_count / _main2.default.ORDER_LIMIT) - 1 : 0,
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
        let user_index_data, message;
        if (!user.seller_detail) {
          user_index_data = await userAdaptor.retrieveUserIndexedData({
            where: { user_id }, attributes: ['my_seller_ids']
          });
        }
        message = user_index_data && (user_index_data.my_seller_ids && user_index_data.my_seller_ids.length === 0 || !user_index_data.my_seller_ids) || !user_index_data ? _main2.default.ORDER_NO_SELLER_MSG : _main2.default.NO_ORDER_MSG;
        const { seller_id } = request.params;
        let { status_type, page_no } = request.query;
        status_type = status_type ? status_type : !user.seller_detail ? [2, 4, 16, 19, 20, 21] : [4, 16, 19, 20, 21];
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
        const orderResult = await orderAdaptor.retrieveOrderList({
          where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type })),
          include, order: [['id', 'desc']],
          limit: !page_no ? 100 : _main2.default.ORDER_LIMIT, offset: !page_no || page_no && (page_no.toString() === '0' || isNaN(page_no)) ? 0 : _main2.default.ORDER_LIMIT * parseInt(page_no),
          attributes: ['id', 'order_details', 'order_type', 'collect_at_store', 'status_type', 'seller_id', 'user_id', 'in_review', [modals.sequelize.literal('(Select my_seller_ids from table_user_index as user_index where user_index.user_id = "order".user_id)'), 'my_seller_ids'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], [modals.sequelize.literal('(Select admin_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'admin_status'], 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']]
        });
        return reply.response({
          result: orderResult.orders,
          order_count: orderResult.order_count,
          last_page: orderResult.order_count > _main2.default.ORDER_LIMIT ? Math.ceil(orderResult.order_count / _main2.default.ORDER_LIMIT) - 1 : 0,
          seller_exist: !!(user_index_data && user_index_data.my_seller_ids && user_index_data.my_seller_ids.length > 0), status: true,
          message
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
        const orderResult = await orderAdaptor.retrieveOrderList({
          where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type, order_type: 2 })),
          include, order: [['created_at', 'desc']]
        });
        return reply.response({
          result: orderResult.orders,
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
        const orderResult = await orderAdaptor.retrieveOrderList({
          where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type, order_type: 2 })),
          include, order: [['created_at', 'desc']]
        });
        return reply.response({
          result: orderResult.orders,
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
        let { seller_id, order_type, collect_at_store, service_type_id, user_address, user_address_id, service_name } = request.payload;
        user_address = user_address || {};
        user_address.user_id = user_id;
        user_address.updated_by = user_id;
        const result = await socket_instance.place_order({
          seller_id, user_id, order_type, collect_at_store, service_type_id,
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

  static async reOrderOrderFromConsumer(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { order_id } = request.params;
        let { seller_id } = request.payload;
        const user_id = user.id;
        const result = await socket_instance.re_order_by_user({ seller_id, user_id, order_id, status_type: 4 });
        if (result) {
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({
            message: 'Unable to re-order, as order is not in auto cancelled state.',
            status: false
          });
        }

        return reply.response({
          message: 'Make sure order is in cancelled state.',
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
        let { user_id, delivery_user_id, order_details, total_amount } = request.payload;
        const result = await socket_instance.order_out_for_delivery({
          seller_id, user_id, order_id, total_amount,
          status_type: 19, delivery_user_id, order_details
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
        let { seller_id, payment_mode } = request.payload;
        payment_mode = payment_mode || 1;
        const user_id = user.id;
        const result = await socket_instance.mark_order_complete({ seller_id, user_id, order_id, status_type: 5, payment_mode });
        if (result) {
          if (result.order_type === 1 || result.collect_at_store) {
            const expense_id = result.expense_id;
            result.digital_bill = await OrderController.retrieveDigitalBillDetail(expense_id, order_id);
          }
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

  static async deleteSKUFromOrderDetail(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { order_id, sku_id } = request.params;
        let { seller_id } = request.payload;
        const user_id = user.id;
        const order = await orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id } }, {}, false);
        const sku_item = order.order_details.find(item => item.id.toString() === sku_id);
        order.order_details = order.order_details.filter(item => item.id.toString() !== sku_id);
        if (order.order_details.length > 0) {
          let result = await orderAdaptor.retrieveOrUpdateOrder({
            where: { id: order_id, user_id, seller_id },
            include: [{
              model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
            }, {
              model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', 'user_id', 'customer_ids', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
            }, {
              model: modals.user_addresses,
              as: 'user_address',
              attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
            }],
            attributes: ['id', 'order_details', 'order_type', 'collect_at_store', 'in_review', 'status_type', 'seller_id', 'user_id', 'created_at', 'updated_at', 'is_modified', 'user_address_id', 'delivery_user_id', 'job_id', 'expense_id', [modals.sequelize.literal('(Select cashback_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'cashback_status'], [modals.sequelize.literal('(Select status_type from table_payments as payment where payment.order_id = "order".id)'), 'payment_status'], [modals.sequelize.literal('(Select payment_mode_id from table_payments as payment where payment.order_id = "order".id)'), 'payment_mode_id'], [modals.sequelize.literal('(Select copies from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'copies'], [modals.sequelize.literal('(Select job_id from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'upload_id'], [modals.sequelize.literal('(Select admin_status from table_cashback_jobs as jobs where jobs.id = "order".job_id)'), 'admin_status'], [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount'], [modals.sequelize.literal('(Select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "order".job_id)'), 'available_cashback']]
          }, order, false);
          if (result) {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: result.seller.user_id,
              payload: {
                order_id: result.id, order_type: result.order_type,
                collect_at_store: result.collect_at_store,
                status_type: result.status_type, user_id,
                title: `Item returned.`, notification_type: 1,
                description: `An Item, '${sku_item.title}${sku_item.sku_measurement ? sku_item.sku_measurement.measurement_value + ' ' + sku_item.sku_measurement.measurement_acronym : ''}' has been returned by ${result.user.name || ''}.`, notification_id: result.id
              }
            });
          } else {
            result = await socket_instance.cancel_order_by_user({ seller_id, user_id, order_id, status_type: 17 });
          }

          result.seller.customer_ids = (result.seller.customer_ids || []).find(item => (item.customer_id ? item.customer_id : item).toString() === result.user_id.toString());
          result.seller.customer_ids = result.seller.customer_ids && result.seller.customer_ids.customer_id ? result.seller.customer_ids : {
            customer_id: result.seller.customer_ids,
            is_credit_allowed: false,
            credit_limit: 0
          };
          result.is_credit_allowed = result.seller.customer_ids.is_credit_allowed;
          result.credit_limit = result.seller.customer_ids.credit_limit + (result.seller.redeemed_credits || 0) - (result.seller.credit_total || 0);
          return reply.response({ result, status: true });
        } else if (result && result === false) {
          return reply.response({ message: 'Unable to return sku from order.', status: false });
        }

        return reply.response({
          message: 'Make sure order is in cancelled state.',
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

  static async generateSignature(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const { appId, orderId, orderAmount, orderCurrency, orderNote, customerName, customerPhone, customerEmail, returnUrl, notifyUrl, paymentModes, pc } = request.payload;
        let postData = request.payload,
            secretKey = _main2.default.CASH_FREE.SECRET_KEY,
            sorted_keys = Object.keys(postData),
            signatureData = '',
            k;
        postData.returnUrl = `${_main2.default.API_HOST}${_main2.default.CASH_FREE.POST_BACK_URL}`;
        postData.notifyUrl = `${_main2.default.API_HOST}${_main2.default.CASH_FREE.POST_BACK_URL}`;
        let order_detail = await modals.order.findOne({ where: { id: orderId } });
        order_detail = order_detail ? order_detail.toJSON() : order_detail;
        if (order_detail) {
          const { seller_id, user_id, id: order_id } = order_detail;
          const defaults = {
            order_id, user_id, seller_id,
            amount: orderAmount,
            payment_mode_id: 4,
            ref_id: `${user_id.toString(36)}ABBA${order_id.toString(36)}ABBA${Math.random().toString(36).substr(2, 9)}ABBA${seller_id.toString(36)}${appId.toString(36)}`,
            updated_by: user_id,
            status_type: 4
          };
          let payment_detail = await orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { order_id, seller_id, user_id } }, defaults);
          postData.orderId = payment_detail.ref_id;
          sorted_keys = Object.keys(postData);
          sorted_keys.sort();
          for (let i = 0; i < sorted_keys.length; i++) {
            k = sorted_keys[i];
            signatureData += k + postData[k].toString();
          }
          postData['signature'] = _crypto2.default.createHmac('sha256', secretKey.toString()).update(signatureData).digest('base64');
          payment_detail = await orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { order_id, seller_id, user_id } }, {
            signature: postData['signature'],
            payment_detail: { requests: [postData] }
          });
          return reply.response({ status: true, result: postData, payment_detail });
        }

        return reply.response({
          status: false,
          message: 'Not a valid order id.',
          forceUpdate: request.pre.forceUpdate
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

  static async paymentPostBackUrl(request, reply) {
    try {
      const { orderId, orderAmount, referenceId, txStatus, paymentMode, txMsg, txTime, signature } = request.payload;
      let order_id = parseInt(orderId.split('ABBA')[1], 36);
      let postData = {
        orderId, orderAmount, referenceId, txStatus,
        paymentMode, txMsg, txTime
      },
          secretKey = _main2.default.CASH_FREE.SECRET_KEY,
          sorted_keys = Object.keys(postData),
          signatureData = '',
          k;
      for (let i = 0; i < sorted_keys.length; i++) {
        k = sorted_keys[i];
        signatureData += k + postData[k].toString();
      }

      const computed_signature = _crypto2.default.createHmac('sha256', secretKey.toString()).update(signatureData).digest('base64');

      let payment_data = await orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { $or: { ref_id: orderId, order_id } } });
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 10,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      if (payment_data) {
        let payment_info = payment_data;
        payment_data.payment_detail.responses = payment_data.payment_detail.responses || [];
        payment_data.payment_detail.responses.push(request.payload);
        [payment_data, payment_info] = await Promise.all([
        /*orderAdaptor.retrieveOrUpdatePaymentDetails(
            {where: {id: payment_data.id}}, {
              status_type: payment_data.status_type,
              amount: payment_data.amount,
            }),*/orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { id: payment_data.id } }, payment_data)]);
        /*if (payment_data.status_type === 16) {
          await OrderController.creditPaymentToSeller(payment_data);
        }*/
        return reply.response('<!DOCTYPE html><html><head> <title>CashFree</title> <style>.loaderDiv{width: 100%; /* center a div insie another div*/ display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; align-items: center;}.loader{border: 16px solid #f3f3f3; border-radius: 50%; border-top: 16px solid #3498db; width: 120px; height: 120px; -webkit-animation: spin 2s linear infinite; margin: auto; margin-top:50%; animation: spin 2s linear infinite; padding:5px;}/* Safari */ @-webkit-keyframes spin{0%{-webkit-transform: rotate(0deg);}100%{-webkit-transform: rotate(360deg);}}@keyframes spin{0%{transform: rotate(0deg);}100%{transform: rotate(360deg);}}</style></head><body> <div class="loaderDiv"> <div class="loader"></div></div></body></html>');
      }
      return reply.response({ status: false });
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

  static async retrievePaymentStatus(request, reply) {
    try {
      const { order_id: ref_id } = request.params;
      let order_id = parseInt(ref_id.split('ABBA')[1], 36);
      let secretKey = _main2.default.CASH_FREE.SECRET_KEY,
          appId = _main2.default.CASH_FREE.APP_ID;
      let payment_detail = await orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { ref_id, order_id } });
      if (payment_detail && payment_detail.status_type !== 13 && payment_detail.status_type !== 8 && payment_detail.status_type !== 4) {
        if (payment_detail.status_type === 16) {
          await OrderController.creditPaymentToSeller(payment_detail);
        }
        const order_detail = await orderAdaptor.retrieveOrderDetail({ where: { id: order_id }, attributes: ['expense_id'] });
        return reply.response({
          status: true,
          status_type: payment_detail.status_type,
          expense_id: order_detail.expense_id
        });
      }

      const result = await (0, _requestPromise2.default)({
        url: `${_main2.default.CASH_FREE.HOST}${_main2.default.CASH_FREE.STATUS_API}`,
        method: 'POST', headers: {
          'Content-Type': 'content-type: application/x-www-form-urlencoded',
          'cache-control': 'no-cache'
        },
        formData: { appId, secretKey, orderId: ref_id }
      });

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 10,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          response: result, order_id
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      const { status, txStatus } = JSON.parse(result);
      if (status === 'OK' && txStatus) {
        payment_detail.status_type = payment_status[txStatus];

        payment_detail = await orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { ref_id, order_id } }, payment_detail);
        if (payment_detail.status_type === 16) {
          await OrderController.creditPaymentToSeller(payment_detail);
        }

        const order_detail = await orderAdaptor.retrieveOrderDetail({ where: { id: order_id }, attributes: ['expense_id'] });
        return reply.response({
          status: true,
          status_type: payment_detail.status_type,
          expense_id: order_detail.expense_id
        });
      }

      return reply.response({ status: false });
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

  static async creditPaymentToSeller(payment_detail) {
    const [seller_wallet, seller, user_detail] = await Promise.all([orderAdaptor.addPaymentToSellerWallet({
      status_type: 16, order_id: payment_detail.order_id,
      seller_id: payment_detail.seller_id,
      amount: payment_detail.amount,
      transaction_type: 1, cashback_source: 4,
      user_id: payment_detail.user_id
    }), sellerAdaptor.retrieveSellerDetail({
      where: { id: payment_detail.seller_id },
      attributes: ['seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveSingleUser({
      where: { id: payment_detail.user_id },
      attributes: [['full_name', 'name']]
    })]);

    if (seller_wallet.wallet_credited) {
      await Promise.all([notificationAdaptor.notifyUserCron({
        seller_user_id: seller.user_id, payload: {
          title: `Amount credited.`,
          description: `An amount of ₹${payment_detail.amount} has been credited to your BB Wallet against Order #${payment_detail.order_id}.`,
          notification_type: 3, notification_id: Math.random()
        }
      }), socket_instance.mark_order_complete({
        seller_id: payment_detail.seller_id,
        user_id: payment_detail.user_id,
        order_id: payment_detail.order_id,
        status_type: 5, payment_mode: 4
      })]);
    }
  }

  static async retrieveDigitalBill(request, reply) {
    try {

      const { expense_id, order_id } = request.params;
      const bill_detail = await OrderController.retrieveDigitalBillDetail(expense_id, order_id);
      if (bill_detail) {
        return reply.response({ status: true, result: bill_detail });
      }

      return reply.response({ status: true, message: 'No Bill Detail found for the Order.' });
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
        message: 'Unable to retrieve bill for order.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveDigitalBillDetail(expense_id, order_id) {
    expense_id = expense_id === 'null' || !expense_id ? 0 : expense_id;
    let [expense_sku, payment_item, order] = await Promise.all([shopEarnAdaptor.retrieveUserSKUExpenses({
      where: { expense_id }, attributes: ['sku_id', [modals.sequelize.literal('(select title from table_sku_global as sku where sku.id = expense_sku_items.sku_id)'), 'title'], [modals.sequelize.literal('(select hsn_code from table_sku_global as sku where sku.id = expense_sku_items.sku_id)'), 'hsn_code'], [modals.sequelize.literal('(select sub_category_id from table_sku_global as sku where sku.id = expense_sku_items.sku_id)'), 'sub_category_id'], [modals.sequelize.literal('(select priority_index from table_sku_global as sku where sku.id = expense_sku_items.sku_id)'), 'priority_index'], [modals.sequelize.literal('(select tax from table_sku_measurement_detail as sku_measure where sku_measure.id = expense_sku_items.sku_measurement_id)'), 'tax'], [modals.sequelize.literal('(select pack_numbers from table_sku_measurement_detail as sku_measure where sku_measure.id = expense_sku_items.sku_measurement_id)'), 'pack_numbers'], [modals.sequelize.literal('(Select acronym from table_sku_measurement as measurement where measurement.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = expense_sku_items.sku_measurement_id limit 1))'), 'measurement_acronym'], [modals.sequelize.literal('(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = expense_sku_items.sku_measurement_id limit 1)'), 'measurement_value'], [modals.sequelize.literal('(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = expense_sku_items.sku_measurement_id limit 1)'), 'bar_code'], 'sku_measurement_id', 'quantity', 'created_at', 'available_cashback', 'selling_price', 'job_id']
    }), orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { order_id } }), orderAdaptor.retrieveOrderDetail({
      where: { id: order_id }, attributes: ['seller_id', 'job_id', [modals.sequelize.literal('(Select purchase_cost from consumer_products as expense where expense.id = "order".expense_id)'), 'total_amount']]
    })]);
    if (expense_sku) {
      let [seller, cash_back] = await Promise.all([sellerAdaptor.retrieveSellerDetail({
        where: { id: order.seller_id }, attributes: ['seller_name', 'contact_no', 'address', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = sellers.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = sellers.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = sellers.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'), 'pin_code'], 'latitude', 'longitude', 'url', 'email', 'gstin', 'pan_no']
      }), modals.cashback_wallet.aggregate('amount', 'sum', {
        where: {
          job_id: order.job_id, transaction_type: [1, 2],
          status_type: [16, 14]
        }
      })]);

      payment_item.expense_detail = expense_sku.map(item => {
        item.tax_percent = item.tax / 2;
        item.non_tax_value = item.selling_price / ((100 + item.tax_percent) / 100);
        item.sgst_value = item.selling_price - item.non_tax_value;
        item.cgst_value = item.selling_price - item.non_tax_value;

        return item;
      });

      payment_item.total_amount = _lodash2.default.round(order.total_amount, 2);
      payment_item.total_quantity = _lodash2.default.sumBy(expense_sku, 'quantity');
      payment_item.seller_name = seller.seller_name;
      payment_item.gstin = seller.gstin;
      payment_item.cash_back = _lodash2.default.round(cash_back || 0, 2);
      payment_item.contact_no = seller.contact_no;
      const { address, state_name, city_name, locality_name, pin_code, latitude, longitude } = seller;
      payment_item.address = `${address ? address : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
      return payment_item;
    }

    return undefined;
  }
}

exports.default = OrderController;