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
        [
          'seller_name',
          'name'],
        [
          'owner_name',
          'ownerName'],
        'gstin',
        [
          'pan_no',
          'panNo'],
        [
          'reg_no',
          'registrationNo'],
        [
          'is_service',
          'isService'],
        [
          'is_onboarded',
          'isOnboarded'],
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
      attributes: [
        [
          'sid',
          'id'],
        [
          'seller_name',
          'name'],
        'gstin',
        'url',
        'contact',
        'email'],
    }).then(result => result.map(item => item.toJSON()));
  }
}