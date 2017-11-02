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
    options.status_type = {
      $notIn: [3, 9]
    };
    return this.modals.amcs.findAll({
      where: options,
      include: [{
        model: this.modals.renewalTypes,
        as: 'type',
        attributes: []
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
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], ['document_number', 'policyNo'], [this.modals.sequelize.literal('`type`.`title`'), 'premiumType'], ['renewal_cost', 'premiumAmount'], ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'], ['document_date', 'documentDate'], 'copies'],
      order:[['expiry_date', 'DESC']],
    }).then((amcResult) => amcResult.map((item) => item.toJSON()).sort(sortAmcWarrantyInsuranceRepair));
  }
}

export default AmcAdaptor;
