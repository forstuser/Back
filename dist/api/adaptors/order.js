'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class OrderAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new _category2.default(modals);
    this.userAdaptor = new _user2.default(modals);
  }

  async retrieveOrUpdateOrder(query_options, order, is_create) {
    let result = await this.modals.order.findOne(query_options);
    if (!result && is_create) {
      result = await this.modals.order.create(order);
    }

    if (result) {
      (await order) ? result.updateAttributes(JSON.parse(JSON.stringify(order))) : order;
      return result.toJSON();
    }

    return result;
  }

  async placeNewOrder(order) {
    console.log('order is getting placed');
    const result = await this.modals.order.create(order);
    return result.toJSON();
  }

  async retrieveOrderList(query_options) {
    const result = await this.modals.order.findAll(query_options);
    return result ? result.map(item => {
      item = item.toJSON();
      if (item.order_type === 1) {
        item.order_item_counts = item.order_details.length;
        item = _lodash2.default.omit(item, 'order_details');
      }
      item.seller_exist = item.my_seller_ids && item.my_seller_ids.length > 0;
      const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.user_address || {};
      item.user_address_detail = `${address_line_1}${address_line_2 ? ` ${address_line_2}` : ''}, ${locality_name}, ${city_name}, ${state_name}-${pin_code}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
      return item;
    }) : result;
  }

  async retrieveOrUpdatePaymentDetails(options, defaults) {
    let result = await this.modals.payments.findOne(options);
    if (result) {
      await result.updateAttributes(defaults);
    } else {
      console.log(JSON.stringify({ defaults }));
      result = await this.modals.payments.create(defaults, options);
    }

    return result.toJSON();
  }
}
exports.default = OrderAdaptor;