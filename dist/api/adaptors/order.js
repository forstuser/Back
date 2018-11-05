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
      await (order ? result.updateAttributes(JSON.parse(JSON.stringify(order))) : order);
    }

    result = result.toJSON();

    const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = result.user_address || {};
    result.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
    result.user_address_detail = result.user_address_detail.trim();
    if (result.order_details) {
      result.order_details = result.order_details.map(item => {
        item.selling_price = parseFloat((item.selling_price || 0).toString());
        return item;
      });
    }
    result.total_amount = result.total_amount || _lodash2.default.sumBy(result.order_details, 'selling_price');
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
      item.seller_exist = item.my_seller_ids && item.my_seller_ids.length > 0;
      const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.user_address || {};
      item.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
      item.user_address_detail = item.user_address_detail.trim();
      item.order_details = item.order_details.map(odItem => {
        odItem.selling_price = parseFloat((odItem.selling_price || 0).toString());
        return odItem;
      });
      item.total_amount = item.total_amount || _lodash2.default.sumBy(item.order_details, 'selling_price');

      if (item.order_type === 1) {
        item.order_item_counts = item.order_details.length;
        item = _lodash2.default.omit(item, 'order_details');
      }
      return item;
    }) : result;
  }

  async retrieveOrUpdatePaymentDetails(options, defaults) {
    let result = await this.modals.payments.findOne(options);
    const payment_data = result ? result.toJSON() : result;
    if (result && defaults) {
      defaults.status_type = payment_data.status_type === 16 ? payment_data.status_type : defaults.status_type;
      await result.updateAttributes(defaults);
    } else if (defaults) {
      console.log(JSON.stringify({ defaults }));
      result = await this.modals.payments.create(defaults, options);
    }

    return result ? result.toJSON() : {};
  }

  async addPaymentToSellerWallet(options) {
    const { status_type, order_id, seller_id, amount, transaction_type, user_id, cashback_source } = options;
    console.log(JSON.stringify(options));
    let wallet_credited = false;
    let cash_back_details = await this.modals.seller_wallet.findOne(JSON.parse(JSON.stringify({ where: { order_id } })));
    if (!cash_back_details) {
      cash_back_details = await this.modals.seller_wallet.create(JSON.parse(JSON.stringify({
        status_type: status_type || 16, order_id, cashback_source,
        amount, transaction_type, user_id, seller_id
      })));
      wallet_credited = true;
    }

    cash_back_details = cash_back_details.toJSON();
    return { cash_back_details, wallet_credited };
  }
}
exports.default = OrderAdaptor;