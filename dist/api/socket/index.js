'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _shop_earn = require('../Adaptors/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _job = require('../Adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _order = require('../Adaptors/order');

var _order2 = _interopRequireDefault(_order);

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _category = require('../Adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let connected_socket, modals, sellerAdaptor, shopEarnAdaptor, io, userAdaptor, orderAdaptor, notificationAdaptor, productAdaptor, jobAdaptor, categoryAdaptor;

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
    sellerAdaptor = new _sellers2.default(modals);
    shopEarnAdaptor = new _shop_earn2.default(modals);
    userAdaptor = new _user2.default(modals);
    orderAdaptor = new _order2.default(modals);
    notificationAdaptor = new _notification2.default(modals);
    productAdaptor = new _product2.default(modals);
    jobAdaptor = new _job2.default(modals);
    categoryAdaptor = new _category2.default(modals);
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

      socket.status = true;
      socket.join(decoded.seller_detail ? `seller-${decoded.id}` : `user-${decoded.id}`);
      socket.user = user;
      return next();
    } catch (e) {
      console.log(e);
    }
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
    let { seller_id, user_id, order_type, user_address_id, user_address, service_type_id, service_name } = data;
    user_address = user_address || {};
    user_address.user_id = user_id;
    user_address.updated_by = user_id;
    let [seller_detail, user_index_data, user_address_detail, service_users] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), !user_address_id ? userAdaptor.createUserAddress(JSON.parse(JSON.stringify(user_address))) : { id: user_address_id }, service_type_id ? sellerAdaptor.retrieveSellerAssistedServiceUsers({
      include: {
        as: 'service_types', where: { seller_id, service_type_id },
        model: modals.seller_service_types, required: true,
        attributes: ['service_type_id', 'seller_id', 'price', 'id']
      }, attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details', 'profile_image_detail', [modals.sequelize.literal(`(Select count(*) as order_counts from table_orders as orders where (orders."order_details"->'service_user'->>'id')::numeric = assisted_service_users.id and orders.status_type = 19)`), 'order_counts']]
    }) : undefined]);
    user_address_id = user_address_id || user_address_detail.toJSON().id;
    if (seller_detail && seller_detail.seller_type_id === 1) {
      if (order_type === 1 && user_index_data.wishlist_items && user_index_data.wishlist_items.length > 0) {
        const order_details = user_index_data.wishlist_items.map(item => {
          const { id, title, brand_id, quantity, category_id, sku_measurement, sub_category_id, main_category_id } = item;
          const { id: sku_measurement_id, mrp, bar_code, pack_numbers, cashback_percent, measurement_type, measurement_value } = sku_measurement;
          return {
            item_availability: true, id, title, brand_id,
            quantity, category_id, sub_category_id, main_category_id,
            sku_measurement: {
              id: sku_measurement_id, mrp, bar_code, pack_numbers,
              cashback_percent, measurement_type, measurement_value
            }
          };
        });
        const order = await orderAdaptor.placeNewOrder({
          seller_id, user_id, order_details, order_type,
          status_type: 4, user_address_id
        });

        if (order) {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit('order-placed', JSON.stringify({
              order_id: order.id,
              order_type,
              status_type: order.status_type,
              order,
              user_id
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, order_type,
                status_type: order.status_type, order, user_id,
                title: `New order has been placed by user ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1
              }
            });
          }
          if (fn) {
            fn(order);
          } else {
            if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
              io.sockets.in(`user-${data.user_id}`).emit('order-placed', JSON.stringify({
                order_id: order.id,
                order_type,
                status_type: order.status_type,
                order,
                user_id
              }));
            } else {
              await notificationAdaptor.notifyUserCron({
                user_id, payload: {
                  order_id: order.id, order_type,
                  status_type: order.status_type, order, user_id,
                  title: `New order has been placed to seller ${seller_detail.seller_name}.`,
                  description: 'Please click here for further detail.',
                  notification_type: 31
                }
              });
            }

            return order;
          }
        }
      } else if (service_users && service_users.length > 0) {
        service_users = service_users.map(item => {
          item.rating = _lodash2.default.sumBy(item.reviews || [{ ratings: 0 }], 'ratings') / (item.reviews || [{ ratings: 0 }]).length;
          item.service_name = service_name;
          return item;
        });

        const order = await orderAdaptor.placeNewOrder({
          seller_id, user_address_id, order_type, status_type: 4,
          user_id, order_details: { service_type_id, service_name }
        });

        if (order) {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit('assisted-status-change', JSON.stringify({
              order_id: order.id,
              order_type,
              status_type: order.status_type,
              order,
              service_users,
              user_id
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, order_type,
                status_type: order.status_type, order, service_users, user_id,
                title: `New order has been placed by user ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1
              }
            });
          }
          if (fn) {
            fn(order);
          } else {
            if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
              io.sockets.in(`user-${data.user_id}`).emit('assisted-status-change', JSON.stringify({
                order_id: order.id,
                order_type,
                status_type: order.status_type,
                order,
                user_id
              }));
            } else {
              await notificationAdaptor.notifyUserCron({
                user_id, payload: {
                  order_id: order.id, order_type,
                  status_type: order.status_type, order, user_id,
                  title: `New order has been placed to seller ${seller_detail.seller_name}.`,
                  description: 'Please click here for further detail.',
                  notification_type: 31
                }
              });
            }

            return order;
          }
        }
      } else {
        return undefined;
      }
    }
  }

  static async modify_order(data, fn) {
    let { seller_id, user_id, order_id, order_details } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id, status_type: 4 } }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.is_modified = true;
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
      if (order) {
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order,
            user_id,
            order_type: order.order_type
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, order_type: order.order_type,
              status_type: order.status_type, is_modified: true, user_id,
              title: `Order has been modified by seller ${seller_detail.seller_name}, please review.`,
              description: 'Please click here for further detail.',
              notification_type: 31
            }
          });
        }

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
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id, status_type: 19 } }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id, order, user_id,
              order_type: order.order_type, is_modified: order.is_modified,
              status_type: order.status_type, start_date: order.order_type ? order.order_details.start_date : undefined
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, order_type: order.order_type,
                status_type: order.status_type, is_modified: true, user_id,
                title: `Order has marked started by ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1, start_date: order.order_type ? order.order_details.start_date : undefined
              }
            });
          }
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type, order, user_id,
            order_type: order.order_type, start_date: order.order_type ? order.order_details.start_date : undefined
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, order_type: order.order_type,
              status_type: order.status_type, is_modified: true, user_id,
              title: `Order has been started, please mark end after it get completed so we can provide you better calculation.`,
              description: 'Please click here for further detail.',
              notification_type: 31, start_date: order.order_type ? order.order_details.start_date : undefined
            }
          });
        }

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
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({ where: { id: order_id, user_id, seller_id, status_type: 19 } }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      const { start_date, end_date, service_type } = order_data.order_details;
      const { price } = service_type;

      order_data.order_details.total_amount = (0, _moment2.default)(end_date || (0, _moment2.default)()).diff(start_date, 'hours', true) * price.value;
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id,
              is_modified: order.is_modified,
              status_type: order.status_type,
              order,
              user_id,
              order_type: order.order_type,
              start_date: order.order_type ? order.order_details.start_date : undefined,
              end_date: order.order_type ? order.order_details.end_date : undefined
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id,
                order_type: order.order_type,
                status_type: order.status_type,
                is_modified: true,
                user_id,
                title: `Order has marked ended by ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1,
                start_date: order.order_type ? order.order_details.start_date : undefined,
                end_date: order.order_type ? order.order_details.end_date : undefined
              }
            });
          }
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type,
            order,
            user_id,
            order_type: order.order_type,
            start_date: order.order_type ? order.order_details.start_date : undefined,
            end_date: order.order_type ? order.order_details.end_date : undefined
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              order_type: order.order_type,
              status_type: order.status_type,
              is_modified: true,
              user_id,
              title: `Order has been started, please mark end after it get completed so we can provide you better calculation.`,
              description: 'Please click here for further detail.',
              notification_type: 31,
              start_date: order.order_type ? order.order_details.start_date : undefined,
              end_date: order.order_type ? order.order_details.end_date : undefined
            }
          });
        }

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
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: { id: order_id, user_id, seller_id, status_type: 4 }
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      if (order_data.order_type === 2) {
        order_data.order_details = order_details || order_data.order_details;
      } else {
        order_data.order_details = (order_details || order_data.order_details).filter(item => item.item_availability).map(item => {
          if (item.updated_measurement) {
            item.sku_measurement = item.updated_measurement;
            item = _lodash2.default.omit(item, 'updated_measurement');
          }

          return item;
        });
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
      }, order_data, false);
      if (order) {
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (is_user) {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id, order_type: order.order_type,
              is_modified: order.is_modified,
              status_type: order.status_type, order, user_id
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, status_type: order.status_type,
                is_modified: order.is_modified, user_id,
                title: is_user ? `Order Approved successfully by ${user_index_data.user_name}.` : `Order Approved successfully for ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1, order_type: order.order_type
              }
            });
          }
        }

        if (fn && is_user) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id,
              is_modified: true, order_type: order.order_type,
              status_type: order.status_type, order, user_id
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id, order_type: order.order_type,
                status_type: order.status_type, is_modified: true, user_id,
                title: !is_user ? `Order has been approved by seller ${seller_detail.seller_name}, delivery detail will be updated shortly.` : `Your request to approve order is successful. Waiting for seller to assign a delivery boy.`,
                description: 'Please click here for further detail.',
                notification_type: 31
              }
            });
          }
        }

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async order_out_for_delivery(data, fn) {
    let { seller_id, user_id, order_id, status_type, delivery_user_id, order_details } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: { id: order_id, user_id, seller_id, status_type: 16 },
      attributes: ['id', 'order_details']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.status_type = status_type || 19;
      order_data.delivery_user_id = delivery_user_id;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: 16 },
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (delivery_user_id) {
          order.delivery_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: delivery_user_id })), attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details']
          });
          order.delivery_user.rating = _lodash2.default.sumBy(order.delivery_user.reviews || [{ ratings: 0 }], 'ratings') / (order.delivery_user.reviews || [{ ratings: 0 }]).length;
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            delivery_user: order.delivery_user,
            order, user_id, order_type: order.order_type
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              status_type: order.status_type,
              is_modified: order.is_modified,
              user_id,
              title: `Hurray! ${order.delivery_user.name} is on the way with your order from seller ${seller_detail.seller_name}.`,
              description: 'Please click here for further detail.',
              notification_type: 31,
              order_type: order.order_type
            }
          });
        }

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async reject_order_by_seller(data, fn) {
    let { seller_id, user_id, order_id, status_type } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified, order_type: order.order_type,
            status_type: order.status_type, order, user_id
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Oops! Look a like seller ${seller_detail.seller_name} rejected your order.`,
              description: 'Please click here for further detail.',
              notification_type: 31, order_type: order.order_type
            }
          });
        }

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
      attributes: ['seller_type_id', 'seller_name', 'user_id']
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type, order_type: order.order_type,
            order, user_id
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Oops! Look a like ${user_index_data.user_name} is not satisfied by modification in order and rejected the order.`,
              description: 'Please click here for further detail.',
              notification_type: 1, order_type: order.order_type
            }
          });
        }

        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id, is_modified: true,
              status_type: order.status_type,
              order, order_type: order.order_type,
              user_id
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                status_type: order.status_type, is_modified: true, user_id,
                title: `Order has been rejected successfully and we have updated same to ${seller_detail.seller_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 31, order_type: order.order_type
              }
            });
          }
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
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: { id: order_id, user_id, seller_id, status_type: 4 },
      attributes: ['id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.status_type = status_type || 17;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: {
          id: order_id,
          user_id,
          seller_id,
          status_type: 4,
          is_modified: false
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            order, user_id, order_type: order.order_type
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Oops! Look a like ${user_index_data.user_name} has cancelled the order.`,
              description: 'Please click here for further detail.',
              notification_type: 1, order_type: order.order_type
            }
          });
        }

        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id, is_modified: order.is_modified,
              status_type: order.status_type,
              order, order_type: order.order_type,
              user_id
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                status_type: order.status_type,
                is_modified: order.is_modified,
                user_id,
                title: `Order has cancelled successfully and we have updated the same to ${seller_detail.seller_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 31,
                order_type: order.order_type
              }
            });
          }
        }

        return order;
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  }

  static async mark_order_complete(data, fn) {
    let { seller_id, user_id, order_id, status_type } = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await _bluebird2.default.all([sellerAdaptor.retrieveSellerDetail({
      where: { id: seller_id },
      attributes: ['seller_type_id', 'seller_name', 'user_id']
    }), userAdaptor.retrieveUserIndexedData({
      where: { user_id }, attributes: ['wishlist_items', 'assisted_services', [modals.sequelize.literal(`(Select full_name from users where users.id = ${user_id})`), 'user_name']]
    }), orderAdaptor.retrieveOrUpdateOrder({
      where: {
        id: order_id, user_id, seller_id,
        status_type: [16, 19]
      },
      attributes: ['id']
    }, {}, false), modals.measurement.findAll({ where: { status_type: 1 } })]);
    if (order_data) {
      order_data.status_type = status_type || 5;
      let order = await orderAdaptor.retrieveOrUpdateOrder({
        where: { id: order_id, user_id, seller_id, status_type: [16, 19] },
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
        order.order_details = Array.isArray(order.order_details) ? order.order_details.map(item => {
          if (item.sku_measurement) {
            const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
            item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
          }
          if (item.updated_measurement) {
            const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
            item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
          }

          return item;
        }) : order.order_details;
        const payment_details = await SocketServer.init_on_payment({
          user_id, seller_id, home_delivered: !!order.delivery_user_id,
          sku_details: order.order_details.map(item => {
            const { id: sku_id, quantity, sku_measurement, selling_price } = item;
            const { id: sku_measurement_id, cashback_percent } = sku_measurement;
            return JSON.parse(JSON.stringify({
              sku_id, sku_measurement_id, seller_id, user_id,
              updated_by: user_id, quantity, selling_price, status_type: 11,
              available_cashback: selling_price && cashback_percent ? selling_price * cashback_percent / 100 : undefined
            }));
          }), order_type: order.order_type
        });
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            order, user_id
          }));
        } else {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `${user_index_data.user_name} has marked payment complete for his order.`,
              description: 'Please click here for further detail.',
              notification_type: 1
            }
          });
        }

        payment_details.order = order;
        if (fn) {
          fn(payment_details);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ? 'order-status-change' : 'assisted-status-change', JSON.stringify({
              order_id: order.id,
              is_modified: true,
              status_type: order.status_type,
              user_id,
              result: payment_details
            }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id, result: payment_details,
                status_type: order.status_type, is_modified: true, user_id,
                title: `Order has marked paid successfully and we have created expense for the same.`,
                description: 'Please click here for further detail.',
                notification_type: 31
              }
            });
          }
        }
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
    let { user_id, seller_id, sku_details, home_delivered, order_type } = data;
    const total_amount = order_type ? _lodash2.default.sumBy(sku_details, 'selling_price') : sku_details.total_amount;
    const jobResult = await jobAdaptor.createJobs({
      job_id: `${Math.random().toString(36).substr(2, 9)}${user_id.toString(36)}`, user_id,
      updated_by: user_id, uploaded_by: user_id, user_status: 8,
      admin_status: 2, comments: `This job is sent for online expense`
    });
    const [product, cashback_jobs, user_default_limit_rules] = await _bluebird2.default.all([productAdaptor.createEmptyProduct({
      job_id: jobResult.id, user_id, main_category_id: 8,
      category_id: 26, purchase_cost: total_amount,
      updated_by: user_id, seller_id, status_type: 11, copies: [],
      document_date: _moment2.default.utc().startOf('day').format('YYYY-MM-DD')
    }), order_type ? jobAdaptor.createCashBackJobs({
      job_id: jobResult.id, user_id, updated_by: user_id,
      uploaded_by: user_id, user_status: 8, admin_status: 2, seller_id,
      cashback_status: 13, online_order: true, verified_seller: true,
      seller_status: 16, digitally_verified: true, home_delivered
    }) : undefined, categoryAdaptor.retrieveLimitRules({ where: { user_id: 1 } })]);

    let home_delivery_limit = user_default_limit_rules.find(item => item.rule_type === 7);
    let sku_expenses, home_delivery_cash_back;
    if (order_type === 1) {
      [sku_expenses, home_delivery_cash_back] = await _bluebird2.default.all([shopEarnAdaptor.addUserSKUExpenses(sku_details.map(item => {
        item.expense_id = product.id;
        item.job_id = cashback_jobs.id;
        return item;
      })), home_delivered ? jobAdaptor.addCashBackToSeller({
        amount: home_delivery_limit.rule_limit,
        status_type: 16, cashback_source: 1, user_id, seller_id,
        job_id: cashback_jobs.id, transaction_type: 1, updated_by: user_id
      }) : undefined]);
    }

    return {
      product, cashback_jobs, sku_expenses
    };
  }

}
exports.default = SocketServer;