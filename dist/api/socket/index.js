'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _sellers = require('../adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _user = require('../adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _shop_earn = require('../adaptors/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _product = require('../adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _job = require('../adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _order = require('../adaptors/order');

var _order2 = _interopRequireDefault(_order);

var _notification = require('../adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _category = require('../adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _adminAdaptor = require('../adaptors/adminAdaptor');

var _adminAdaptor2 = _interopRequireDefault(_adminAdaptor);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _sms = require('../../helpers/sms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let connected_socket, modals, sellerAdaptor, shopEarnAdaptor, io, userAdaptor, orderAdaptor, notificationAdaptor, productAdaptor, jobAdaptor, categoryAdaptor, adminAdaptor;

/*//controller file
import { io } from "../../server";
const socketController = async socket => {
  console.log("socket connection from: " + socket.user.username);
  socket.on("message", async (data, acknowledge) => {
    await require("./message")(io, socket, data, acknowledge);
  });
});*/

class SocketServer {
  constructor(props) {
    io = _socket2.default.listen(props.server.listener);
    modals = props.models;
    shopEarnAdaptor = new _shop_earn2.default(modals);
    userAdaptor = new _user2.default(modals);
    orderAdaptor = new _order2.default(modals);
    notificationAdaptor = new _notification2.default(modals);
    sellerAdaptor = new _sellers2.default(modals, notificationAdaptor);
    productAdaptor = new _product2.default(modals);
    jobAdaptor = new _job2.default(modals);
    categoryAdaptor = new _category2.default(modals);
    adminAdaptor = new _adminAdaptor2.default(modals);
    io.use(SocketServer.socketAuth);
    io.on('connect', socket => {
      connected_socket = socket;
      socket.on('init', SocketServer.init);
      socket.on('admin_approval', SocketServer.admin_approval);
      socket.on('place_order', SocketServer.place_order);
      socket.on('modify_order', SocketServer.modify_order);
      socket.on('approve_order', SocketServer.approve_order);
      socket.on('order_out_for_delivery', SocketServer.order_out_for_delivery);
      socket.on('reject_order_by_seller', SocketServer.reject_order_by_seller);
      socket.on('reject_order_by_user', SocketServer.reject_order_by_user);
      socket.on('cancel_order_by_user', SocketServer.cancel_order_by_user);
      socket.on('mark_order_complete', SocketServer.mark_order_complete);
      socket.on('start_order', SocketServer.start_order);
      socket.on('end_order', SocketServer.end_order);
    });
  }

  static async socketAuth(socket, next) {
    try {
      const token = socket.handshake.query.token;
      if (!token) {
        socket.status = false;
        return next(new Error('authentication error'));
      }
      const decoded = await _shared2.default.isAccessTokenBasic(token);

      let user = await (decoded.seller_detail ? modals.seller_users.findOne({
        where: JSON.parse(JSON.stringify({ role_type: 6, id: decoded.id }))
      }) : modals.users.findOne({
        where: JSON.parse(JSON.stringify({ role_type: 5, id: decoded.id }))
      }));

      if (!user) {
        socket.status = false;
        return next(new Error('authentication error'));
      }

      console.log({
        decoded,
        seller_detail: decoded.seller_detail,
        seller_room: `seller-${decoded.id}`
      });
      socket.status = true;
      socket.join(decoded.seller_detail ? `seller-${decoded.id}` : `user-${decoded.id}`);
      socket.user = user;
      return next();
    } catch (e) {
      console.log(e);
    }
  }

  static async notify_user_socket(parameters) {
    const { user_id, seller_user_id, order } = parameters;
    if (io.sockets.adapter.rooms[`user-${user_id}`]) {
      io.sockets.in(`user-${user_id}`).emit('order-placed', JSON.stringify({ order, user_id }));
    }
    await notificationAdaptor.notifyUserCron({
      user_id, payload: {
        user_id, order_id: order.id, order,
        order_type: order.order_type,
        collect_at_store: order.collect_at_store,
        status_type: order.status_type,
        title: `Seller ${order.seller.seller_name || ''} is currently reviewing your Order.`,
        description: 'We will update you on your order status shortly.',
        notification_type: 31
      }
    });
  }

  static async init(data) {
    console.log('We are here');
    if (data.is_seller) {
      await modals.sellers.update({ socket_id: connected_socket.id }, { where: { id: data.id } });
    } else {
      await modals.users.update({ socket_id: connected_socket.id }, { where: { id: data.id } });
    }

    connected_socket.to(connected_socket.id).emit('registered', { socket_id: connected_socket.id });
  }

  static async admin_approval(data) {
    console.log('We are here');
    if (data.verified_seller) {
      console.log(io.sockets.adapter.rooms[`seller-${data.seller_id}`]);
      if (io.sockets.adapter.rooms[`seller-${data.seller_id}`]) {
        io.sockets.in(`seller-${data.seller_id}`).emit('request-approval', shopEarnAdaptor.retrievePendingTransaction({ seller_id: data.seller_id, id: data.job_id }));
      }
    }
    if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
      io.sockets.in(`user-${data.user_id}`).emit('request-approval', shopEarnAdaptor.retrieveCashBackTransaction({
        seller_id: data.seller_id,
        id: data.job_id,
        user_id: data.user_id
      }));
    }
  }

  static async place_order(data, fn) {
    let { seller_id, user_id, order_type, collect_at_store, user_address_id, user_address, service_type_id, service_name } = data;
    user_address = user_address || {};
    user_address.user_id = user_id;
    user_address.updated_by = user_id;
    let [seller_detail, user_index_data, user_address_detail, service_users, seller_skus, seller_sku_offers] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id }, attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'user_id', 'id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'home_delivery'`), 'home_delivery'], 'contact_no']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), !user_address_id && user_address ? userAdaptor.createUserAddress(JSON.parse(JSON.stringify(user_address))) : undefined, service_type_id ? sellerAdaptor.retrieveSellerAssistedServiceUsers({
      include: {
        as: 'service_types', where: { seller_id, service_type_id },
        model: modals.seller_service_types, required: true,
        attributes: ['service_type_id', 'seller_id', 'price', 'id']
      }, attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details', 'profile_image_detail', [modals.sequelize.literal(`(Select count(*) as order_counts from table_orders as orders where (orders."order_details"->'service_user'->>'id')::numeric = assisted_service_users.id and orders.status_type = 19)`), 'order_counts']]
    }) : undefined, order_type === 1 ? sellerAdaptor.retrieveSellerSKUs({ where: { seller_id } }) : [], order_type === 1 ? sellerAdaptor.retrieveSellerOffers({
      where: {
        seller_id, on_sku: true,
        end_date: { $gte: (0, _moment2.default)().format() }
      },
      attributes: ['sku_id', 'sku_measurement_id', 'offer_discount', 'seller_mrp']
    }) : [], SocketServer.linkSellerWithUser(seller_id, user_id)]);
    if (!user_address_id && !user_address_detail) {
      return false;
    }
    user_address_id = user_address_id || user_address_detail.toJSON().id;
    if (seller_detail) {
      if ((order_type === 1 || collect_at_store) && user_index_data.wishlist_items && user_index_data.wishlist_items.length > 0) {
        const order_details = user_index_data.wishlist_items.map(item => {
          const { id, title, brand_id, quantity, category_id, sku_measurement, sub_category_id, main_category_id } = item;
          const { id: sku_measurement_id, mrp, bar_code, pack_numbers, cashback_percent, measurement_type, measurement_value } = sku_measurement || {};
          const seller_sku_detail = seller_sku_offers.find(skuItem => skuItem.sku_id.toString() === id.toString() && sku_measurement_id.toString() === skuItem.sku_measurement_id.toString());
          console.log({ seller_sku_detail });
          const offer_discount = (seller_sku_detail || {}).offer_discount || 0;
          const unit_price = (seller_sku_detail || {}).seller_mrp || (sku_measurement || {}).mrp || 0;
          let selling_price = unit_price * item.quantity;
          selling_price = _lodash2.default.round(selling_price - selling_price * offer_discount / 100, 2);
          return {
            item_availability: true, id, title, brand_id,
            uid: `${id}${sku_measurement_id ? `-${sku_measurement_id}` : ''}`,
            quantity, category_id, sub_category_id, main_category_id,
            unit_price, selling_price, offer_discount,
            sku_measurement: sku_measurement ? {
              id: sku_measurement_id, mrp, bar_code, pack_numbers,
              cashback_percent, measurement_type, measurement_value
            } : undefined
          };
        });
        let order = await orderAdaptor.placeNewOrder({
          seller_id, user_id, order_details, order_type, collect_at_store,
          status_type: 4, user_address_id
        });

        if (order) {
          order = await orderAdaptor.retrieveOrUpdateOrder({
            where: { id: order.id, user_id, seller_id },
            include: [{
              model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
            }, {
              model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
            }, {
              model: modals.user_addresses,
              as: 'user_address',
              attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
            }]
          }, {}, false);
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            console.log({
              soket_status: io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`],
              user_id: seller_detail.user_id
            });
            io.sockets.in(`seller-${seller_detail.user_id}`).emit('order-placed', JSON.stringify(order));
          }
          await _bluebird2.default.all([notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, order_type, collect_at_store,
              status_type: order.status_type, user_id,
              title: `${user_index_data.user_name || ''} has placed an order.`,
              description: 'Check out the Order details in BinBill Partner App.',
              notification_type: 1, notification_id: order.id
            }
          }), (0, _sms.sendSMS)(`${user_index_data.user_name || ''} has placed an order, Check out the Order details in BinBill Partner App.`, [seller_detail.contact_no])]);
          console.log({
            soket_status: io.sockets.adapter.rooms[`user-${data.user_id}`],
            user_id: data.user_id
          });
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit('order-placed', JSON.stringify({
              order_id: order.id, order_type, collect_at_store,
              status_type: order.status_type, order, user_id
            }));
          }
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, order_type, collect_at_store,
              status_type: order.status_type, order, user_id,
              title: /*seller_detail.rush_hours ?
                     `Delayed Response.` :*/
              `Your order has been placed with Seller ${seller_detail.seller_name || ''}.`, description: /*seller_detail.rush_hours ?
                                                                                                         `Seller ${seller_detail.seller_name ||
                                                                                                         ''} response may be delayed as the Seller is currently Busy.` :*/
              'Click here to track your order status.',
              notification_type: 31
            }
          });

          await shopEarnAdaptor.updatePastWishList(user_id);

          setTimeout(async () => {
            await SocketServer.auto_cancel_order({
              order, user_id, order_type,
              collect_at_store, seller_detail, user_index_data
            });
          }, _main2.default.AUTO_CANCELLATION_TIMING * 60 * 1000);
          return order;
        }
      } else if (service_users && service_users.length > 0) {
        service_users = service_users.map(item => {
          item.ratings = _lodash2.default.sumBy(item.reviews || [{ ratings: 0 }], 'ratings') / (item.reviews || [{ ratings: 0 }]).length;
          item.service_name = service_name;
          return item;
        });

        let order = await orderAdaptor.placeNewOrder({
          seller_id, user_address_id, order_type,
          collect_at_store, status_type: 4, user_id,
          order_details: [{ service_type_id, service_name }]
        });

        if (order) {
          order = await orderAdaptor.retrieveOrUpdateOrder({
            where: { id: order.id, user_id, seller_id },
            include: [{
              model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
            }, {
              model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
            }, {
              model: modals.user_addresses,
              as: 'user_address',
              attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
            }]
          }, {}, false);
          console.log({
            soket_status: io.sockets.adapter.rooms[`user-${seller_detail.user_id}`],
            user_id: seller_detail.user_id
          });

          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit('assisted-status-change', JSON.stringify(order));
          }
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, order_type, collect_at_store,
              status_type: order.status_type, service_users, user_id,
              title: `${user_index_data.user_name || ''} has placed an order.`,
              description: 'Please click here for further detail.',
              notification_type: 1, notification_id: order.id
            }
          });

          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit('assisted-status-change', JSON.stringify({
              order_id: order.id, order_type, collect_at_store,
              status_type: order.status_type, order, user_id
            }));
          }
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, order_type, collect_at_store,
              status_type: order.status_type, order, user_id,
              title: `Your order has been placed with Seller ${seller_detail.seller_name || ''}.`,
              description: /*seller_detail.rush_hours ?
                           `Seller ${seller_detail.seller_name ||
                           ''} response may be delayed as the Seller is currently Busy.` :*/
              'Click here to track your order status.',
              notification_type: 31
            }
          });
          setTimeout(async () => {
            await SocketServer.auto_cancel_order({
              order, user_id,
              order_type, collect_at_store,
              seller_detail,
              user_index_data
            });
          }, _main2.default.AUTO_CANCELLATION_TIMING * 60 * 1000);
          return order;
        }
      } else {
        return undefined;
      }
    }
  }

  static async modify_order(data, fn) {
    let { seller_id, user_id, order_id, order_details, delivery_user_id } = data;

    const [seller_detail, user_index_data, order_data, measurement_types, service_user, seller_sku_offer] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'user_id', 'id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name'], [modals.sequelize.literal(`(Select location from users where users.id = ${user_id})`), 'location']]
    }), orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id, status_type: 4 } }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } }), delivery_user_id ? sellerAdaptor.retrieveAssistedServiceUser({
      where: JSON.parse(JSON.stringify({ id: delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
        as: 'service_types',
        where: JSON.parse(JSON.stringify({ seller_id })),
        model: modals.seller_service_types,
        required: true,
        attributes: ['service_type_id', 'seller_id', 'price', 'id']
      }
    }) : undefined, sellerAdaptor.retrieveSellerOffers({
      where: {
        seller_id, on_sku: true,
        end_date: { $gte: (0, _moment2.default)().format() }
      },
      attributes: ['sku_id', 'sku_measurement_id', 'offer_discount', 'seller_mrp']
    })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      if (order_data.order_type === 2) {
        order_data.order_details[0].service_user = order_data.order_details[0].service_user || { id: delivery_user_id, name: service_user.name };
      } else if (order_data.order_type === 1) {
        let sku_item_promise = [],
            sku_measurement_promise = [],
            measurement_values = [];
        order_data.order_details.forEach(item => {
          if (!item.item_availability && item.suggestion) {
            const { title, measurement_value } = item.suggestion;
            if (!item.suggestion.id) {
              measurement_values.push(measurement_value);
              sku_item_promise.push(shopEarnAdaptor.addUserSKU({
                title: `${title}${measurement_value ? `(${measurement_value})` : ''}`,
                status_type: 11
              }));
            } else {
              const { location } = user_index_data;
              const sku_measurement_attributes = location && location.toLowerCase() === 'other' || !location ? ['id', 'pack_numbers', 'measurement_type', 'measurement_value', 'mrp', [modals.sequelize.literal('(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurement".measurement_type)'), 'measurement_acronym'], 'bar_code'] : ['id', 'pack_numbers', 'measurement_type', 'measurement_value', 'mrp', [modals.sequelize.literal('(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurement".measurement_type)'), 'measurement_acronym'], 'bar_code', 'cashback_percent'];
              const sku_attributes = ['sub_category_id', 'main_category_id', 'title', [modals.sequelize.literal('(select category_name from categories as category where category.category_id = sku.sub_category_id)'), 'sub_category_name'], 'brand_id', 'category_id', 'id', 'priority_index'];
              measurement_values.push(measurement_value);
              sku_item_promise.push(shopEarnAdaptor.retrieveSKU({
                where: { id: item.suggestion.id },
                attributes: sku_attributes
              }));
              sku_measurement_promise.push(shopEarnAdaptor.retrieveSKUMeasurement({
                where: {
                  id: item.suggestion.measurement_id,
                  sku_id: item.suggestion.id
                }, attributes: sku_measurement_attributes
              }));
            }
          }
          sku_item_promise.push({});
          measurement_values.push('');
        });
        const [sku_items, sku_measurement_detail] = await _bluebird2.default.all([_bluebird2.default.all(sku_item_promise), _bluebird2.default.all(sku_measurement_promise)]);
        console.log(JSON.stringify({ sku_items }));
        order_data.order_details = order_data.order_details.map((item, index) => {
          if (!item.item_availability && item.suggestion) {
            if (!item.suggestion.id) {
              item.suggestion.id = sku_items[index].id;
            } else {
              const { measurement_id, measurement_value, id } = item.suggestion;
              const seller_sku = seller_sku_offer.find(sellerItem => sellerItem.sku_id.toString() === id.toString() && sellerItem.sku_measurement_id.toString() === measurement_id.toString());
              item.suggestion = sku_items.find(sItem => (sItem.id || '').toString() === id);
              item.suggestion.measurement_value = measurement_value;
              item.suggestion.sku_measurement = sku_measurement_detail.find(mdItem => (mdItem.id || '').toString() === measurement_id);
              item.suggestion.offer_discount = (seller_sku || {}).offer_discount || 0;
              if (item.suggestion.sku_measurement) {
                item.suggestion.sku_measurement.mrp = (seller_sku || {}).seller_mrp || item.suggestion.sku_measurement.mrp || 0;
                item.suggestion.sku_measurement.offer_discount = item.suggestion.offer_discount;
              }
            }
          }

          item.current_unit_price = item.sku_measurement ? item.sku_measurement.mrp : 0;
          item.unit_price = parseFloat((item.unit_price ? item.unit_price : item.suggestion && item.suggestion.sku_measurement ? item.suggestion.sku_measurement.mrp : 0).toString());
          item.current_selling_price = parseFloat((item.current_unit_price * parseFloat(item.quantity)).toString());
          item.current_selling_price = _lodash2.default.round(item.current_selling_price - item.current_selling_price * parseFloat((item.offer_discount || 0).toString()) / 100, 2);
          item.quantity = parseFloat((item.quantity || 0).toString());
          item.selling_price = _lodash2.default.round(parseFloat((item.unit_price * item.quantity).toString()), 2);
          if (item.updated_quantity) {
            item.updated_quantity = parseFloat((item.updated_quantity || 0).toString());
            item.selling_price = parseFloat((item.unit_price * item.updated_quantity).toString());
          }

          item.selling_price = _lodash2.default.round(item.suggestion ? item.selling_price - item.selling_price * parseFloat((item.suggestion.offer_discount || 0).toString()) / 100 : item.selling_price - item.selling_price * parseFloat((item.offer_discount || 0).toString()) / 100, 2);

          return item;
        });
      }
      order_data.is_modified = true;
      order_data.delivery_user_id = delivery_user_id;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: 4 },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      const service_user_key = order.order_type === 2 ? 'service_user' : 'delivery_user';
      if (delivery_user_id) {
        order[service_user_key] = service_user;
        order[service_user_key].ratings = _lodash2.default.sumBy(order[service_user_key].reviews || [{ ratings: 0 }], 'ratings') / (order[service_user_key].reviews || [{ ratings: 0 }]).length;
        if (order.order_type === 2) {
          order[service_user_key].service_type = order[service_user_key].service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
        }
      }
      if (order) {
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          console.log({
            soket_status: io.sockets.adapter.rooms[`user-${data.user_id}`],
            user_id: data.user_id
          });
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order, user_id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: order.order_type === 1 ? `Your Order has been modified by Seller ${seller_detail.seller_name || ''}.` : `${order[service_user_key].name} has been assigned to assist you by Seller ${seller_detail.seller_name}`,
            description: 'Click here to review the details and approve it.',
            notification_type: 31
          }
        });

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async start_order(data, fn) {
    let { seller_id, user_id, order_id, order_details } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id, status_type: 19 } }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.status_type = 20;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: 19 },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
          }
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id,
              order_type: order.order_type,
              collect_at_store: order.collect_at_store,
              status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Service has been initiated${order.service_user ? ` by ${order.service_user.name || ''}.` : '.'}`,
              description: 'Please click here for more details.',
              notification_type: 1, notification_id: order.id,
              start_date: order.order_type === 2 ? order.order_details.start_date : undefined
            }
          });
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order,
            user_id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            start_date: order.order_type ? order.order_details.start_date : undefined
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            user_id,
            status_type: order.status_type,
            is_modified: order.is_modified,
            title: `Service has been initiated ${order.service_user ? `by ${order.service_user.name || ''}.` : '.'}`,
            description: 'Please click here for further detail.',
            notification_type: 31,
            start_date: order.order_type ? order.order_details.start_date : undefined
          }
        });

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async end_order(data, fn) {
    let { seller_id, user_id, order_id, order_details } = data;
    const [seller_detail, user_index_data, order_data, measurement_types, service_user] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'customer_ids', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16, 14) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'redeemed_credits'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id, status_type: 20 } }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } }), sellerAdaptor.retrieveAssistedServiceUser({
      where: JSON.parse(JSON.stringify({ id: order_details[0].service_user.id })),
      attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'],
      include: {
        as: 'service_types', where: JSON.parse(JSON.stringify({
          seller_id,
          service_type_id: order_details[0].service_type_id
        })),
        model: modals.seller_service_types, required: true,
        attributes: ['service_type_id', 'seller_id', 'price', 'id']
      }
    })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.status_type = 21;
      const { start_date, end_date } = order_data.order_details[0];
      const { service_types } = service_user;
      const { price } = service_types[0] || {};
      const total_minutes = (0, _moment2.default)(end_date || (0, _moment2.default)(), _moment2.default.ISO_8601).diff((0, _moment2.default)(start_date, _moment2.default.ISO_8601), 'minutes', true);
      if (Array.isArray(price)) {
        const base_price = price.find(item => item.price_type === 1);
        const other_price = price.find(item => item.price_type !== 1);
        order_data.order_details[0].total_amount = base_price ? base_price.value || 0 : 0;
        if (total_minutes > 60 && other_price) {
          order_data.order_details[0].hourly_price = _lodash2.default.round(Math.ceil((total_minutes - 60) / 30) * other_price.value);
          order_data.order_details[0].total_amount += _lodash2.default.round(Math.ceil((total_minutes - 60) / 30) * other_price.value);
        }
        order_data.order_details[0].base_price = base_price ? base_price.value || 0 : 0;
      } else {
        order_data.order_details[0].total_amount = _lodash2.default.round(Math.ceil(total_minutes / 60) * price.value);
      }
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: 20 },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details'], 'customer_ids', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "seller"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16, 14) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "seller"."id")`), 'redeemed_credits']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      if (order) {

        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        seller_detail.customer_ids = (seller_detail.customer_ids || []).find(item => (item.customer_id ? item.customer_id : item).toString() === user_id.toString());
        seller_detail.customer_ids = seller_detail.customer_ids && seller_detail.customer_ids.customer_id ? seller_detail.customer_ids : {
          customer_id: seller_detail.customer_ids,
          is_credit_allowed: false, credit_limit: 0
        };
        order.total_amount = order.total_amount || _lodash2.default.round(order.order_type && order.order_type === 1 ? _lodash2.default.sumBy(order.order_details, 'selling_price') : _lodash2.default.sumBy(order.order_details, 'total_amount'), 2);
        order.is_credit_allowed = seller_detail.customer_ids.is_credit_allowed;
        order.credit_limit = seller_detail.customer_ids.credit_limit + (seller_detail.redeemed_credits || 0) - (seller_detail.credit_total || 0);
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: `Service has been completed ${order.service_user ? `by ${order.service_user.name || ''}.` : '.'}`,
            description: 'Please click here for further detail.',
            notification_type: 1, notification_id: order.id,
            start_date: order.order_type === 2 ? order.order_details.start_date : undefined,
            end_date: order.order_type === 2 ? order.order_details.end_date : undefined
          }
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order,
            user_id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            start_date: order.order_type ? order.order_details.start_date : undefined,
            end_date: order.order_type ? order.order_details.end_date : undefined
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            status_type: order.status_type,
            notification_type: 31,
            is_modified: order.is_modified,
            user_id,
            title: `Service has been provided${order.service_user ? `by ${order.service_user.name || ''}.` : '.'}`,
            description: 'Please click here for further detail.',
            start_date: order.order_type ? order.order_details.start_date : undefined,
            end_date: order.order_type ? order.order_details.end_date : undefined
          }
        });

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async approve_order(data, fn) {
    let { seller_id, user_id, order_id, status_type, is_user, order_details } = data;
    const [seller_detail, user_index_data, order_data, measurement_types, seller_sku_offers] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: { id: order_id, user_id, seller_id, status_type: 4 }
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } }), sellerAdaptor.retrieveSellerOffers({
      where: {
        seller_id, on_sku: true,
        end_date: { $gte: (0, _moment2.default)().format() }
      },
      attributes: ['sku_id', 'sku_measurement_id', 'offer_discount']
    })]);
    if (order_data) {
      if (order_data.order_type === 2) {
        order_data.order_details = order_details || order_data.order_details;
      } else {
        order_data.order_details = (order_details || order_data.order_details).map(item => {

          if (!item.item_availability && item.suggestion) {
            const { id, title, measurement_value, sku_measurement: sku_measurement_detail, brand_id, offer_discount } = item.suggestion;
            item.id = id;
            item.sku_measurement = sku_measurement_detail;
            if (!sku_measurement_detail) {
              item = _lodash2.default.omit(item, ['sku_measurement']);
            }
            const { id: sku_measurement_id } = item.sku_measurement || {};
            item.uid = `${id}${sku_measurement_id ? `-${sku_measurement_id}` : ''}`;
            item.title = `${title}${measurement_value && !sku_measurement_id ? `(${measurement_value})` : ''}`;
            item.brand_id = brand_id;
            item.offer_discount = offer_discount;
            item.item_availability = true;
          }

          if (item.updated_measurement) {
            item.sku_measurement = item.updated_measurement;
            console.log(JSON.stringify(item.sku_measurement));
            const { id: sku_measurement_id } = item.sku_measurement || {};
            item.uid = `${item.id}${sku_measurement_id ? `-${sku_measurement_id}` : ''}`;
          }

          item.quantity = item.updated_quantity ? parseFloat(item.updated_quantity) : parseFloat(item.quantity);

          item = _lodash2.default.omit(item, ['updated_measurement', 'suggesstion']);
          const offer = seller_sku_offers.find(offerItem => offerItem.sku_id.toString() === item.id.toString() && offerItem.sku_measurement_id.toString() === item.sku_measurement.id.toString());
          item.offer_discount = parseFloat(((offer || {}).offer_discount || 0).toString());
          item.unit_price = parseFloat((item.unit_price || 0).toString());
          item.selling_price = parseFloat((item.unit_price * parseFloat(item.quantity.toString())).toString());
          item.selling_price = _lodash2.default.round(item.selling_price - item.selling_price * item.offer_discount / 100, 2);
          return item;
        }).filter(item => item.item_availability);
      }
      order_data.status_type = status_type || 16;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: 4 },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, JSON.parse(JSON.stringify(order_data)), false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (order.order_details.length > 0) {
          if (is_user) {
            if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
              io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
            }
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id,
                status_type: order.status_type,
                is_modified: order.is_modified,
                user_id,
                title: `${user_index_data.user_name || ''} has approved ${order.order_type === 1 || order.collect_at_store ? `modifications.` : `${order.service_user.name} for assistance.`}`,
                description: 'Click here for more details.',
                notification_type: 1,
                notification_id: order.id,
                order_type: order.order_type,
                collect_at_store: order.collect_at_store
              }
            });
          }
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id,
              is_modified: order.is_modified,
              order_type: order.order_type,
              collect_at_store: order.collect_at_store,
              status_type: order.status_type,
              order,
              user_id
            }));
          }
          if (!is_user) {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                order_type: order.order_type,
                collect_at_store: order.collect_at_store,
                status_type: order.status_type,
                is_modified: order.is_modified,
                user_id,
                title: `Your Order has been approved by Seller ${seller_detail.seller_name || ''}.`,
                description: 'Delivery details will be updated shortly.',
                notification_type: 31
              }
            });
          }
          return order;
        } else {
          return await SocketServer.cancel_order_by_user({ seller_id, user_id, order_id, status_type: 17 });
        }
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async order_out_for_delivery(data, fn) {
    try {
      let { seller_id, user_id, order_id, status_type, delivery_user_id, order_details, total_amount } = data;
      const [seller_detail, user_index_data, order_data, measurement_types, seller_sku_offers] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
        where: { id: seller_id },
        attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id', 'has_pos', 'customer_ids', [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16, 14) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")`), 'redeemed_credits']]
      }), userAdaptor.retrieveUserIndexedData({
        where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
      }), orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: 16 },
        attributes: ['id', 'order_details', 'order_type', 'collect_at_store', 'status_type']
      }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } }), sellerAdaptor.retrieveSellerOffers({
        where: {
          seller_id, on_sku: true,
          end_date: { $gte: (0, _moment2.default)().format() }
        },
        attributes: ['sku_id', 'sku_measurement_id', 'offer_discount']
      })]);

      seller_detail.customer_ids = (seller_detail.customer_ids || []).find(item => (item.customer_id ? item.customer_id : item).toString() === user_id.toString());
      seller_detail.customer_ids = seller_detail.customer_ids && seller_detail.customer_ids.customer_id ? seller_detail.customer_ids : {
        customer_id: seller_detail.customer_ids,
        is_credit_allowed: false, credit_limit: 0
      };
      const seller_sku_mapping = [];
      if (order_data) {
        order_data.order_details = order_details || order_data.order_details;
        if (order_data.order_type === 1) {
          order_data.order_details = order_data.order_details.map(item => {
            const offer = seller_sku_offers.find(sItem => sItem.sku_id.toString() === item.id.toString() && sItem.sku_measurement_id.toString() === (item.sku_measurement || {}).id.toString());
            item.quantity = parseFloat(item.quantity.toString());
            item.unit_price = parseFloat((item.unit_price || 0).toString());
            item.selling_price = parseFloat((item.unit_price * item.quantity).toString());
            const mrp = item.sku_measurement && item.sku_measurement.mrp ? item.sku_measurement.mrp : 0;
            if (mrp.toString() !== item.unit_price.toString() && item.sku_measurement) {
              seller_sku_mapping.push(sellerAdaptor.retrieveOrCreateSellerOffers(JSON.parse(JSON.stringify({
                seller_id, sku_id: item.id,
                sku_measurement_id: item.sku_measurement.id
              })), JSON.parse(JSON.stringify({
                seller_id, start_date: (0, _moment2.default)(), end_date: (0, _moment2.default)(),
                seller_mrp: item.unit_price, sku_id: item.id,
                sku_measurement_id: item.sku_measurement.id,
                on_sku: true, offer_discount: 0
              }))));
            }
            item.offer_discount = parseFloat(((offer || {}).offer_discount || item.offer_discount || 0).toString());
            item.selling_price = item.selling_price > 0 ? item.selling_price : (mrp || 0) * item.quantity;
            item.selling_price = _lodash2.default.round(item.selling_price - item.selling_price * item.offer_discount / 100, 2);
            return item;
          });
        }

        order_data.status_type = status_type || 19;
        order_data.delivery_user_id = delivery_user_id;
        order_data.out_for_delivery_time = (0, _moment2.default)();
        let [order] = await _bluebird2.default.all([orderAdaptor.retrieveOrUpdateOrder({
          where: { id: order_id, user_id, seller_id, status_type: 16 },
          include: [{
            model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
          }, {
            model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details'], 'customer_ids', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "seller"."id")`), 'credit_total'], [modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16, 14) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "seller"."id")`), 'redeemed_credits']]
          }, {
            model: modals.user_addresses, as: 'user_address',
            attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
          }]
        }, order_data, false), ...seller_sku_mapping]);

        if (order) {
          console.log(JSON.stringify({ order }));
          if (order.order_type === 2 && order.delivery_user_id) {
            order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
              where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })),
              attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'],
              include: {
                as: 'service_types',
                where: JSON.parse(JSON.stringify({ seller_id })),
                model: modals.seller_service_types,
                required: true,
                attributes: ['service_type_id', 'seller_id', 'price', 'id']
              }
            });
            order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
            order.service_user.reviews = order.service_user.reviews || [];
            const review_user_ids = order.service_user.reviews.map(item => item.updated_by);
            const review_users = await userAdaptor.retrieveUsers({
              where: { id: review_user_ids }, attributes: ['id', ['full_name', 'name'], 'image_name']
            });
            order.service_user.reviews = order.service_user.reviews.map(item => {
              item.user = review_users.find(uItem => uItem.id === item.updated_by);
              item.user_name = (item.user || {}).name;
              return item;
            });
          }
          order.order_details = order.order_type === 1 ? order.order_details.map(item => {
            if (item.sku_measurement) {
              const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
              item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
            }
            if (item.updated_measurement) {
              const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
              item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
            }

            return item;
          }) : order.order_details;
          if (delivery_user_id && order.order_type === 1) {
            order.delivery_user = await sellerAdaptor.retrieveAssistedServiceUser({
              where: JSON.parse(JSON.stringify({ id: delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details']
            });
            order.delivery_user.ratings = _lodash2.default.sumBy(order.delivery_user.reviews || [{ ratings: 0 }], 'ratings') / (order.delivery_user.reviews || [{ ratings: 0 }]).length;
            order.delivery_user.rating = order.delivery_user.ratings;
            order.delivery_user.reviews = order.delivery_user.reviews || [];
            const review_user_ids = order.delivery_user.reviews.map(item => item.updated_by);
            const review_users = await userAdaptor.retrieveUsers({
              where: { id: review_user_ids }, attributes: ['id', ['full_name', 'name'], 'image_name']
            });
            order.delivery_user.reviews = order.delivery_user.reviews.map(item => {
              item.user = review_users.find(uItem => uItem.id === item.updated_by);
              item.user_name = (item.user || {}).name;
              return item;
            });
          }
          order.total_amount = order.total_amount || _lodash2.default.round(order.order_type && order.order_type === 1 ? _lodash2.default.sumBy(order.order_details, 'selling_price') : _lodash2.default.sumBy(order.order_details, 'total_amount'), 2);
          order.is_credit_allowed = seller_detail.customer_ids.is_credit_allowed;
          order.credit_limit = seller_detail.customer_ids.credit_limit + (seller_detail.redeemed_credits || 0) - (seller_detail.credit_total || 0);
          const { id: order_id, is_modified, status_type, order_type, collect_at_store } = order;
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id, is_modified, status_type,
              delivery_user: order.delivery_user,
              order, user_id, order_type, collect_at_store
            }));
          }

          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, user_id,
              status_type: order.status_type,
              is_modified: order.is_modified,
              title: order.order_type === 1 && order.collect_at_store ? `Your Order #${order.id} is Ready.` : `${order.order_type === 1 ? `Your Order #${order.id} ` : `${(order.delivery_user || {}).name || `Assisted User`} for #${order.id}`} is on it's way.`,
              description: order.order_type === 1 && order.collect_at_store ? `Hurray! Your Order #${order.id} is Ready.Please have your Order Collected from Store.` : `Hurray! ${order.delivery_user ? `${(order.delivery_user || {}).name || ''} from Seller ${seller_detail.seller_name || ''} is on the way ${order.order_type === 1 ? 'with your order.' : 'for your assistance.'}` : `Your Order is on it's way from Seller ${seller_detail.seller_name || ''}`}.Please click here for more detail.`,
              notification_type: 31,
              order_type: order.order_type,
              collect_at_store: order.collect_at_store
            }
          });

          return order;
        } else {
          return false;
        }
      } else {
        return undefined;
      }
    } catch (e) {
      console.log('Error while Out For Delivery:', { e });
      throw e;
    }
  }

  static async reject_order_by_seller(data, fn) {
    let { seller_id, user_id, order_id, status_type } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: {
        id: order_id, user_id, seller_id,
        status_type: 4, is_modified: false
      }, attributes: ['id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.status_type = status_type || 18;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: {
          id: order_id, user_id, seller_id,
          status_type: 4, is_modified: false
        }, include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses, as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            status_type: order.status_type,
            order,
            user_id
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: `Oops! Looks like your order has been rejected by Seller ${seller_detail.seller_name || ''}.`,
            description: 'Please click here for more details.',
            notification_type: 31,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store
          }
        });

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async reject_order_by_user(data, fn) {
    let { seller_id, user_id, order_id, status_type } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: {
        id: order_id, user_id, seller_id,
        status_type: 4, is_modified: true
      },
      attributes: ['id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.status_type = status_type || 18;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: {
          id: order_id, user_id, seller_id,
          status_type: 4, is_modified: true
        },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id, status_type: order.status_type,
            is_modified: order.is_modified, user_id,
            title: `Oops! Looks like ${user_index_data.user_name || ''} is not satisfied by modification in order and rejected the order.`,
            description: 'Please click here for more details.',
            notification_type: 1, notification_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store
          }
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            order, order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            user_id
          }));
        }

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async cancel_order_by_user(data, fn) {
    let { seller_id, user_id, order_id, status_type } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: {
        id: order_id,
        user_id,
        seller_id,
        status_type: [2, 4, 19]
      },
      attributes: ['id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.status_type = status_type || 17;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: {
          id: order_id, user_id, seller_id,
          status_type: [2, 4, 19]
        },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id, status_type: order.status_type,
            is_modified: order.is_modified, user_id,
            title: `Oops! ${user_index_data.user_name || ''} has cancelled the order.`,
            description: 'Please click here for more details.',
            notification_type: 1,
            notification_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store
          }
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            user_id
          }));
        }

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async re_order_by_user(data, fn) {
    let { seller_id, user_id, order_id, status_type } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: { id: order_id, user_id, seller_id, status_type: [2, 4] },
      attributes: ['id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.status_type = 4;
      order_data.in_review = false;
      order_data.is_modified = false;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: {
          id: order_id, user_id, seller_id,
          status_type: [2, 4], is_modified: false
        },
        include: [{
          model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
        }, {
          model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
        }, {
          model: modals.user_addresses,
          as: 'user_address',
          attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
        }]
      }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: `Yay! ${user_index_data.user_name || ''} has re-ordered his last auto cancelled order.`,
            description: 'Please click here for more details.',
            notification_type: 1,
            notification_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store
          }
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            user_id
          }));
        }

        setTimeout(async () => {
          await SocketServer.auto_cancel_order({
            order, user_id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            seller_detail, user_index_data
          });
        }, _main2.default.AUTO_CANCELLATION_TIMING * 60 * 1000);
        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async mark_order_complete(data, fn) {
    let { seller_id, user_id, order_id, status_type, payment_mode } = data;
    const [cash_back_job_count, seller_detail, user_index_data, order_data, measurement_types, seller_loyalty_rules, milk_sku_list, order_payment] = await _bluebird2.default.all([modals.cashback_jobs.count({ where: { user_id, admin_status: { $gt: 2 } } }), sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id }, attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id', 'is_fmcg', 'has_pos', 'is_assisted']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: {
        id: order_id, user_id, seller_id,
        status_type: [16, 19, 21]
      }, attributes: ['id', 'job_id', 'expense_id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } }), sellerAdaptor.retrieveSellerLoyaltyRules(JSON.parse(JSON.stringify({ seller_id }))), shopEarnAdaptor.retrieveSKUData({
      where: JSON.parse(JSON.stringify({
        category_id: _main2.default.MILK_SKU_CATEGORY,
        main_category_id: _main2.default.MILK_SKU_MAIN_CATEGORY
      })), attributes: ['id']
    }), orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { order_id, seller_id, user_id } }, JSON.parse(JSON.stringify({
      payment_mode_id: payment_mode, order_id, seller_id, user_id,
      status_type: payment_mode.toString() !== '5' ? 16 : 13,
      ref_id: payment_mode.toString() !== '4' ? `${user_id.toString(36)}ABBA${order_id.toString(36)}ABBA${Math.random().toString(36).substr(2, 9)}ABBA${seller_id.toString(36)}` : undefined
    })))]);
    let today_sku_expense = 0;
    if (milk_sku_list.length > 0) {
      today_sku_expense = await modals.expense_sku_items.count({
        where: {
          sku_id: milk_sku_list.map(item => item.id),
          created_at: {
            $gte: (0, _moment2.default)().startOf('days'),
            $lte: (0, _moment2.default)().endOf('days')
          }, user_id
        }
      });
    }
    if (order_data) {
      order_data.status_type = status_type || 5;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: {
          id: order_id, user_id, seller_id,
          status_type: [16, 19, 21]
        }
      }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: order.delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({ seller_id })),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id']
            }
          });
          order.service_user.ratings = _lodash2.default.sumBy(order.service_user.reviews || [{ ratings: 0 }], 'ratings') / (order.service_user.reviews || [{ ratings: 0 }]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(item => item.service_type_id === order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ? order.order_details.map(item => {
          item.selling_price = parseFloat((item.selling_price || 0).toString());
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.sku_measurement.measurement_type.toString());
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id.toString() === item.updated_measurement.measurement_type.toString());
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        let payment_details = { product: {} };
        const paid_online = payment_mode.toString() === '4';
        const { order_type, order_details, delivery_user_id, collect_at_store, expense_id } = order;
        if (!order.expense_id) {
          payment_details = await SocketServer.init_on_payment({
            user_id, seller_id, has_pos: seller_detail.has_pos,
            home_delivered: !!delivery_user_id, paid_online,
            sku_details: order_type !== 2 ? order_details.map(item => {
              let { id: sku_id, quantity, sku_measurement, selling_price } = item;
              let { id: sku_measurement_id, cashback_percent } = sku_measurement || {};
              selling_price = parseFloat((selling_price || 0).toString());
              if (cashback_percent) {
                const milk_sku = milk_sku_list.find(mskuItem => mskuItem.id.toString() === sku_id.toString());
                if (milk_sku) {
                  if (today_sku_expense > 0) {
                    cashback_percent = _main2.default.MILK_DEFAULT_CASH_BACK_PERCENT;
                  } else if (today_sku_expense === 0) {
                    cashback_percent = _main2.default.MILK_SKU_CASH_BACK_PERCENT;
                  }
                }
              }
              cashback_percent = cashback_percent || 0;
              let available_cashback = selling_price && cashback_percent ? selling_price * cashback_percent / 100 : 0;
              available_cashback = paid_online ? available_cashback : available_cashback / 2;
              return JSON.parse(JSON.stringify({
                sku_id, sku_measurement_id, seller_id, user_id,
                updated_by: user_id, quantity,
                selling_price, status_type: 11, available_cashback
              }));
            }) : order_details,
            order_type, collect_at_store, expense_id,
            payment_mode_id: order_payment.payment_mode_id,
            seller_type_id: seller_detail.seller_type_id
          });

          order_data.expense_id = (payment_details.product || {}).id;
          order_data.job_id = (payment_details.cashback_jobs || {}).id;
        } else {
          payment_details.product = (await modals.products.findOne({
            where: { id: order.expense_id },
            attributes: ['job_id', 'purchase_cost']
          })).toJSON();
        }

        order = await orderAdaptor.retrieveOrUpdateOrder({
          where: {
            id: order_id, user_id, seller_id,
            status_type: [16, 19, 5]
          }, include: [{
            model: modals.users, as: 'user', attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [modals.sequelize.fn('CONCAT', '/consumer/', modals.sequelize.col('user.id'), '/images'), 'imageUrl'], [modals.sequelize.literal(`(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`), 'wallet_value']]
          }, {
            model: modals.sellers, as: 'seller', attributes: ['seller_name', 'address', 'contact_no', 'email', 'user_id', [modals.sequelize.literal(`"seller"."seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller"."seller_details"->'business_details'`), 'business_details']]
          }, {
            model: modals.user_addresses,
            as: 'user_address',
            attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [modals.sequelize.literal('(Select state_name from table_states as state where state.id = user_address.state_id)'), 'state_name'], [modals.sequelize.literal('(Select name from table_cities as city where city.id = user_address.city_id)'), 'city_name'], [modals.sequelize.literal('(Select name from table_localities as locality where locality.id = user_address.locality_id)'), 'locality_name'], [modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'), 'pin_code']]
          }]
        }, order_data, false);

        order.upload_id = (payment_details.product || {}).job_id;
        order.available_cashback = 0;
        order.order_details = order.order_type && order.order_type === 1 || order.collect_at_store ? order.order_details.map(item => {
          item.selling_price = _lodash2.default.round(parseFloat((item.selling_price || 0).toString()), 2);
          return item;
        }) : order.order_details;
        console.log('It\' here.', JSON.stringify(order.order_details));
        order.total_amount = _lodash2.default.round(payment_details.product.purchase_cost, 2);
        if (order_payment.payment_mode_id === 5) {
          await SocketServer.createCreditForOrder({
            user_id, seller_id, amount: order.total_amount,
            transaction_type: 1, description: 'Credited for Order',
            order_id, status_type: 16, seller_name: seller_detail.seller_name
          });

          await notificationAdaptor.notifyUserCron({
            seller_user_id: order.seller.user_id, payload: {
              title: `₹${order.total_amount} Credit Given.`,
              description: `${order.user.name || 'User'} has been granted a credit of ₹${order.total_amount} against Order #${order.id}.`,
              notification_type: 7, notification_id: Math.random(), user_id
            }
          });
        } else if (order_payment.payment_mode_id === 1) {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: order.seller.user_id, payload: {
              title: `Cash ₹${order.total_amount} Received.`,
              description: `You have received ₹${order.total_amount} from ${order.user.name || 'User'} against Order #${order.id}.`,
              notification_type: 8, notification_id: Math.random(), user_id
            }
          });
        }

        if (seller_detail.seller_type_id.toString() === '1' && order.job_id) {
          /* const fixed_cash_back = config.FIXED_CASH_BACK.split('||');
           await modals.user_wallet.create({
             amount: cash_back_job_count === 0 ?
                 fixed_cash_back[1] : fixed_cash_back[0],
             user_id, job_id: order.job_id, updated_by: 1,
             status_type: 16, cashback_source: 4, transaction_type: 1,
           });*/

          const cash_back_approved = await adminAdaptor.adminApproval([{ id: order.job_id }]);
          console.log(JSON.stringify(cash_back_approved));
        }
        order.payment_status = order_payment.status_type;
        order.payment_ref_id = order_payment.ref_id;
        order.payment_mode_id = order_payment.payment_mode_id;
        if (seller_loyalty_rules.order_value && seller_loyalty_rules.order_value > 0) {
          const seller_points = await sellerAdaptor.retrieveOrCreateSellerPoints({ seller_id, user_id }, {
            amount: Math.floor(order.total_amount / seller_loyalty_rules.order_value * seller_loyalty_rules.points_per_item), transaction_type: 1,
            status_type: 16, user_id, seller_id, job_id: order.job_id
          }, seller_detail.seller_name, seller_id);
          await userAdaptor.retrieveOrUpdateUserIndexedData({ where: { user_id } }, { point_id: seller_points.id, user_id });
        }
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            status_type: order.status_type,
            title: `${user_index_data.user_name || ''} has marked payment complete for his order.`,
            description: 'Please click here for further detail.',
            notification_type: 1,
            notification_id: order.id
          }
        });

        payment_details.order = order;
        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            seller_type_id: seller_detail.seller_type_id,
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type, user_id,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store,
            result: payment_details,
            order
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            seller_type_id: seller_detail.seller_type_id,
            order_id: order.id,
            result: payment_details,
            order, user_id,
            status_type: order.status_type,
            is_modified: order.is_modified,
            title: `Your Order has been successfully completed!`,
            notification_type: 31,
            order_type: order.order_type,
            collect_at_store: order.collect_at_store
          }
        });
        payment_details.order = order;
        return payment_details;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async init_on_payment(data) {
    let { user_id, seller_id, sku_details, home_delivered, order_type, collect_at_store, seller_type_id, has_pos, total_amount, payment_mode_id, paid_online } = data;
    total_amount = total_amount ? total_amount : _lodash2.default.sumBy(sku_details, order_type && order_type === 1 ? 'selling_price' : 'total_amount');
    console.log(JSON.stringify({ seller_type_id }));

    const jobResult = await jobAdaptor.createJobs(JSON.parse(JSON.stringify({
      job_id: `${Math.random().toString(36).substr(2, 9)}${user_id.toString(36)}`, user_id, updated_by: user_id, uploaded_by: user_id,
      user_status: 8, admin_status: 2, comments: `This job is sent for online expense`
    })));
    const [product, cashback_jobs, user_default_limit_rules] = await _bluebird2.default.all([productAdaptor.createEmptyProduct({
      job_id: jobResult.id, user_id,
      category_id: _main2.default.HOUSEHOLD_CATEGORY_ID,
      purchase_cost: _lodash2.default.round(total_amount, 2),
      updated_by: user_id, seller_id, status_type: 11,
      copies: [], main_category_id: 8,
      document_date: _moment2.default.utc().startOf('day').format('YYYY-MM-DD')
    }), order_type && (order_type === 1 || collect_at_store) ? jobAdaptor.createCashBackJobs({
      job_id: jobResult.id, user_id, paid_online,
      updated_by: user_id, uploaded_by: user_id,
      user_status: 8, seller_id,
      admin_status: seller_type_id.toString() === '1' ? 4 : 2,
      ce_status: seller_type_id.toString() === '1' ? 5 : null,
      cashback_status: 13, online_order: true,
      verified_seller: seller_type_id.toString() === '1',
      seller_status: seller_type_id.toString() === '1' ? 13 : 17,
      digitally_verified: true, home_delivered
    }) : undefined, categoryAdaptor.retrieveLimitRules({ where: { user_id: 1 } })]);

    let sku_cash_back = user_default_limit_rules.find(item => item.rule_type === 8);
    let sku_expenses, home_delivery_cash_back;
    if (order_type && (order_type === 1 || collect_at_store)) {
      [sku_expenses] = await _bluebird2.default.all([shopEarnAdaptor.addUserSKUExpenses(sku_details.map(item => {
        item.expense_id = product.id;
        item.job_id = (cashback_jobs || {}).id;
        item.available_cashback = sku_cash_back && item.available_cashback <= sku_cash_back.rule_limit ? item.available_cashback : sku_cash_back.rule_limit;
        item.timely_added = true;
        return item;
      }))]);
    }

    return {
      product, cashback_jobs, sku_expenses
    };
  }

  static async redeem_cash_back_at_seller(data, fn) {
    let { seller_id, user_id, cash_back_details, amount } = data;

    const [seller_detail, user_index_data] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', [modals.sequelize.literal(`"sellers"."seller_details"->'basic_details'->'pay_online'`), 'pay_online'], 'seller_name', 'id', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    })]);
    if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
      io.sockets.in(`seller-${seller_detail.user_id}`).emit('cash-back-redeemed', JSON.stringify({ cash_back_details, amount }));
    }

    await notificationAdaptor.notifyUserCron({
      seller_user_id: seller_detail.user_id,
      payload: {
        cash_back_details, amount,
        title: `Your wallet has been credited with INR${amount} against redemption request from ${user_index_data.user_name || ''}.`,

        description: 'Please click here for further detail.',
        notification_type: 10,
        notification_id: Math.random()
      }
    });
  }

  static async linkSellerWithUser(seller_id, user_id) {
    try {
      const [user_detail, user_index_data, seller] = await _bluebird2.default.all([userAdaptor.retrieveSingleUser({ where: { id: user_id } }), userAdaptor.retrieveUserIndexedData({
        where: { user_id, status_type: [1, 11] },
        attributes: ['my_seller_ids', 'seller_offer_ids', [modals.sequelize.literal(`(Select full_name from users where id = ${user_id})`), 'user_name']]
      }), sellerAdaptor.retrieveSellerDetail({ where: { id: seller_id } })]);
      if (seller) {
        let { my_seller_ids } = user_index_data || {};
        let { customer_ids } = seller;
        customer_ids = (customer_ids || []).map(item => item.customer_id ? item : { customer_id: item, is_credit_allowed: false, credit_limit: 0 });
        const customer_id = customer_ids.find(item => item.customer_id && item.customer_id.toString() === user_id.toString());
        if (!customer_id) {
          customer_ids.push({
            customer_id: user_id,
            is_credit_allowed: false,
            credit_limit: 0
          });
          customer_ids = _lodash2.default.uniqBy(customer_ids, 'customer_id');
          my_seller_ids = my_seller_ids || [];
          sellerAdaptor.retrieveOrUpdateSellerDetail({ where: { id: seller_id } }, { customer_ids });
          my_seller_ids.push(parseInt(seller_id));
          if (!user_index_data) {
            await userAdaptor.createUserIndexedData({ my_seller_ids, user_id }, { where: { user_id } });

            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller.user_id, payload: {
                title: `${user_detail.name || 'User'} has added you as a Seller for future orders and communication.`,

                description: 'Please click here for more detail.',
                notification_type: 2, notification_id: Math.random()
              }
            });
          } else {
            await userAdaptor.updateUserIndexedData({ my_seller_ids: _lodash2.default.uniq(my_seller_ids) }, { where: { user_id } });

            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller.user_id, payload: {
                title: `${user_index_data.user_name || 'User'} has added you as a Seller for future orders and communication.`,
                description: 'Please click here for more detail.',
                notification_type: 2, notification_id: Math.random()
              }
            });
          }
        }
      }
    } catch (err) {
      console.log(`Error on ${(0, _moment2.default)()} for user ${user_id} is as follow: \n \n ${err}`);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname, log_type: 2, user_id
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({ status: false, message: `Unable to link seller` });
    }
  }

  static async createCreditForOrder(parameters) {
    let { user_id, seller_id, amount, transaction_type, description, order_id, status_type, seller_name } = parameters;

    const seller_credits = await sellerAdaptor.retrieveOrCreateSellerCredits(JSON.parse(JSON.stringify({ user_id, seller_id })), JSON.parse(JSON.stringify({
      amount, transaction_type, description,
      user_id, seller_id, status_type
    })), seller_name, seller_id);
    await _bluebird2.default.all([userAdaptor.retrieveOrUpdateUserIndexedData({ where: { user_id } }, { credit_id: seller_credits.id, user_id }), orderAdaptor.retrieveOrUpdatePaymentDetails({ where: { order_id, seller_id, user_id } }, { status_type: 16, order_id, seller_id, user_id })]);
  }

  static async auto_cancel_order(parameters) {
    let { order, user_id, order_type, collect_at_store, seller_detail, user_index_data } = parameters;
    let order_exist = await modals.order.findOne({
      where: {
        id: order.id, status_type: 4,
        is_modified: false, in_review: false
      }
    });
    if (order_exist) {
      order_exist.updateAttributes({ status_type: 2 });

      await notificationAdaptor.notifyUserCron({
        user_id, payload: {
          order_id: order.id, order_type, collect_at_store,
          status_type: order.status_type, user_id,
          title: `Your Order has been Cancelled.`,
          description: `Your order has been automatically cancelled as there was no response from Seller ${seller_detail.seller_name || ''} for more than ${_main2.default.AUTO_CANCELLATION_TIMING} minutes. You can place a fresh order with the seller.`,
          notification_type: 31
        }
      });

      await notificationAdaptor.notifyUserCron({
        seller_user_id: seller_detail.user_id,
        payload: {
          order_id: order.id, order_type, collect_at_store,
          status_type: order.status_type, user_id,
          title: `Customer ${user_index_data.user_name || ''} Order stands Cancelled.`,
          description: `This customer's Order automatically cancelled due to no response for more than ${_main2.default.AUTO_CANCELLATION_TIMING} minutes from your end.`,
          notification_type: 1, notification_id: order.id
        }
      });
    }
  }
}
exports.default = SocketServer;