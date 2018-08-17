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

class AmcAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveAMCs(options) {
    const {status_type, main_category_id, product_status_type, category_id} = options;
    if (!status_type) {
      options.status_type = [5, 11, 12];
    }
    let productOptions = JSON.parse(JSON.stringify({
      main_category_id,
      status_type: product_status_type,
      category_id,
    }));

    productOptions = productOptions === {} ? undefined : productOptions;

    options = _.omit(options, 'ref_id');
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    options = _.omit(options, 'brand_id');

    const amcResult = await this.modals.amcs.findAll({
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
          required: !!productOptions,
        },
        {
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [
            'id', ['seller_name', 'sellerName'],
            'url', 'gstin', 'contact', 'email'],
          required: false,
        },
        {
          model: this.modals.sellers,
          as: 'sellers',
          attributes: [
            'id', ['seller_name', 'sellerName'],
            'url', ['contact_no', 'contact'], 'email', 'address',
            'city', 'state', 'pincode', 'latitude', 'longitude'],
          required: false,
        }],
      attributes: [
        'id', ['product_id', 'productId'],
        ['job_id', 'jobId'], ['document_number', 'policyNo'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [this.modals.sequelize.literal('"renewalType"."title"'), 'premiumType'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        ['renewal_cost', 'premiumAmount'], ['renewal_cost', 'value'],
        ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'],
        ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'],
        'renewal_type', ['updated_at', 'updatedDate'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')), 'productURL'],
        'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    });
    return amcResult.map((item) => {
      const productItem = item.toJSON();
      if (productItem.copies) {
        productItem.copies = productItem.copies.map((copyItem) => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      productItem.purchaseDate = moment.utc(productItem.purchaseDate,
          moment.ISO_8601).startOf('days');
      return productItem;
    }).sort(sortAmcWarrantyInsuranceRepair);
  }

  async retrieveNotificationAMCs(options) {
    options.status_type = [5, 11, 12];

    const amcResult = await this.modals.amcs.findAll({
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
        'id', ['product_id', 'productId'], ['job_id', 'jobId'],
        ['document_number', 'policyNo'], [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], ['renewal_taxes', 'taxes'], [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'], ['renewal_cost', 'value'], [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'], ['renewal_cost', 'premiumAmount'],
        ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'],
        ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    });
    return amcResult.map((item) => {
      const productItem = item.toJSON();
      if (productItem.copies) {
        productItem.copies = productItem.copies.map((copyItem) => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      return productItem;
    }).sort(sortAmcWarrantyInsuranceRepair);
  }

  async retrieveAMCCounts(options) {
    options.status_type = [5, 11, 12];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');

    const amcResult = await this.modals.amcs.findAll({
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
          this.modals.sequelize.literal('max("amcs"."updated_at")'),
          'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    });
    return amcResult.map((item) => item.toJSON());
  }

  async createAMCs(values) {
    const result = await this.modals.amcs.create(values);
    return result.toJSON();
  }

  async updateAMCs(id, values) {
    const result = await this.modals.amcs.findOne({
      where: {
        id,
      },
    });

    const itemDetail = result.toJSON();
    if (values.copies && values.copies.length > 0 &&
        itemDetail.copies && itemDetail.copies.length > 0) {
      const newCopies = values.copies;
      values.copies = itemDetail.copies;
      values.copies.push(...newCopies);
    }

    values.status_type = itemDetail.status_type === 5 ?
        itemDetail.status_type :
        itemDetail.status_type !== 8 ?
            11 :
            values.status_type || itemDetail.status_type;

    await result.updateAttributes(values);
    return result.toJSON();
  }

  async updateAMCPeriod(options, productPurchaseDate, productNewPurchaseDate) {
    const result = await this.modals.amcs.findAll(
        {where: options, order: [['document_date', 'ASC']]});
    let document_date = productNewPurchaseDate;
    let amcExpiryDate;
    return await Promise.all(result.map((item) => {
      const amcItem = item.toJSON();
      const id = amcItem.id;
      if (moment.utc(amcItem.effective_date).startOf('days').
              isSame(moment.utc(productPurchaseDate).startOf('days')) ||
          moment.utc(amcItem.effective_date).startOf('days').
              isBefore(moment.utc(productNewPurchaseDate).startOf('days'))) {
        amcItem.effective_date = productNewPurchaseDate;
        amcItem.document_date = productNewPurchaseDate;
        amcExpiryDate = moment.utc(amcItem.expiry_date).add(1, 'days');
        amcItem.expiry_date = moment.utc(productNewPurchaseDate,
            moment.ISO_8601).
            add(moment.utc(amcItem.expiry_date, moment.ISO_8601).add(1, 'days').
                diff(moment.utc(productPurchaseDate, moment.ISO_8601),
                    'months', true), 'months').subtract(1, 'days');
        amcItem.updated_by = options.user_id;
        amcItem.status_type = 11;
        document_date = moment.utc(amcItem.expiry_date).add(1, 'days');

        return this.modals.amcs.update(amcItem, {where: {id}});
      } else if (moment.utc(amcItem.effective_date).startOf('days').
          isSame(moment.utc(amcExpiryDate).startOf('days'))) {
        amcItem.effective_date = document_date;
        amcItem.document_date = document_date;
        amcExpiryDate = amcItem.expiry_date;
        amcItem.expiry_date = moment.utc(document_date, moment.ISO_8601).
            add(moment.utc(amcItem.expiry_date, moment.ISO_8601).
                add(1, 'days').diff(moment.utc(amcExpiryDate,
                    moment.ISO_8601), 'months', true), 'months').
            subtract(1, 'days');
        amcItem.updated_by = options.user_id;
        amcItem.status_type = 11;
        document_date = amcItem.expiry_date;
        return this.modals.amcs.update(amcItem, {where: {id}});
      }

      return undefined;
    }));

  }

  async removeAMCs(id, copyId, values) {
    const result = await this.modals.amcs.findOne({where: {id}});
    const itemDetail = result.toJSON();
    if (copyId &&
        itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(
          (item) => item.copyId !== parseInt(copyId));
      await result.updateAttributes(values);
      return result.toJSON();
    }

    await Promise.all([
      this.modals.mailBox.create({
        title: `User tried to Delete AMC ${id}`,
        job_id: itemDetail.job_id,
        bill_product_id: itemDetail.product_id,
        notification_type: 100,
      }), this.modals.amcs.destroy({
        where: {
          id,
        },
      })]);
    return true;
  }

  async deleteAMC(id, user_id) {
    const result = await this.modals.amcs.findById(id);
    if (result) {
      await Promise.all([
        this.modals.mailBox.create({
          title: `User tried to Delete AMC ${id}`, job_id: result.job_id,
          bill_product_id: result.product_id, notification_type: 100,
        }),
        this.modals.amcs.destroy({where: {id, user_id}}),
        result.copies && result.copies.length > 0 ?
            this.modals.jobCopies.update({status_type: 3, updated_by: user_id},
                {where: {id: result.copies.map(item => item.copyId)}}) :
            undefined]);
    }

    return true;
  }
}

export default AmcAdaptor;
