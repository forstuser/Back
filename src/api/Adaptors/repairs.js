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

class RepairAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveRepairs(options) {
    options.status_type = [5, 11];
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

    return this.modals.repairs.findAll({
      where: options,
      include: [
        {
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [
            ['sid', 'id'],
            'seller_name',
            'url',
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
            ['sid', 'id'],
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
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'], 'user_id',
        'document_number',
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'product_name'],
        [
          'repair_cost',
          'value'],
        [
          'repair_taxes',
          'taxes'],
        'document_date', 'updated_at',
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'product_url'],
        'copies'],
      order: [['document_date', 'DESC']],
    }).
        then((repairResult) => repairResult.map((item) => {
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

  retrieveNotificationRepairs(options) {
    options.status_type = [5, 11];
    return this.modals.repairs.findAll({
      where: options,
      include: [
        {
          model: this.modals.products,
          attributes: [],
        }],
      attributes: [
        'id',
        'product_id',
        'job_id',
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'main_category_id'], 'user_id',
        'document_number',
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'product_name'],
        [
          'repair_cost',
          'value'],
        [
          'repair_taxes',
          'taxes'],
        'document_date',
        'updated_at',
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'product_url'],
        'copies',
      ],
      order: [['document_date', 'DESC']],
    }).then((repairResult) => repairResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveRepairCount(options) {
    options.status_type = [5, 11];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    return this.modals.repairs.findAll({
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
          this.modals.sequelize.literal('max("repairs"."updated_at")'),
          'last_updated_at']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    }).then((repairResult) => repairResult.map((item) => item.toJSON()));
  }

  createRepairs(values) {
    return this.modals.repairs.create(values).
        then(result => result.toJSON());
  }

  updateRepairs(id, values) {
    return this.modals.repairs.findOne({
      where: {
        id,
      },
    }).then(result => {
      result.updateAttributes(values);
      return result.toJSON();
    });
  }
}

export default RepairAdaptor;
