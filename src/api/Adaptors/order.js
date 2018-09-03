import CategoryAdaptor from './category';
import UserAdaptor from './user';

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
    return result ? result.map(item => item.toJSON()) : result;
  }
}