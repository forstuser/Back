import SocketIO from 'socket.io';
import SellerAdaptor from '../Adaptors/sellers';
import UserAdaptor from '../Adaptors/user';
import ShopEarnAdaptor from '../Adaptors/shop_earn';
import ProductAdaptor from '../Adaptors/product';
import JobAdaptor from '../Adaptors/job';
import shared from '../../helpers/shared';
import OrderAdaptor from '../Adaptors/order';
import NotificationAdaptor from '../Adaptors/notification';
import CategoryAdaptor from '../Adaptors/category';
import _ from 'lodash';
import Promise from 'bluebird';
import moment from 'moment';
import config from '../../config/main';

let connected_socket, modals, sellerAdaptor, shopEarnAdaptor, io, userAdaptor,
    orderAdaptor, notificationAdaptor, productAdaptor, jobAdaptor,
    categoryAdaptor;

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
    shopEarnAdaptor = new ShopEarnAdaptor(modals);
    userAdaptor = new UserAdaptor(modals);
    orderAdaptor = new OrderAdaptor(modals);
    notificationAdaptor = new NotificationAdaptor(modals);
    sellerAdaptor = new SellerAdaptor(modals, notificationAdaptor);
    productAdaptor = new ProductAdaptor(modals);
    jobAdaptor = new JobAdaptor(modals);
    categoryAdaptor = new CategoryAdaptor(modals);
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

      console.log({
        decoded,
        seller_detail: decoded.seller_detail,
        seller_room: `seller-${decoded.id}`,
      });
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
        io.sockets.in(`seller-${data.seller_id}`).emit('request-approval',
            shopEarnAdaptor.retrievePendingTransaction(
                {seller_id: data.seller_id, id: data.job_id}));
      }
    }
    if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
      io.sockets.in(`user-${data.user_id}`).emit('request-approval',
          shopEarnAdaptor.retrieveCashBackTransaction(
              {
                seller_id: data.seller_id,
                id: data.job_id,
                user_id: data.user_id,
              }));
    }
  }

  static async place_order(data, fn) {
    let {seller_id, user_id, order_type, user_address_id, user_address, service_type_id, service_name} = data;
    user_address = user_address || {};
    user_address.user_id = user_id;
    user_address.updated_by = user_id;
    let [seller_detail, user_index_data, user_address_detail, service_users] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: [
                  'seller_type_id', 'seller_name', 'user_id',
                  'id', 'rush_hours'],
              }),
          userAdaptor.retrieveUserIndexedData({
            where: {user_id}, attributes: [
              'wishlist_items', 'assisted_services', [
                modals.sequelize.literal(
                    `(Select full_name from users where users.id = ${user_id})`),
                'user_name']],
          }),
          !user_address_id && user_address ?
              userAdaptor.createUserAddress(
                  JSON.parse(JSON.stringify(user_address))) :
              undefined,
          service_type_id ? sellerAdaptor.retrieveSellerAssistedServiceUsers({
            include: {
              as: 'service_types', where: {seller_id, service_type_id},
              model: modals.seller_service_types, required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            }, attributes: [
              'id', 'name', 'mobile_no', 'reviews',
              'document_details', 'profile_image_detail', [
                modals.sequelize.literal(
                    `(Select count(*) as order_counts from table_orders as orders where (orders."order_details"->'service_user'->>'id')::numeric = assisted_service_users.id and orders.status_type = 19)`),
                'order_counts']],
          }) : undefined, SocketServer.linkSellerWithUser(seller_id, user_id)]);
    if (!user_address_id && !user_address_detail) {
      return false;
    }
    user_address_id = user_address_id || (user_address_detail.toJSON()).id;
    if (seller_detail) {
      if (order_type === 1 && user_index_data.wishlist_items &&
          user_index_data.wishlist_items.length > 0) {
        const order_details = user_index_data.wishlist_items.map(item => {
          const {id, title, brand_id, quantity, category_id, sku_measurement, sub_category_id, main_category_id} = item;
          const {id: sku_measurement_id, mrp, bar_code, pack_numbers, cashback_percent, measurement_type, measurement_value} = sku_measurement ||
          {};
          return {
            item_availability: true, id, title, brand_id,
            uid: `${id}${sku_measurement_id ? `-${sku_measurement_id}` : ''}`,
            quantity, category_id, sub_category_id, main_category_id,
            sku_measurement: sku_measurement ? {
              id: sku_measurement_id, mrp, bar_code, pack_numbers,
              cashback_percent, measurement_type, measurement_value,
            } : undefined,
          };
        });
        const order = await orderAdaptor.placeNewOrder(
            {
              seller_id, user_id, order_details, order_type,
              status_type: 4, user_address_id,
            });

        if (order) {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            console.log(
                {
                  soket_status: io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`],
                  user_id: seller_detail.user_id,
                });
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('order-placed', JSON.stringify(order));
          }
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, order_type,
              status_type: order.status_type, order, user_id,
              title: `${user_index_data.user_name ||
              ''} has placed an order.`,
              description: 'Please click here for further detail.',
              notification_type: 1, notification_id: order.id,
            },
          });
          if (fn) {
            fn(order);
          } else {
            console.log(
                {
                  soket_status: io.sockets.adapter.rooms[`user-${data.user_id}`],
                  user_id: data.user_id,
                });
            if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
              io.sockets.in(`user-${data.user_id}`).
                  emit('order-placed', JSON.stringify({
                    order_id: order.id, order_type,
                    status_type: order.status_type, order, user_id,
                  }));
            }
          }
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, order_type,
              status_type: order.status_type, order, user_id,
              title: `Your order has been placed with Seller ${seller_detail.seller_name ||
              ''}.`,
              description: seller_detail.rush_hours ?
                  `Seller ${seller_detail.seller_name ||
                  ''} response may be delayed due to busy hours. Click here to track your order status.` :
                  'Click here to track your order status.',
              notification_type: 31,
            },
          });

          await shopEarnAdaptor.updatePastWishList(user_id);
          return order;
        }
      } else if (service_users && service_users.length > 0) {
        service_users = service_users.map(item => {
          item.ratings = (_.sumBy(item.reviews || [{ratings: 0}], 'ratings')) /
              (item.reviews || [{ratings: 0}]).length;
          item.service_name = service_name;
          return item;
        });

        const order = await orderAdaptor.placeNewOrder(
            {
              seller_id, user_address_id, order_type, status_type: 4,
              user_id, order_details: [{service_type_id, service_name}],
            });

        if (order) {
          console.log(
              {
                soket_status: io.sockets.adapter.rooms[`user-${seller_detail.user_id}`],
                user_id: seller_detail.user_id,
              });

          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit('assisted-status-change', JSON.stringify(order));
          }
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id, order_type,
              status_type: order.status_type, order, service_users, user_id,
              title: `${user_index_data.user_name ||
              ''} has placed an order.`,
              description: 'Please click here for further detail.',
              notification_type: 1, notification_id: order.id,
            },
          });

          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).
                emit('assisted-status-change', JSON.stringify({
                  order_id: order.id, order_type,
                  status_type: order.status_type, order, user_id,
                }));
          }
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id, order_type,
              status_type: order.status_type, order, user_id,
              title: `Your order has been placed with Seller ${seller_detail.seller_name ||
              ''}.`,
              description: seller_detail.rush_hours ?
                  `Seller ${seller_detail.seller_name ||
                  ''} response may be delayed due to busy hours. Click here to track your order status.` :
                  'Click here to track your order status.',
              notification_type: 31,
            },
          });
setTimeout(async () => {
  let order_exist = await modals.order.findOne({where: {id: order.id, status_type: 4, is_modified: false}});
  if(order_exist){
    order_exist.updateAttributes({status_type: 2});
  }

  await notificationAdaptor.notifyUserCron({
    user_id, payload: {
      order_id: order.id, order_type,
      status_type: 2, user_id,
      title: `Your order has been automatically marked cancelled.`,
      description: `Your order has been automatically marked cancelled as no response from Seller ${seller_detail.seller_name ||
      ''} for more than ${config.AUTO_CANCELLATION_TIMING} minutes. Please place a new order.`,
      notification_type: 31,
    },
  });

  await notificationAdaptor.notifyUserCron({
    seller_user_id: seller_detail.user_id,
    payload: {
      order_id: order.id, order_type,
      status_type: 2, user_id,
      title: `${user_index_data.user_name ||
      ''} order has been automatically marked cancelled.`,
      description: `Order automatically marked cancelled as no response from your end for more than ${config.AUTO_CANCELLATION_TIMING} minutes.`,
      notification_type: 1, notification_id: order.id,
    },
  });
}, config.AUTO_CANCELLATION_TIMING * 60 * 1000);
          return order;
        }
      } else {
        return undefined;
      }
    }
  }

  static async modify_order(data, fn) {
    let {seller_id, user_id, order_id, order_details, delivery_user_id} = data;
    const [seller_detail, user_index_data, order_data, measurement_types, service_user] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'user_id', 'id'],
              }),
          userAdaptor.retrieveUserIndexedData({
            where: {user_id}, attributes: [
              'wishlist_items', 'assisted_services', [
                modals.sequelize.literal(
                    `(Select full_name from users where users.id = ${user_id})`),
                'user_name'], [
                modals.sequelize.literal(
                    `(Select location from users where users.id = ${user_id})`),
                'location']],
          }),
          orderAdaptor.retrieveOrUpdateOrder(
              {where: {id: order_id, user_id, seller_id, status_type: 4}}, {},
              false),
          modals.measurement.findAll({where: {status_type: 1}}),
          sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      if (order_data.order_type === 2) {
        order_data.order_details[0].service_user = order_data.order_details[0].service_user ||
            {id: delivery_user_id, name: service_user.name};
      } else if (order_data.order_type === 1) {
        let sku_item_promise = [], sku_measurement_promise = [],
            measurement_values = [];
        order_data.order_details.forEach(item => {
          if (!item.item_availability && item.suggestion) {
            const {title, measurement_value} = item.suggestion;
            if (!item.suggestion.id) {
              measurement_values.push(measurement_value);
              sku_item_promise.push(shopEarnAdaptor.addUserSKU({
                title: `${title}${measurement_value ?
                    `(${measurement_value})` : ''}`,
                status_type: 11,
              }));
            } else {
              const {location} = user_index_data;
              const sku_measurement_attributes = (location &&
                  location.toLowerCase() === 'other') || !location ? [
                'id', 'pack_numbers', 'measurement_type',
                'measurement_value', 'mrp', [
                  modals.sequelize.literal(
                      '(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurement".measurement_type)'),
                  'measurement_acronym'], 'bar_code'] : [
                'id', 'pack_numbers', 'measurement_type',
                'measurement_value', 'mrp', [
                  modals.sequelize.literal(
                      '(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurement".measurement_type)'),
                  'measurement_acronym'], 'bar_code', 'cashback_percent'];
              const sku_attributes = [
                'sub_category_id', 'main_category_id', 'title', [
                  modals.sequelize.literal(
                      '(select category_name from categories as category where category.category_id = sku.sub_category_id)'),
                  'sub_category_name'], 'brand_id', 'category_id', 'id',
                'priority_index'];
              measurement_values.push(measurement_value);
              sku_item_promise.push(shopEarnAdaptor.retrieveSKU(
                  {
                    where: {id: item.suggestion.id},
                    attributes: sku_attributes,
                  }));
              sku_measurement_promise.push(
                  shopEarnAdaptor.retrieveSKUMeasurement(
                      {
                        where: {
                          id: item.suggestion.measurement_id,
                          sku_id: item.suggestion.id,
                        }, attributes: sku_measurement_attributes,
                      }));
            }
          }

          sku_item_promise.push({});
          measurement_values.push('');
        });
        const [sku_items, sku_measurement_detail] = await Promise.all(
            [
              Promise.all(sku_item_promise),
              Promise.all(sku_measurement_promise)]);
        console.log(JSON.stringify({sku_items}));
        order_data.order_details = order_data.order_details.map(
            (item, index) => {
              if (!item.item_availability && item.suggestion) {
                if (!item.suggestion.id) {
                  item.suggestion.id = sku_items[index].id;
                } else {
                  const {measurement_id, measurement_value, id} = item.suggestion;
                  item.suggestion = sku_items.find(
                      sItem => sItem.id.toString() === id);
                  item.suggestion.measurement_value = measurement_value;
                  item.suggestion.sku_measurement = sku_measurement_detail.find(
                      mdItem => mdItem.id.toString() === measurement_id);
                }
              }

              item.unit_price = parseFloat(
                  (item.unit_price ? item.unit_price : 0).toString());
              item.selling_price = parseFloat((item.unit_price *
                  parseFloat(item.quantity)).toString());
              if (item.updated_quantity) {
                item.updated_selling_price = parseFloat((item.unit_price *
                    parseFloat(item.updated_quantity)).toString());
              }

              return item;
            });
      }
      order_data.is_modified = true;
      order_data.delivery_user_id = delivery_user_id;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
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
      const service_user_key = order.order_type === 2 ?
          'service_user' : 'delivery_user';
      if (delivery_user_id) {
        order[service_user_key] = service_user;
        order[service_user_key].ratings = (_.sumBy(
            order[service_user_key].reviews || [{ratings: 0}], 'ratings')) /
            (order[service_user_key].reviews || [{ratings: 0}]).length;
        if (order.order_type === 2) {
          order[service_user_key].service_type = order[service_user_key].service_types.find(
              item => item.service_type_id ===
                  order.order_details[0].service_type_id);
        }
      }
      if (order) {
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          console.log(
              {
                soket_status: io.sockets.adapter.rooms[`user-${data.user_id}`],
                user_id: data.user_id,
              });
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' : 'assisted-status-change',
              JSON.stringify({
                order_id: order.id, is_modified: order.is_modified,
                status_type: order.status_type, order, user_id,
                order_type: order.order_type,
              }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id,
            order_type: order.order_type,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: order.order_type === 1 ?
                `Your Order has been modified by Seller ${seller_detail.seller_name ||
                ''}.` :
                `${order[service_user_key].name} has been assigned to assist you by Seller ${seller_detail.seller_name}`,
            description: 'Click here to review the details and approve it.',
            notification_type: 31,
          },
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
    let {seller_id, user_id, order_id, order_details} = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
              }),
          userAdaptor.retrieveUserIndexedData({
            where: {user_id}, attributes: [
              'wishlist_items', 'assisted_services', [
                modals.sequelize.literal(
                    `(Select full_name from users where users.id = ${user_id})`),
                'user_name']],
          }),
          orderAdaptor.retrieveOrUpdateOrder(
              {where: {id: order_id, user_id, seller_id, status_type: 19}}, {},
              false), modals.measurement.findAll({where: {status_type: 1}})]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.status_type = 20;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 19},
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
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        if (fn) {
          fn(order);
        } else {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit(order.order_type === 1 ?
                    'order-status-change' :
                    'assisted-status-change', JSON.stringify(order));
          }
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id,
              order_type: order.order_type,
              status_type: order.status_type,
              is_modified: order.is_modified,
              user_id,
              title: `Service has been initiated${order.service_user ?
                  ` by ${order.service_user.name ||
                  ''}.` : '.'}`,
              description: 'Please click here for more details.',
              notification_type: 1,
              notification_id: order.id,
              start_date: order.order_type === 2 ?
                  order.order_details.start_date : undefined,
            },
          });
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified,
            status_type: order.status_type, order, user_id,
            order_type: order.order_type, start_date: order.order_type ?
                order.order_details.start_date : undefined,
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id, order_type: order.order_type, user_id,
            status_type: order.status_type, is_modified: order.is_modified,
            title: `Service has been initiated ${order.service_user ?
                `by ${order.service_user.name || ''}.` :
                '.'}`,
            description: 'Please click here for further detail.',
            notification_type: 31,
            start_date: order.order_type ?
                order.order_details.start_date : undefined,
          },
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
    let {seller_id, user_id, order_id, order_details} = data;
    const [seller_detail, user_index_data, order_data, measurement_types, service_user] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
              }),
          userAdaptor.retrieveUserIndexedData({
            where: {user_id}, attributes: [
              'wishlist_items', 'assisted_services', [
                modals.sequelize.literal(
                    `(Select full_name from users where users.id = ${user_id})`),
                'user_name']],
          }),
          orderAdaptor.retrieveOrUpdateOrder(
              {where: {id: order_id, user_id, seller_id, status_type: 20}}, {},
              false), modals.measurement.findAll({where: {status_type: 1}}),
          sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order_details[0].service_user.id})),
            attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'],
            include: {
              as: 'service_types', where: JSON.parse(
                  JSON.stringify({
                    seller_id,
                    service_type_id: order_details[0].service_type_id,
                  })),
              model: modals.seller_service_types, required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          })]);
    if (order_data) {
      order_data.order_details = order_details || order_data.order_details;
      order_data.status_type = 21;
      const {start_date, end_date} = order_data.order_details[0];
      const {service_types} = service_user;
      const {price} = service_types[0] || {};
      const total_minutes = moment(end_date || moment(), moment.ISO_8601).
          diff(moment(start_date, moment.ISO_8601), 'minutes', true);
      if (Array.isArray(price)) {
        const base_price = price.find(item => item.price_type === 1);
        const other_price = price.find(item => item.price_type !== 1);
        order_data.order_details[0].total_amount = base_price ?
            base_price.value || 0 : 0;
        if (total_minutes > 60 && other_price) {
          order_data.order_details[0].hourly_price = Math.round(
              Math.ceil((total_minutes - 60) / 30) * other_price.value);
          order_data.order_details[0].total_amount += Math.round(
              Math.ceil((total_minutes - 60) / 30) * other_price.value);
        }
        order_data.order_details[0].base_price = base_price ?
            base_price.value || 0 : 0;
      } else {
        order_data.order_details[0].total_amount = Math.round(
            Math.ceil(total_minutes / 60) * price.value);
      }
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {id: order_id, user_id, seller_id, status_type: 20},
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
              }, {
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
              }, {
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

        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit(order.order_type === 1 ?
                  'order-status-change' :
                  'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id,
            order_type: order.order_type,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: `Service has been completed ${order.service_user ?
                `by ${order.service_user.name ||
                ''}.` : '.'}`,
            description: 'Please click here for further detail.',
            notification_type: 1,
            notification_id: order.id,
            start_date: order.order_type === 2 ?
                order.order_details.start_date : undefined,
            end_date: order.order_type === 2 ?
                order.order_details.end_date : undefined,
          },
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type, order, user_id,
            order_type: order.order_type,
            start_date: order.order_type ?
                order.order_details.start_date : undefined,
            end_date: order.order_type ?
                order.order_details.end_date : undefined,
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id, order_type: order.order_type,
            status_type: order.status_type, notification_type: 31,
            is_modified: order.is_modified, user_id,
            title: `Service has been provided${order.service_user ?
                `by ${order.service_user.name || ''}.` : '.'}`,
            description: 'Please click here for further detail.',
            start_date: order.order_type ?
                order.order_details.start_date : undefined,
            end_date: order.order_type ?
                order.order_details.end_date : undefined,
          },
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
    let {seller_id, user_id, order_id, status_type, is_user, order_details} = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
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
              false), modals.measurement.findAll({where: {status_type: 1}})]);
    if (order_data) {
      if (order_data.order_type === 2) {
        order_data.order_details = (order_details || order_data.order_details);
      } else {
        order_data.order_details = (order_details ||
            order_data.order_details).map(item => {

          if (!item.item_availability && item.suggestion) {
            const {id, title, measurement_value, sku_measurement: sku_measurement_detail, brand_id} = item.suggestion;
            item.id = id;
            item.sku_measurement = sku_measurement_detail;
            if (!sku_measurement_detail) {
              item = _.omit(item, ['sku_measurement']);
            }
            const {id: sku_measurement_id} = item.sku_measurement || {};
            item.uid = `${id}${sku_measurement_id ?
                `-${sku_measurement_id}` : ''}`;
            item.title = `${title}${measurement_value &&
            !sku_measurement_id ? `(${measurement_value})` : ''}`;
            item.brand_id = brand_id;
            item.item_availability = true;
          }

          if (item.updated_measurement) {
            item.sku_measurement = item.updated_measurement;
            console.log(JSON.stringify(item.sku_measurement));
            const {id: sku_measurement_id} = item.sku_measurement || {};
            item.uid = `${item.id}${sku_measurement_id ?
                `-${sku_measurement_id}` : ''}`;
          }

          item.quantity = item.updated_quantity ?
              parseFloat(item.updated_quantity) : parseFloat(item.quantity);

          item = _.omit(item, ['updated_measurement', 'suggesstion']);
          item.unit_price = parseFloat((item.unit_price || 0).toString());
          item.selling_price = parseFloat((item.unit_price *
              parseFloat(item.quantity.toString())).toString());
          return item;
        }).filter(item => item.item_availability);
      }
      order_data.status_type = status_type || 16;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
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
          }, JSON.parse(JSON.stringify(order_data)), false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        if (is_user) {
          if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
            io.sockets.in(`seller-${seller_detail.user_id}`).
                emit(order.order_type === 1 ?
                    'order-status-change' :
                    'assisted-status-change', JSON.stringify(order));
          }
          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail.user_id,
            payload: {
              order_id: order.id,
              status_type: order.status_type,
              is_modified: order.is_modified,
              user_id,
              title: `${user_index_data.user_name ||
              ''} has approved ${order.order_type === 1 ?
                  `modifications.` :
                  `${order.service_user.name} for assistance.`}`,
              description: 'Click here for more details.',
              notification_type: 1,
              notification_id: order.id,
              order_type: order.order_type,
            },
          });
        }

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified, order_type: order.order_type,
            status_type: order.status_type, order, user_id,
          }));
        }
        if (!is_user) {
          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              order_type: order.order_type,
              status_type: order.status_type,
              is_modified: order.is_modified,
              user_id,
              title: `Your Order has been approved by Seller ${seller_detail.seller_name ||
              ''}.`,
              description: 'Delivery details will be updated shortly.',
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

  static async order_out_for_delivery(data, fn) {
    try {
      let {seller_id, user_id, order_id, status_type, delivery_user_id, order_details} = data;
      const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
          [
            sellerAdaptor.retrieveSellerDetail(
                {
                  where: {id: seller_id},
                  attributes: [
                    'seller_type_id', 'seller_name', 'id', 'user_id'],
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
                  attributes: [
                    'id',
                    'order_details',
                    'order_type',
                    'status_type'],
                }, {}, false),
            modals.measurement.findAll({where: {status_type: 1}})]);
      if (order_data) {
        order_data.order_details = order_details || order_data.order_details;
        if (order_data.order_type === 1) {
          order_data.order_details = order_data.order_details.map(item => {
            item.quantity = parseFloat(item.quantity.toString());
            item.unit_price = parseFloat((item.unit_price || 0).toString());
            item.selling_price = item.selling_price &&
            item.selling_price.toString() !== '0' ?
                parseFloat(item.selling_price.toString()) :
                parseFloat((item.unit_price * item.quantity).toString());
            return item;
          });
        }
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
          if (order.order_type === 2 && order.delivery_user_id) {
            order.service_user = await sellerAdaptor.retrieveAssistedServiceUser(
                {
                  where: JSON.parse(
                      JSON.stringify({id: order.delivery_user_id})),
                  attributes: [
                    'id', 'name', 'mobile_no',
                    'reviews', 'document_details'],
                  include: {
                    as: 'service_types',
                    where: JSON.parse(JSON.stringify({seller_id})),
                    model: modals.seller_service_types,
                    required: true,
                    attributes: ['service_type_id', 'seller_id', 'price', 'id'],
                  },
                });
            order.service_user.ratings = (_.sumBy(
                order.service_user.reviews || [{ratings: 0}], 'ratings')) /
                (order.service_user.reviews || [{ratings: 0}]).length;
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
            order.service_user.reviews = order.service_user.reviews ||
                [];
            const review_user_ids = (order.service_user.reviews).map(
                item => item.updated_by);
            const review_users = await userAdaptor.retrieveUsers({
              where: {id: review_user_ids}, attributes: [
                'id', ['full_name', 'name'], 'image_name'],
            });
            order.service_user.reviews = (order.service_user.reviews).map(
                item => {
                  item.user = review_users.find(
                      uItem => uItem.id === item.updated_by);
                  item.user_name = (item.user || {}).name;
                  return item;
                });
          }
          order.order_details = order.order_type === 1 ?
              order.order_details.map(item => {
                if (item.sku_measurement) {
                  const measurement_type = measurement_types.find(
                      mtItem => mtItem.id.toString() ===
                          item.sku_measurement.measurement_type.toString());
                  item.sku_measurement.measurement_acronym = measurement_type ?
                      measurement_type.acronym : 'unit';
                }
                if (item.updated_measurement) {
                  const updated_measurement_type = measurement_types.find(
                      mtItem => mtItem.id.toString() ===
                          item.updated_measurement.measurement_type.toString());
                  item.updated_measurement.measurement_acronym = updated_measurement_type ?
                      updated_measurement_type.acronym : 'unit';
                }

                return item;
              }) : order.order_details;
          if (delivery_user_id && order.order_type === 1) {
            order.delivery_user = await sellerAdaptor.retrieveAssistedServiceUser(
                {
                  where: JSON.parse(
                      JSON.stringify({id: delivery_user_id})), attributes: [
                    'id', 'name', 'mobile_no',
                    'reviews', 'document_details'],
                });
            order.delivery_user.ratings = (_.sumBy(
                order.delivery_user.reviews || [{ratings: 0}], 'ratings')) /
                (order.delivery_user.reviews || [{ratings: 0}]).length;
            order.delivery_user.reviews = order.delivery_user.reviews ||
                [];
            const review_user_ids = (order.delivery_user.reviews).map(
                item => item.updated_by);
            const review_users = await userAdaptor.retrieveUsers({
              where: {id: review_user_ids}, attributes: [
                'id', ['full_name', 'name'], 'image_name'],
            });
            order.delivery_user.reviews = order.delivery_user.reviews.map(
                item => {
                  item.user = review_users.find(
                      uItem => uItem.id === item.updated_by);
                  item.user_name = (item.user || {}).name;
                  return item;
                });
          }

          if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
            io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
                'order-status-change' :
                'assisted-status-change', JSON.stringify({
              order_id: order.id, is_modified: order.is_modified,
              status_type: order.status_type,
              delivery_user: order.delivery_user,
              order, user_id, order_type: order.order_type,
            }));
          }

          await notificationAdaptor.notifyUserCron({
            user_id, payload: {
              order_id: order.id,
              status_type: order.status_type,
              is_modified: order.is_modified, user_id,
              title: `Hurray! ${order.delivery_user ?
                  `${(order.delivery_user || {}).name ||
                  ''} from Seller ${seller_detail.seller_name ||
                  ''} is on the way ${order.order_type === 1 ?
                      'with your order.' : 'for your assistance.'}` :
                  `Your Order is on it's way from Seller ${seller_detail.seller_name ||
                  ''}`}.`,
              description: 'Please click here for more detail.',
              notification_type: 31,
              order_type: order.order_type,
            },
          });

          return order;
        } else {
          return false;
        }
      } else {
        return undefined;
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  static async reject_order_by_seller(data, fn) {
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
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
                  status_type: 4, is_modified: false,
                }, attributes: ['id'],
              }, {}, false),
          modals.measurement.findAll({where: {status_type: 1}})]);
    if (order_data) {
      order_data.status_type = status_type || 18;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id, user_id, seller_id,
              status_type: 4, is_modified: false,
            }, include: [
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
              }, {
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
              }, {
                model: modals.user_addresses, as: 'user_address',
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
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            order_id: order.id,
            is_modified: order.is_modified, order_type: order.order_type,
            status_type: order.status_type, order, user_id,
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            order_id: order.id, status_type: order.status_type,
            is_modified: order.is_modified, user_id,
            title: `Oops! Looks like your order has been rejected by Seller ${seller_detail.seller_name ||
            ''}.`,
            description: 'Please click here for more details.',
            notification_type: 31, order_type: order.order_type,
          },
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
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
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
              }, {}, false),
          modals.measurement.findAll({where: {status_type: 1}})]);
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
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit(order.order_type === 1 ?
                  'order-status-change' :
                  'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: `Oops! Looks like ${user_index_data.user_name ||
            ''} is not satisfied by modification in order and rejected the order.`,
            description: 'Please click here for more details.',
            notification_type: 1,
            notification_id: order.id,
            order_type: order.order_type,
          },
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            order, order_type: order.order_type,
            user_id,
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
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
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
              }, {}, false),
          modals.measurement.findAll({where: {status_type: 1}})]);
    if (order_data) {
      order_data.status_type = status_type || 17;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id, user_id, seller_id,
              status_type: 4, is_modified: false,
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
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit(order.order_type === 1 ?
                  'order-status-change' :
                  'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order_id: order.id,
            status_type: order.status_type,
            is_modified: order.is_modified,
            user_id,
            title: `Oops! ${user_index_data.user_name ||
            ''} has cancelled the order.`,
            description: 'Please click here for more details.',
            notification_type: 1,
            notification_id: order.id,
            order_type: order.order_type,
          },
        });

        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            order, order_type: order.order_type,
            user_id,
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

  static async mark_order_complete(data, fn) {
    let {seller_id, user_id, order_id, status_type} = data;
    const [seller_detail, user_index_data, order_data, measurement_types] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: [
                  'seller_type_id', 'seller_name', 'id', 'user_id',
                  'is_fmcg', 'has_pos', 'is_assisted'],
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
                  status_type: [16, 19, 21],
                }, attributes: ['id'],
              }, {}, false),
          modals.measurement.findAll({where: {status_type: 1}})]);
    if (order_data) {
      order_data.status_type = status_type || 5;
      let order = await orderAdaptor.retrieveOrUpdateOrder(
          {
            where: {
              id: order_id, user_id, seller_id,
              status_type: [16, 19, 21],
            },
          }, order_data, false);
      if (order) {
        if (order.order_type === 2 && order.delivery_user_id) {
          order.service_user = await sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(
                JSON.stringify({id: order.delivery_user_id})), attributes: [
              'id', 'name', 'mobile_no',
              'reviews', 'document_details'], include: {
              as: 'service_types',
              where: JSON.parse(JSON.stringify({seller_id})),
              model: modals.seller_service_types,
              required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            },
          });
          order.service_user.ratings = (_.sumBy(
              order.service_user.reviews || [{ratings: 0}], 'ratings')) /
              (order.service_user.reviews || [{ratings: 0}]).length;
          if (order.order_type === 2) {
            order.service_user.service_type = order.service_user.service_types.find(
                item => item.service_type_id ===
                    order.order_details[0].service_type_id);
          }
        }
        order.order_details = order.order_type === 1 ?
            order.order_details.map(item => {
              item.selling_price = parseFloat(
                  (item.selling_price || 0).toString());
              if (item.sku_measurement) {
                const measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.sku_measurement.measurement_type.toString());
                item.sku_measurement.measurement_acronym = measurement_type ?
                    measurement_type.acronym : 'unit';
              }
              if (item.updated_measurement) {
                const updated_measurement_type = measurement_types.find(
                    mtItem => mtItem.id.toString() ===
                        item.updated_measurement.measurement_type.toString());
                item.updated_measurement.measurement_acronym = updated_measurement_type ?
                    updated_measurement_type.acronym : 'unit';
              }

              return item;
            }) : order.order_details;
        const payment_details = await SocketServer.init_on_payment({
          user_id, seller_id, has_pos: seller_detail.has_pos,
          home_delivered: !!order.delivery_user_id,
          sku_details: order.order_type === 2 ? order.order_details :
              order.order_details.map(item => {
                let {id: sku_id, quantity, sku_measurement, selling_price} = item;
                const {id: sku_measurement_id, cashback_percent} = sku_measurement ||
                {};
                selling_price = parseFloat((selling_price || 0).toString());
                return JSON.parse(JSON.stringify({
                  sku_id, sku_measurement_id, seller_id, user_id,
                  updated_by: user_id, quantity,
                  selling_price: selling_price, status_type: 11,
                  available_cashback: selling_price && cashback_percent ?
                      (selling_price * (cashback_percent || 0)) / 100 :
                      undefined,
                }));
              }), order_type: order.order_type,
          seller_type_id: seller_detail.seller_type_id,
        });

        order_data.expense_id = (payment_details.product || {}).id;
        order_data.job_id = (payment_details.cashback_jobs || {}).id;
        order = await orderAdaptor.retrieveOrUpdateOrder(
            {
              where: {
                id: order_id, user_id, seller_id,
                status_type: [16, 19, 5],
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

        order.upload_id = seller_detail.has_pos ?
            (payment_details.product || {}).job_id : undefined;
        order.available_cashback = 0;
        order.order_details = order.order_type && order.order_type === 1 ?
            order.order_details.map(item => {
              item.selling_price = parseFloat(
                  (item.selling_price || 0).toString());
              return item;
            }) : order.order_details;
        console.log('It\' here.', JSON.stringify(order.order_details));
        order.total_amount = order.order_type && order.order_type === 1 ?
            _.sumBy(order.order_details, 'selling_price') :
            _.sumBy(order.order_details, 'total_amount');
        if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
          io.sockets.in(`seller-${seller_detail.user_id}`).
              emit(order.order_type === 1 ?
                  'order-status-change' :
                  'assisted-status-change', JSON.stringify(order));
        }
        await notificationAdaptor.notifyUserCron({
          seller_user_id: seller_detail.user_id,
          payload: {
            order, title: `${user_index_data.user_name ||
            ''} has marked payment complete for his order.`,
            description: 'Please click here for further detail.',
            notification_type: 1, notification_id: order.id,
          },
        });

        payment_details.order = order;
        if (io.sockets.adapter.rooms[`user-${data.user_id}`]) {
          io.sockets.in(`user-${data.user_id}`).emit(order.order_type === 1 ?
              'order-status-change' :
              'assisted-status-change', JSON.stringify({
            seller_type_id: seller_detail.seller_type_id,
            order_id: order.id, is_modified: order.is_modified,
            status_type: order.status_type,
            user_id, order_type: order.order_type,
            result: payment_details, order,
          }));
        }
        await notificationAdaptor.notifyUserCron({
          user_id, payload: {
            seller_type_id: seller_detail.seller_type_id,
            order_id: order.id, result: payment_details, order, user_id,
            status_type: order.status_type, is_modified: order.is_modified,
            title: `Your Order has been successfully completed!`,
            notification_type: 31, order_type: order.order_type,
          },
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
    let {user_id, seller_id, sku_details, home_delivered, order_type, seller_type_id, has_pos} = data;
    const total_amount = order_type && order_type === 1 ?
        _.sumBy(sku_details, 'selling_price') :
        _.sumBy(sku_details, 'total_amount');
    const jobResult = await jobAdaptor.createJobs({
      job_id: `${Math.random().toString(36).substr(2, 9)}${(user_id).toString(
          36)}`, user_id,
      updated_by: user_id, uploaded_by: user_id, user_status: 8,
      admin_status: 2, comments: `This job is sent for online expense`,
    });
    const [product, cashback_jobs, user_default_limit_rules] = await Promise.all(
        [
          productAdaptor.createEmptyProduct({
            job_id: jobResult.id, user_id, main_category_id: 8,
            category_id: config.HOUSEHOLD_CATEGORY_ID,
            purchase_cost: total_amount, updated_by: user_id, seller_id,
            status_type: 11, copies: [],
            document_date: moment.utc().startOf('day').format('YYYY-MM-DD'),
          }),
          order_type && order_type === 1 && has_pos ?
              jobAdaptor.createCashBackJobs({
                job_id: jobResult.id, user_id,
                updated_by: user_id, uploaded_by: user_id,
                user_status: 8, admin_status: 2, seller_id,
                cashback_status: 13, online_order: true,
                verified_seller: seller_type_id === 1,
                seller_status: seller_type_id === 1 ? 13 : 17,
                digitally_verified: true, home_delivered,
              }) : undefined,
          categoryAdaptor.retrieveLimitRules({where: {user_id: 1}})]);

    let home_delivery_limit = user_default_limit_rules.find(
        item => item.rule_type === 7);
    let sku_expenses, home_delivery_cash_back;
    if (order_type && order_type === 1) {
      [sku_expenses] = await Promise.all([
        shopEarnAdaptor.addUserSKUExpenses(
            sku_details.map(item => {
              item.expense_id = product.id;
              item.job_id = (cashback_jobs || {}).id;
              return item;
            }))]);
    }

    return {
      product, cashback_jobs, sku_expenses,
    };
  }

  static async redeem_cash_back_at_seller(data, fn) {
    let {seller_id, user_id, cash_back_details, amount} = data;

    const [seller_detail, user_index_data] = await Promise.all(
        [
          sellerAdaptor.retrieveSellerDetail(
              {
                where: {id: seller_id},
                attributes: ['seller_type_id', 'seller_name', 'id', 'user_id'],
              }),
          userAdaptor.retrieveUserIndexedData({
            where: {user_id}, attributes: [
              'wishlist_items', 'assisted_services', [
                modals.sequelize.literal(
                    `(Select full_name from users where users.id = ${user_id})`),
                'user_name']],
          })]);
    if (io.sockets.adapter.rooms[`seller-${seller_detail.user_id}`]) {
      io.sockets.in(`seller-${seller_detail.user_id}`).
          emit('cash-back-redeemed',
              JSON.stringify({cash_back_details, amount}));
    }

    await notificationAdaptor.notifyUserCron({
      seller_user_id: seller_detail.user_id,
      payload: {
        cash_back_details, amount,
        title: `Your wallet has been credited with INR${amount} against redemption request from ${user_index_data.user_name ||
        ''}.`,
        description: 'Please click here for further detail.',
        notification_type: 2,
      },
    });
  }

  static async linkSellerWithUser(seller_id, user_id) {
    try {
      const [user_detail, user_index_data, seller] = await Promise.all([
        userAdaptor.retrieveSingleUser({where: {id: user_id}}),
        userAdaptor.retrieveUserIndexedData({
          where: {user_id, status_type: [1, 11]},
          attributes: [
            'my_seller_ids', 'seller_offer_ids', [
              modals.sequelize.literal(
                  `(Select full_name from users where id = ${user_id})`),
              'user_name']],
        }),
        sellerAdaptor.retrieveSellerDetail(
            {where: {id: seller_id}})]);
      if (seller) {
        let {seller_offer_ids, my_seller_ids} = user_index_data || {};
        let {customer_ids} = seller;
        customer_ids = customer_ids || [];
        customer_ids.push(user_id);
        customer_ids = _.uniq(customer_ids);
        my_seller_ids = (my_seller_ids || []);
        sellerAdaptor.retrieveOrUpdateSellerDetail(
            {where: {id: seller_id}}, {customer_ids});
        my_seller_ids.push(parseInt(seller_id));
        if (!user_index_data) {
          await userAdaptor.createUserIndexedData({my_seller_ids, user_id},
              {where: {user_id}});

          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller.user_id, payload: {
              title: `${user_detail.name ||
              'User'} has added you as a Seller for future orders and communication.`,
              description: 'Please click here for more detail.',
              notification_type: 2,
            },
          });
        } else {
          await userAdaptor.updateUserIndexedData(
              {my_seller_ids: _.uniq(my_seller_ids)},
              {where: {user_id}});

          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller.user_id, payload: {
              title: `${user_index_data.user_name ||
              'User'} has added you as a Seller for future orders and communication.`,
              description: 'Please click here for more detail.',
              notification_type: 2,
            },
          });
        }
      }
    } catch (err) {
      console.log(
          `Error on ${moment()} for user ${user_id} is as follow: \n \n ${err}`);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: `Unable to link seller`,
      });
    }
  }
}