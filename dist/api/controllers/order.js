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
    sellerAdaptor = new _sellers2.default(modals);
  }

  static async getOrderDetails(request, reply) {
    const user = request.user || _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const { id } = request.params;
        const result = await orderAdaptor.retrieveOrUpdateOrder({ where: { id } }, {}, false);
        if (result) {
          result.seller = {};
          result.user = {};
          let measurement_types = [];
          [result.seller, result.user, measurement_types, result.user_address, result.delivery_user] = await Promise.all([sellerAdaptor.retrieveSellerDetail({
            where: { id: result.seller_id }, attributes: ['seller_name', 'address', 'contact_no', 'email', [modals.sequelize.json(`"seller_details"->'basic_details'`), 'basic_details'], [modals.sequelize.literal(`"seller_details"->'business_details'`), 'business_details']]
          }), userAdaptor.retrieveUserById({ id: result.user_id }, result.user_address_id), modals.measurement.findAll({ where: { status_type: 1 } }), userAdaptor.retrieveUserAddress({
            where: JSON.parse(JSON.stringify({ id: result.user_address_id }))
          }), result.delivery_user_id ? sellerAdaptor.retrieveAssistedServiceUser({
            where: JSON.parse(JSON.stringify({ id: result.delivery_user_id })),
            attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details']
          }) : undefined]);
          if (result.delivery_user) {
            result.delivery_user = _lodash2.default.sumBy(result.delivery_user.reviews || [{ ratings: 0 }], 'rating') / (result.delivery_user.reviews || [{ ratings: 0 }]).length;
          }
          result.order_details = result.order_details.map(item => {
            if (item.sku_measurement) {
              const measurement_type = measurement_types.find(mtItem => mtItem.id === item.sku_measurement.measurement_type);
              item.sku_measurement.measurement_acronym = measurement_type ? measurement_type.acronym : 'unit';
            }
            if (item.updated_measurement) {
              const updated_measurement_type = measurement_types.find(mtItem => mtItem.id === item.updated_measurement.measurement_type);
              item.updated_measurement.measurement_acronym = updated_measurement_type ? updated_measurement_type.acronym : 'unit';
            }

            return item;
          });
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
            where: JSON.parse(JSON.stringify({ seller_id, user_id, status_type })),
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
        let { seller_id, order_type, service_type_id, user_address, user_address_id } = request.payload;
        user_address = user_address || {};
        user_address.user_id = user_id;
        user_address.updated_by = user_id;
        const result = await socket_instance.place_order({
          seller_id, user_id, order_type, service_type_id,
          user_address, user_address_id
        });
        if (result) {
          return reply.response({ result, status: true });
        }

        return reply.response({
          message: 'Seller is not a BinBill verified seller.',
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
        let { user_id, order_details } = request.payload;
        const result = await socket_instance.modify_order({ seller_id, user_id, order_details, order_id });
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
          is_user: !user.seller_details, order_details
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

  static async orderOutForDelivery(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let { seller_id, order_id } = request.params;
        let { user_id, delivery_user_id, order_details } = request.payload;
        const result = await socket_instance.order_out_for_delivery({ seller_id, user_id, order_id, status_type: 19, delivery_user_id, order_details });
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
}

exports.default = OrderController;