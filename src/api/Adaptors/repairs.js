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

class RepairAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveRepairs(options) {
    options.status_type = {
      $notIn: [3, 9],
    };
    return this.modals.repairs.findAll({
      where: options,
      include: [
        {
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [
            [
              'seller_name',
              'sellerName'],
            'url',
            'gstin',
            'contact',
            'email'],
          required: false,
        },
        {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [
            [
              'seller_name',
              'sellerName'],
            [
              'owner_name',
              'ownerName'],
            [
              'pan_no',
              'panNo'],
            [
              'reg_no',
              'regNo'],
            [
              'is_service',
              'isService'],
            'url',
            'gstin',
            'contact',
            'email',
            'address',
            'city',
            'state',
            'pincode',
            'latitude',
            'longitude'],
          required: false,
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
          'renewal_cost',
          'premiumAmount'],
        [
          'renewal_taxes',
          'taxes'],
        [
          'document_date',
          'documentDate'],
        'copies'],
      order: [['document_date', 'DESC']],
    }).
        then((repairResult) => repairResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsuranceRepair));
  }
}

export default RepairAdaptor;
