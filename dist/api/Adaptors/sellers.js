'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
class SellerAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveOfflineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.offlineSellers.findAll({
      where: options,
      attributes: [['sid', 'id'], ['seller_name', 'name'], ['owner_name', 'ownerName'], 'gstin', ['pan_no', 'panNo'], ['reg_no', 'registrationNo'], ['is_service', 'isService'], ['is_onboarded', 'isOnboarded'], 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'url', ['contact_no', 'contact'], 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveOnlineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.onlineSellers.findAll({
      where: options,
      attributes: [['sid', 'id'], ['seller_name', 'name'], 'gstin', 'url', 'contact', 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveOrCreateOfflineSellers(options, defaults) {
    let sellerResult = await this.modals.offlineSellers.findOne({
      where: options
    });
    if (sellerResult) {
      const sellerDetail = sellerResult.toJSON();
      defaults.status_type = sellerDetail.status_type;
      await sellerResult.updateAttributes(defaults);
    } else {
      sellerResult = await this.modals.offlineSellers.create(defaults);
    }
    return sellerResult.toJSON();
  }
}
exports.default = SellerAdaptor;