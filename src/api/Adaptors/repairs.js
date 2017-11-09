/*jshint esversion: 6 */
'use strict';

import moment from 'moment';
import _ from 'lodash';

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
    options.status_type = options.product_status_type || 5;
    const productOptions = options.main_category_id ? {
      main_category_id: options.main_category_id,
    } : undefined;
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
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
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined,
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
            'contact_no',
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
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          'document_number',
          'policyNo'],
        [
          'repair_cost',
          'premiumAmount'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          'repair_cost',
          'value'],
        [
          'repair_taxes',
          'taxes'],
        [
          'document_date',
          'purchaseDate'],
        ['updated_at', 'updatedDate'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'productURL'],
        'copies'],
      order: [['document_date', 'DESC']],
    }).
        then((repairResult) => repairResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsuranceRepair));
  }
}

export default RepairAdaptor;
