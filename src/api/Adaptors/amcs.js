/*jshint esversion: 6 */
'use strict';

import moment from 'moment';
import _ from 'lodash';

const sortAmcWarrantyInsuranceRepair = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiry_date;
  bDate = b.expiry_date;

  if (moment.utc(aDate).isBefore(moment.utc(bDate))) {
    return 1;
  }

  return -1;
};

class AmcAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveAMCs(options) {
    if (!options.status_type) {
      options.status_type = [5, 11, 12];
    }
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

    return this.modals.amcs.findAll({
      where: options,
      include: [
        {
          model: this.modals.renewalTypes,
          attributes: [],
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
          attributes: [
            ['sid', 'id'], 'seller_name',
            'url',
            'contact',
            'email'],
          required: false,
        },
        {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [
            'seller_name',
            'owner_name',
            'url',
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
        'document_number',
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'],
        [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premium_type'],
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
        'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    }).
        then((amcResult) => amcResult.map((item) => {
          const productItem = item.toJSON();

          productItem.copies = productItem.copies.map((copyItem) => {
            copyItem.copy_id = copyItem.copy_id || copyItem.copyId;
            copyItem.copy_url = copyItem.copy_url || copyItem.copyUrl;
            copyItem = _.omit(copyItem, 'copyId');
            copyItem = _.omit(copyItem, 'copyUrl');
            return copyItem;
          });
          return productItem;
        }).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveNotificationAMCs(options) {
    options.status_type = [5, 11, 12];

    return this.modals.amcs.findAll({
      where: options,
      include: [
        {
          model: this.modals.renewalTypes,
          attributes: [],
        },
        {
          model: this.modals.products,
          attributes: [],
        },
      ],
      attributes: [
        'id',
        'product_id',
        'job_id',
        'document_number',
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'],
        [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premium_type'],
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
        'document_date', 'updated_at', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'product_url'],
        'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    }).
        then((amcResult) => amcResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveAMCCounts(options) {
    options.status_type = [5, 11, 12];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');

    return this.modals.amcs.findAll({
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
          this.modals.sequelize.literal('max("amcs"."updated_at")'),
          'last_updated_at']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    }).then((amcResult) => amcResult.map((item) => item.toJSON()));
  }

  createAMCs(values) {
    return this.modals.amcs.create(values).
        then(result => result.toJSON());
  }

  updateAMCs(id, values) {
    return this.modals.amcs.findOne({
      where: {
        id,
      },
    }).then(result => {
      result.updateAttributes(values);
      return result.toJSON();
    });
  }
}

export default AmcAdaptor;
