import SocketIO from 'socket.io';
import SellerAdaptor from '../Adaptors/sellers';
import UserAdaptor from '../Adaptors/user';
import ShopEarnAdaptor from '../Adaptors/shop_earn';
import shared from '../../helpers/shared';
import OrderAdaptor from '../Adaptors/order';
import NotificationAdaptor from '../Adaptors/notification';
import _ from 'lodash';

let connected_socket, modals, sellerAdaptor, shopEarnAdaptor, io, userAdaptor,
    orderAdaptor, notificationAdaptor;

/*//controller file
import { io } from "../../server";
const socketController = async socket => {
  console.log("socket connection from: " + socket.user.username);
  socket.on("message", async (data, acknowledge) => {
    await require("./message")(io, socket, data, acknowledge);
  });
});*/

export default class SocketServer {
  constructor(props) {
    io = SocketIO.listen(props.server.listener);
    modals = props.models;
    sellerAdaptor = new SellerAdaptor(modals);
    shopEarnAdaptor = new ShopEarnAdaptor(modals);
    userAdaptor = new UserAdaptor(modals);
    orderAdaptor = new OrderAdaptor(modals);
    notificationAdaptor = new NotificationAdaptor(modals);
    io.use(SocketServer.socketAuth);
    io.on('connect', (socket) => {
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
    });
  }

  static async socketAuth(socket, next) {
    try {
      const token = socket.handshake.query.token;
      if (!token) {
        socket.status = false;
        return next(new Error('authentication error'));
      }
      const decoded = await shared.isAccessTokenBasic(token);

      let user = await (decoded.seller_detail ?
          modals.seller_users.findOne({
            where: JSON.parse(
                JSON.stringify({role_type: 6, id: decoded.id})),
          }) :
          modals.users.findOne({
            where: JSON.parse(
                JSON.stringify({role_type: 5, id: decoded.id})),
          }));

      if (!user) {
        socket.status = false;
        return next(new Error('authentication error'));
      }

      socket.status = true;
      socket.join(decoded.seller_detail ?
          `seller-${decoded.id}` : `user-${decoded.id}`);
      socket.user = user;
      return next();
    } catch (e) {
      console.log(e);
    }
  };

  static async init(data) {
    console.log('We are here');
    if (data.is_seller) {
      await modals.sellers.update({socket_id: connected_socket.id},
          {where: {id: data.id}});
    } else {
      await modals.users.update({socket_id: connected_socket.id},
          {where: {id: data.id}});
    }

    connected_socket.to(connected_socket.id).
        emit('registered', {socket_id: connected_socket.id});
  }

  static async admin_approval(data) {
    console.log('We are here');
    if (data.verified_seller) {
      console.log(io.sockets.adapter.rooms[`seller-${data.seller_id}`]);
      if (io.sockets.adapter.rooms[`seller-${data.seller_id}`]) {
        io.sockets.in(`seller-${data.seller_id}`).
            emit('request-approval',
                shopEarnAdaptor.retrievePendingTransaction(
                    {seller_id: data.seller_id, id: data.job_id}));
      }
    }
    if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
      io.sockets.in(`user-${data.user_id}`).
          emit('request-approval',
              shopEarnAdaptor.retrieveCashBackTransaction(
                  {
                    seller_id: data.seller_id,
                    id: data.job_id,
                    user_id: data.user_id,
                  }));
    }
  }

  static async place_order(data, fn) {
    let {seller_id, user_id, order_type, user_address_id, user_address, service_type_id, status_type} = data;
    user_address = user_address || {};
    user_address.user_id = user_id;
    user_address.updated_by = user_id;
    const [seller_detail, user_index_data, user_address_detail] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'user_id'],
              }),
          userAdaptor.retrieveUserIndexedData({
            where: {user_id}, attributes: [
              'wishlist_items', 'assisted_services', [
                modals.sequelize.literal(
                    `(Select full_name from users where users.id = ${user_id})`),
                'user_name']],
          }),
          !user_address_id ?
              userAdaptor.createUserAddress(
                  JSON.parse(JSON.stringify(user_address))) :
              {id: user_address_id}]);
    user_address_id = user_address_id || (user_address_detail.toJSON()).id;
    if (seller_detail && seller_detail.seller_type_id === 1) {
      if (order_type === 1 && user_index_data.wishlist_items &&
          user_index_data.wishlist_items.length > 0) {
        const order_details = user_index_data.wishlist_items.map(item => {
          const {id, title, brand_id, quantity, category_id, sku_measurement, sub_category_id, main_category_id} = item;
          const {id: sku_measurement_id, mrp, bar_code, pack_numbers, cashback_percent, measurement_type, measurement_value} = sku_measurement;
          return {
            item_availability: true, id, title, brand_id,
            quantity, category_id, sub_category_id, main_category_id,
            sku_measurement: {
              id: sku_measurement_id, mrp, bar_code, pack_numbers,
              cashback_percent, measurement_type, measurement_value,
            },
          };
        });
        const order = await orderAdaptor.placeNewOrder(
            {
              seller_id, user_id, order_details, order_type,
              status_type: 4, user_address_id,
            });

        if (order) {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('order-placed', JSON.stringify({
                  order_id: order.id, order_type, status_type: 4,
                  order, user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, order_type,
                status_type: 4, order, user_id,
                title: `New order has been placed by user ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1,
              },
            });
          }
          if (fn) {
            fn(order);
          } else {
            if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
              io.sockets.in(`user-${data.user_id}`).
                  emit('order-placed', JSON.stringify({
                    order_id: order.id, order_type, status_type: 4,
                    order, user_id,
                  }));
            } else {
              await notificationAdaptor.notifyUserCron({
                user_id, payload: {
                  order_id: order.id, order_type,
                  status_type: 4, order, user_id,
                  title: `New order has been placed to seller ${seller_detail.seller_name}.`,
                  description: 'Please click here for further detail.',
                  notification_type: 31,
                },
              });
            }

            return order;
          }
        }
      }
    } else {
      return undefined;
    }
  }

  static async modify_order(data, fn) {
    let {seller_id, user_id, order_id, order_details} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {where: {id: order_id, user_id, seller_id, status_type: 4}}, {},
          false)]);
    if (order_data) {
      order_data.order_details = order_data.order_details.map((item) => {
        const order_detail = order_details.find(
            odItem => odItem.id === item.id);
        return order_detail || item;
      });
      order_data.is_modified = true;
      const order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 4},
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          },
          order_data, false);
      if (order) {
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id, is_modified: true, status_type: 4,
                  order, user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id,
                status_type: 4, is_modified: true, user_id,
                title: `Order Modification successful, waiting for user ${user_index_data.user_name} approval.`,
                description: 'Please click here for further detail.',
                notification_type: 1,
              },
            });
          }
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).
              emit('order-status-change', JSON.stringify({
                order_id: order.id, is_modified: true, status_type: 4,
                order, user_id,
              }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              status_type: 4, is_modified: true, user_id,
              title: `Order has been modified by seller ${seller_detail.seller_name}, please review.`,
              description: 'Please click here for further detail.',
              notification_type: 31,
            },
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
    let {seller_id, user_id, order_id, status_type, is_user, order_details} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 4},
          }, {},
          false)]);
    if (order_data) {
      order_data.order_details = (order_details ||
          order_data.order_details).filter(
          item => item.item_availability).map(item => {
        if (item.updated_measurement) {
          item.sku_measurement = item.updated_measurement;
          item = _.omit(item, 'updated_measurement');
        }

        return item;
      });
      order_data.status_type = status_type || 16;
      const order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 4},
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          }, order_data, false);
      if (order) {
        if (fn && !is_user) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id,
                  is_modified: order.is_modified,
                  status_type: order.status_type, order, user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, status_type: order.status_type,
                is_modified: order.is_modified, user_id,
                title: is_user ?
                    `Order Approved successfully by ${user_index_data.user_name}.` :
                    `Order Approved successfully for ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1,
              },
            });
          }
        }

        if (fn && is_user) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id, is_modified: true, status_type: 4,
                  order, user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                status_type: order.status_type, is_modified: true, user_id,
                title: !is_user ?
                    `Order has been approved by seller ${seller_detail.seller_name}, delivery detail will be updated shortly.` :
                    `Your request to approve order is successful. Waiting for seller to assign a delivery boy.`,
                description: 'Please click here for further detail.',
                notification_type: 31,
              },
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
    let {seller_id, user_id, order_id, status_type, delivery_user_id, order_details} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 16},
            attributes: ['id', 'order_details'],
          }, {}, false)]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.status_type = status_type || 19;
      order_data.delivery_user_id = delivery_user_id;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 16},
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          }, order_data, false);
      if (order) {
        if (delivery_user_id) {
          order.delivery_user = await sellerAdaptor.retrieveAssistedServiceUser(
              {
                where: JSON.parse(
                    JSON.stringify({id: delivery_user_id})), attributes: [
                  'id', 'name', 'mobile_no',
                  'reviews', 'document_details'],
              });
          order.delivery_user.rating = (_.sumBy(
              order.delivery_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.delivery_user.reviews || [{ratings: 0}]).length;
        }
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id, is_modified: order.is_modified,
                  status_type: order.status_type,
                  delivery_user: order.delivery_user,
                  order, user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, status_type: order.status_type,
                is_modified: order.is_modified, user_id,
                title: `Order marked out for delivery successfully for ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1,
              },
            });
          }
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).
              emit('order-status-change', JSON.stringify({
                order_id: order.id, is_modified: order.is_modified,
                status_type: order.status_type,
                delivery_user: order.delivery_user,
                order, user_id,
              }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              status_type: order.status_type, is_modified: true, user_id,
              title: `Hurray! ${order.delivery_user.name} is on the way with your order from seller ${seller_detail.seller_name}.`,
              description: 'Please click here for further detail.',
              notification_type: 31,
            },
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
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id,
              user_id,
              seller_id,
              status_type: 4,
              is_modified: false,
            },
            attributes: ['id'],
          }, {}, false)]);
    if (order_data) {
      order_data.status_type = status_type || 18;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id,
              user_id,
              seller_id,
              status_type: 4,
              is_modified: false,
            },
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          }, order_data, false);
      if (order) {
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id, is_modified: order.is_modified,
                  status_type: order.status_type,
                  order, user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              seller_user_id: seller_detail.user_id,
              payload: {
                order_id: order.id, status_type: order.status_type,
                is_modified: order.is_modified, user_id,
                title: `Order marked rejected successfully for ${user_index_data.user_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 1,
              },
            });
          }
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).
              emit('order-status-change', JSON.stringify({
                order_id: order.id,
                is_modified: true,
                status_type: order.status_type,
                order,
                user_id,
              }));
        } else {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              status_type: order.status_type, is_modified: true, user_id,
              title: `Oops! Look a like seller ${seller_detail.seller_name} rejected your order.`,
              description: 'Please click here for further detail.',
              notification_type: 31,
            },
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
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id, user_id, seller_id,
              status_type: 4, is_modified: true,
            },
            attributes: ['id'],
          }, {}, false)]);
    if (order_data) {
      order_data.status_type = status_type || 18;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id, user_id, seller_id,
              status_type: 4, is_modified: true,
            },
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          }, order_data, false);
      if (order) {
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit('order-status-change', JSON.stringify({
                order_id: order.id, is_modified: order.is_modified,
                status_type: order.status_type,
                order, user_id,
              }));
        } else {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Oops! Look a like ${user_index_data.user_name} is not satisfied by modification in order and rejected the order.`,
              description: 'Please click here for further detail.',
              notification_type: 1,
            },
          });
        }

        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id,
                  is_modified: true,
                  status_type: order.status_type,
                  order,
                  user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                status_type: order.status_type, is_modified: true, user_id,
                title: `Order has been rejected successfully and we have updated same to ${seller_detail.seller_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 31,
              },
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
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 4},
            attributes: ['id'],
          }, {}, false)]);
    if (order_data) {
      order_data.status_type = status_type || 17;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id,
              user_id,
              seller_id,
              status_type: 4,
              is_modified: false,
            },
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          }, order_data, false);
      if (order) {
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit('order-status-change', JSON.stringify({
                order_id: order.id, is_modified: order.is_modified,
                status_type: order.status_type,
                order, user_id,
              }));
        } else {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Oops! Look a like ${user_index_data.user_name} has cancelled the order.`,
              description: 'Please click here for further detail.',
              notification_type: 1,
            },
          });
        }

        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id,
                  is_modified: true,
                  status_type: order.status_type,
                  order,
                  user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                status_type: order.status_type, is_modified: true, user_id,
                title: `Order has cancelled successfully and we have updated the same to ${seller_detail.seller_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 31,
              },
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

  /*static async mark_order_complete(data, fn) {
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data] = await Promise.all([
      sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id},
            attributes: ['seller_type_id', 'seller_name', 'user_id'],
          }),
      userAdaptor.retrieveUserIndexedData({
        where: {user_id}, attributes: [
          'wishlist_items', 'assisted_services', [
            modals.sequelize.literal(
                `(Select full_name from users where users.id = ${user_id})`),
            'user_name']],
      }),
      orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 4},
            attributes: ['id'],
          }, {}, false)]);
    if (order_data) {
      order_data.status_type = status_type || 17;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id,
              user_id,
              seller_id,
              status_type: 4,
              is_modified: false,
            },
            include: [
              {
                model: modals.users, as: 'user', attributes: [
                  'id', ['full_name', 'name'], 'mobile_no', 'email',
                  'email_verified', 'email_secret', 'location',
                  'latitude', 'longitude', 'image_name', 'password',
                  'gender', [
                    modals.sequelize.fn('CONCAT', '/consumer/',
                        modals.sequelize.col('user.id'), '/images'),
                    'imageUrl'], [
                    modals.sequelize.literal(
                        `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user_id} and status_type in (16) group by user_id)`),
                    'wallet_value']],
              },
              {
                model: modals.sellers, as: 'seller', attributes: [
                  'seller_name', 'address', 'contact_no', 'email',
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'basic_details'`),
                    'basic_details'],
                  [
                    modals.sequelize.literal(
                        `"seller"."seller_details"->'business_details'`),
                    'business_details']],
              },
              {
                model: modals.user_addresses,
                as: 'user_address',
                attributes: [
                  'address_type', 'address_line_1', 'address_line_2',
                  'city_id', 'state_id', 'locality_id', 'pin',
                  'latitude', 'longitude', [
                    modals.sequelize.literal(
                        '(Select state_name from table_states as state where state.id = user_address.state_id)'),
                    'state_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_cities as city where city.id = user_address.city_id)'),
                    'city_name'], [
                    modals.sequelize.literal(
                        '(Select name from table_localities as locality where locality.id = user_address.locality_id)'),
                    'locality_name'], [
                    modals.sequelize.literal(
                        '(Select pin_code from table_localities as locality where locality.id = user_address.locality_id)'),
                    'pin_code']],
              }],
          }, order_data, false);
      if (order) {
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit('order-status-change', JSON.stringify({
                order_id: order.id, is_modified: order.is_modified,
                status_type: order.status_type,
                order, user_id,
              }));
        } else {
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Oops! Look a like ${user_index_data.user_name} has cancelled the order.`,
              description: 'Please click here for further detail.',
              notification_type: 1,
            },
          });
        }

        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).
                emit('order-status-change', JSON.stringify({
                  order_id: order.id,
                  is_modified: true,
                  status_type: order.status_type,
                  order,
                  user_id,
                }));
          } else {
            await notificationAdaptor.notifyUserCron({
              user_id, payload: {
                order_id: order.id,
                status_type: order.status_type, is_modified: true, user_id,
                title: `Order has cancelled successfully and we have updated the same to ${seller_detail.seller_name}.`,
                description: 'Please click here for further detail.',
                notification_type: 31,
              },
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
  }*/

}