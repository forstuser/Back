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


class WarrantyAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveWarranties(options) {
    options.status_type = options.product_status_type || 5;
    const productOptions = options.main_category_id ? {
      main_category_id: options.main_category_id,
    } : undefined;

    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    return this.modals.warranties.findAll({
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
            ['contact_no', 'contact'],
            'email',
            'address',
            'city',
            'state',
            'pincode',
            'latitude',
            'longitude'],
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
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          'renewal_cost',
          'premiumAmount'], 'user_id',
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
        ['updated_at', 'updatedDate'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'productURL'],
        'copies'],
      order:[['expiry_date', 'DESC']],
    }).then((warrantyResult) => warrantyResult.map((item) => item.toJSON()).sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveWarrantyCount(options) {
    options.status_type = 5;
    const productOptions = options.main_category_id ||
    options.product_status_type ? {
      main_category_id: options.main_category_id,
      status_type: options.product_status_type,
    } : undefined;

    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    return this.modals.warranties.findAll({
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
          this.modals.sequelize.literal('max("warranties"."updated_at")'),
          'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    }).then((warrantyResult) => warrantyResult.map((item) => item.toJSON()));
  }
}

export default WarrantyAdaptor;
