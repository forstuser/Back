'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

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

      const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.user_address || {};
      item.user_address_detail = `${address_line_1}${address_line_2 ? ` ${address_line_2}` : ''},${locality_name},${city_name},${state_name}-${pin_code}`.split('null', '').split('undefined', '').split(',,').join(',');
      return item;
    }) : result;
  }
}
exports.default = OrderAdaptor;