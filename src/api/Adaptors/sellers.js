export default class SellerAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveOfflineSellers(options) {
    options.status_type = 1;
    return this.modals.offlineSellers.findAll({
      where: options,
      attributes: [
        [
          'sid',
          'id'],
        'seller_name',
        'owner_name',
        'address',
        'city',
        'state',
        'pincode',
        'latitude',
        'longitude',
        'url',
        [
          'contact_no',
          'contact'],
        'email'],
    }).then(result => result.map(item => item.toJSON()));
  }

  retrieveOnlineSellers(options) {
    options.status_type = 1;
    return this.modals.onlineSellers.findAll({
      where: options,
      default: [
        [
          'sid',
          'id'],
        'seller_name',
        'url',
        'contact',
        'email'],
    }).then(result => result.map(item => item.toJSON()));
  }

  retrieveOrCreateOfflineSellers(options, defaults) {
    return this.modals.offlineSellers.findCreateFind({
      where: options,
      defaults,
    }).then(result => result[0].toJSON());
  }
}