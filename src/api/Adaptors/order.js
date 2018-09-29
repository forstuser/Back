import CategoryAdaptor from './category';
import UserAdaptor from './user';
import _ from 'lodash';

export default class OrderAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.userAdaptor = new UserAdaptor(modals);
  }

  async retrieveOrUpdateOrder(query_options, order, is_create) {
    let result = await this.modals.order.findOne(query_options);
    if (!result && is_create) {
      result = await this.modals.order.create(order);
    }

    if (result) {
      await order ?
          result.updateAttributes(JSON.parse(JSON.stringify(order))) :
          order;
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
        item = _.omit(item, 'order_details');
      }
      item.seller_exist = item.my_seller_ids && item.my_seller_ids.length > 0;
      const {address_line_1, address_line_2, city_name, state_name, locality_name, pin_code} = item.user_address ||
      {};
      item.user_address_detail = (`${address_line_1}${address_line_2 ?
          ` ${address_line_2}` :
          ''}, ${locality_name}, ${city_name}, ${state_name}-${pin_code}`).
          split('null').join(',').
          split('undefined').join(',').
          split(',,').join(',').
          split(',-,').join(',').
          split(',,').join(',').
          split(',,').join(',');
      return item;
    }) : result;
  }
}