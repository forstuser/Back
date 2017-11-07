/*jshint esversion: 6 */
'use strict';

import moment from 'moment';

const sortAmcWarrantyInsuranceRepair = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (moment.utc(aDate).isBefore(moment.utc(bDate))) {
    return 1;
  }

  return -1;
};


class AmcAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveAmcs(options) {
    options.status_type = 5;

    const productOptions = options.main_category_id ? {
      main_category_id: options.main_category_id,
    } : undefined;

    return this.modals.amcs.findAll({
      where: options,
      include: [{
        model: this.modals.renewalTypes,
        attributes: []
      },
        {
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined,
        },
        {
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
          required: false
        },
        {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [['seller_name', 'sellerName'], ['owner_name', 'ownerName'], ['pan_no', 'panNo'], ['reg_no', 'regNo'], ['is_service', 'isService'], 'url', 'gstin', 'contact', 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude'],
          required: false
        }],
      attributes: [
        'id',
        [
          'product_id',
          'productId'],
        [
          'job_id',
          'jobId'],
        [
          'document_number',
          'policyNo'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('`renewalTypes`.`title`'),
          'premiumType'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          'renewal_cost',
          'premiumAmount'],
        [
          'renewal_cost',
          'value'],
        [
          'renewal_taxes',
          'taxes'],
        [
          'effective_date',
          'effectiveDate'],
        [
          'expiry_date',
          'expiryDate'],
        [
          'document_date',
          'purchaseDate'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'productURL'],
        'copies'],
      order:[['expiry_date', 'DESC']],
    }).then((amcResult) => amcResult.map((item) => item.toJSON()).sort(sortAmcWarrantyInsuranceRepair));
  }
}

export default AmcAdaptor;
