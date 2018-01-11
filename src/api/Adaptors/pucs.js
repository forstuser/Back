/*jshint esversion: 6 */
'use strict';

import moment from 'moment';
import _ from 'lodash';

const sortAmcWarrantyInsurancePUC = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiry_date;
  bDate = b.expiry_date;

  if (moment.utc(aDate).isBefore(moment.utc(bDate))) {
    return 1;
  }

  return -1;
};

class PUCAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrievePUCs(options) {
    options.status_type = [5, 11, 12];
    let productOptions = {};

    if (options.main_category_id) {
      productOptions.main_category_id = options.main_category_id;
    }

    if (options.product_status_type) {
      productOptions.status_type = options.product_status_type;
    }

    if (options.category_id) {
      productOptions.category_id = options.category_id;
    }

    productOptions = productOptions === {} ? undefined : productOptions;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    options = _.omit(options, 'brand_id');

    return this.modals.pucs.findAll({
      where: options,
      include: [
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
            ['sid', 'id'], 'seller_name', 'owner_name', 'url',
            ['contact_no', 'contact'],
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
        'product_id',
        'job_id',
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'],
        'user_id',
          'document_number',
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'product_name'],
        [
          'renewal_type',
          'premium_type'],
        [
          'renewal_cost',
          'value'],
        [
          'renewal_taxes',
          'taxes'],
          'effective_date',
          'expiry_date',
        'document_date', 'updated_at',
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'product_url'],
        'copies'],
      order: [['document_date', 'DESC']],
    }).
        then((pucResult) => pucResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsurancePUC));
  }

  retrieveNotificationPUCs(options) {
    options.status_type = [5, 11, 12];
    return this.modals.pucs.findAll({
      where: options,
      include: [
        {
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined,
        }],
      attributes: [
        'id',
        'product_id',
        'job_id',
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'],
        'user_id',
          'document_number',
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'product_name'],
        [
          'renewal_cost',
          'value'],
        [
          'renewal_taxes',
          'taxes'],
          'effective_date',
          'expiry_date',
          'document_date',
        'updated_at',
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'product_url'],
        'copies'],
      order: [['document_date', 'DESC']],
    }).
        then((pucResult) => pucResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsurancePUC));
  }

  retrievePUCCount(options) {
    options.status_type = [5, 11, 12];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    return this.modals.pucs.findAll({
      where: options,
      include: [
        {
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined,
        }],

      attributes: [
        [this.modals.sequelize.literal('COUNT(*)'), 'product_counts'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'],
        [
          this.modals.sequelize.literal('max("pucs"."updated_at")'),
          'last_updated_at']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    }).then((pucResult) => pucResult.map((item) => item.toJSON()));
  }

  createPUCs(values) {
    return this.modals.pucs.create(values).
        then(result => result.toJSON());
  }

  updatePUCs(id, values) {
    return this.modals.pucs.findOne({
      where: {
        id,
      },
    }).
        then(result => {
          result.updateAttributes(values);
          return result.toJSON();
        });
  }
}

export default PUCAdaptor;
