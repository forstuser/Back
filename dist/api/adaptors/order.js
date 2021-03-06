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

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

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

        if (!result) {
            query_options.where = _lodash2.default.omit(query_options.where, 'status_type');
            result = await this.modals.order.findOne(query_options);
        }

        result = result ? result.toJSON() : {};

        const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = result.user_address || {};
        result.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
        result.user_address_detail = result.user_address_detail.trim();
        return result;
    }

    async retrieveOrderDetail(query_options) {
        let result = await this.modals.order.findOne(query_options);
        return result ? result.toJSON() : result;
    }

    async placeNewOrder(order) {
        console.log('order is getting placed');
        const result = await this.modals.order.create(order);
        return result.toJSON();
    }

    async retrieveOrderList(query_options) {
        const result = await Promise.all([this.modals.order.findAll(query_options), await this.modals.order.count({ where: query_options.where })]);
        return {
            orders: result[0] ? result[0].map(item => {
                item = item.toJSON();
                item.seller_exist = item.my_seller_ids && item.my_seller_ids.length > 0;
                const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.user_address || {};
                item.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
                item.user_address_detail = item.user_address_detail.trim();
                item.order_details = item.order_details.map(odItem => {
                    odItem.offer_discount = parseFloat((odItem.offer_discount || 0).toString());
                    odItem.current_unit_price = odItem.sku_measurement ? odItem.sku_measurement.mrp : 0;
                    if (odItem.suggestion) {

                        odItem.unit_price = parseFloat((odItem.unit_price ? odItem.unit_price : odItem.suggestion && odItem.suggestion.sku_measurement ? odItem.suggestion.sku_measurement.mrp : 0).toString());
                        odItem.suggestion.offer_discount = parseFloat((odItem.suggestion.offer_discount || 0).toString());
                        odItem.current_selling_price = parseFloat((odItem.current_unit_price * parseFloat(odItem.quantity)).toString());
                    } else {
                        odItem.unit_price = odItem.unit_price ? odItem.unit_price : odItem.current_unit_price;
                        odItem.current_selling_price = parseFloat((odItem.unit_price * parseFloat(odItem.quantity)).toString());
                    }

                    odItem.selling_price = parseFloat((odItem.unit_price * parseFloat(odItem.quantity)).toString());
                    if (odItem.updated_quantity) {
                        odItem.selling_price = parseFloat((odItem.unit_price * parseFloat(odItem.updated_quantity)).toString());
                    }
                    odItem.selling_price = parseFloat((odItem.selling_price || 0).toString());

                    odItem.current_selling_price = _lodash2.default.round(odItem.current_selling_price - odItem.current_selling_price * odItem.offer_discount / 100, 2);
                    odItem.selling_price = _lodash2.default.round(odItem.suggestion ? odItem.selling_price - odItem.selling_price * odItem.suggestion.offer_discount / 100 : odItem.selling_price - odItem.selling_price * odItem.offer_discount / 100, 2);
                    return odItem;
                });
                item.total_amount = item.total_amount || _lodash2.default.round(item.order_type && item.order_type === 1 ? _lodash2.default.sumBy(item.order_details, 'selling_price') : _lodash2.default.sumBy(item.order_details, 'total_amount'), 2);

                if (item.order_type === 1 || item.collect_at_store) {
                    item.order_item_counts = item.order_details.length;
                    item = _lodash2.default.omit(item, 'order_details');
                }
                return item;
            }) : result[0],
            order_count: result[1]
        };
    }

    async retrieveOrUpdatePaymentDetails(options, defaults) {
        let result = await this.modals.payments.findOne(options);
        const payment_data = result ? result.toJSON() : result;
        if (result && defaults) {
            payment_data.payment_detail = payment_data.payment_detail || {};
            if (defaults.payment_detail) {
                payment_data.payment_detail.requests = payment_data.payment_detail.requests || [];
                if (defaults.payment_detail.requests) {
                    const orderIds = payment_data.payment_detail.requests.map(item => item.orderId);
                    payment_data.payment_detail.requests.push(...defaults.payment_detail.requests.filter(item => !_lodash2.default.includes(orderIds, item.orderId)));
                }

                defaults.payment_detail = payment_data.payment_detail;

                if (defaults.ref_id) {
                    defaults.payment_detail.ref_ids = (payment_data.payment_detail || { ref_ids: [] }).ref_ids || [];
                    defaults.payment_detail.ref_ids.push({ ref_id: defaults.ref_id, order_time: (0, _moment2.default)() });
                }
            }
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