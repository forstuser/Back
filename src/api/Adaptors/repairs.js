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
            ['sid', 'id'],
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
        [
          'product_id',
          'productId'],
        [
          'job_id',
          'jobId'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], 'user_id',
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
        'warranty_upto',
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

  retrieveNotificationRepairs(options) {
    options.status_type = [5, 11];
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
        'id',
        [
          'product_id',
          'productId'],
        [
          'job_id',
          'jobId'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], 'user_id',
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
        [this.modals.sequelize.literal('COUNT(*)'), 'productCounts'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('max("repairs"."updated_at")'),
          'lastUpdatedAt']],
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
      const itemDetail = result.toJSON();
      if (values.copies && values.copies.length > 0 &&
          itemDetail.copies.length > 0) {
        const newCopies = values.copies;
        values.copies = itemDetail.copies;
        values.copies.push(...newCopies);
      }

      values.status_type = itemDetail.status_type !== 8 ?
          11 :
          values.status_type || itemDetail.status_type;

      result.updateAttributes(values);
      return result.toJSON();
    });
  }

  removeRepairs(id, copyId, values) {
    return this.modals.repairs.findOne({
      where: {
        id,
      },
    }).then(result => {
      const itemDetail = result.toJSON();
      if (copyId &&
          itemDetail.copies.length > 0) {
        values.copies = itemDetail.copies.filter(
            (item) => item.copyId !== parseInt(copyId));

        if (values.copies.length > 0) {
          result.updateAttributes(values);
        }

        return result.toJSON();
      }

      return this.modals.repairs.destroy({
        where: {
          id,
        },
      }).then(() => {
        return true;
      });
    });
  }

  deleteRepair(id, user_id) {
    return this.modals.repairs.destroy({
      where: {
        id,
        user_id,
      },
    }).then(() => {
      return true;
    });
  }
}

export default RepairAdaptor;
