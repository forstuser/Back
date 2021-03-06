/*jshint esversion: 6 */
'use strict';

import moment from 'moment';
import _ from 'lodash';

const sortProductItem = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (moment.utc(aDate).isBefore(moment.utc(bDate))) {
    return 1;
  }

  return -1;
};

class PUCAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrievePUCs(options) {
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

    options = _.omit(options, [
      'ref_id', 'category_id', 'main_category_id', 'product_status_type',
      'brand_id', 'product_name', 'bill_id', 'accessory_part_id',
      'accessory_id']);

    const pucResult = await this.modals.pucs.findAll({
      where: options, include: [
        {
          model: this.modals.products, where: productOptions,
          attributes: [], required: productOptions !== undefined,
        },
        {
          model: this.modals.sellers, as: 'sellers',
          attributes: [
            'id', ['seller_name', 'sellerName'],
            'url', ['contact_no', 'contact'], 'email',
            'address', [this.modals.sequelize.literal(
                '(Select state_name from table_states as state where state.id = sellers.state_id)'),
              'state_name'], [
              this.modals.sequelize.literal(
                  '(Select name from table_cities as city where city.id = sellers.city_id)'),
              'city_name'], [
              this.modals.sequelize.literal(
                  '(Select name from table_localities as locality where locality.id = sellers.locality_id)'),
              'locality_name'], [
              this.modals.sequelize.literal(
                  '(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'),
              'pin_code'],
            'latitude', 'longitude'],
          required: false,
        }],
      attributes: [
        'id', ['product_id', 'productId'], ['job_id', 'jobId'],
        'user_id', ['document_number', 'policyNo'], [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], ['renewal_cost', 'premiumAmount'], [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'], ['renewal_cost', 'value'], 'renewal_type',
        ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'],
        ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'],
        ['updated_at', 'updatedDate'], 'copies', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')), 'productURL']],
      order: [['document_date', 'DESC']],
    });
    return pucResult.map((item) => {
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
    }).sort(sortProductItem);
  }

  async retrieveNotificationPUCs(options) {
    options.status_type = [5, 11];
    const pucResult = await this.modals.pucs.findAll({
      where: options,
      include: [
        {
          model: this.modals.products, where: productOptions,
          attributes: [], required: productOptions !== undefined,
        }],
      attributes: [
        'id', ['product_id', 'productId'], ['job_id', 'jobId'],
        'user_id', ['document_number', 'policyNo'], [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], ['renewal_cost', 'premiumAmount'], [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'], ['renewal_cost', 'value'], 'renewal_type',
        ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'],
        ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'],
        ['updated_at', 'updatedDate'], 'copies', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')), 'productURL']],
      order: [['document_date', 'DESC']],
    });
    return pucResult.map((item) => item.toJSON()).sort(sortProductItem);
  }

  async retrievePUCCount(options) {
    options.status_type = [5, 11];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    const pucResult = await this.modals.pucs.findAll({
      where: options,
      include: [
        {
          model: this.modals.products, where: productOptions,
          attributes: [], required: productOptions !== undefined,
        }],

      attributes: [
        [this.modals.sequelize.literal('COUNT(*)'), 'productCounts'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('max("pucs"."updated_at")'),
          'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    });
    return pucResult.map((item) => item.toJSON());
  }

  async createPUCs(values) {
    const result = await this.modals.pucs.create(values);
    return result.toJSON();
  }

  async updatePUCs(id, values) {
    const result = await this.modals.pucs.findOne({where: {id}});
    const itemDetail = result.toJSON();
    if (values.copies && values.copies.length > 0 &&
        itemDetail.copies && itemDetail.copies.length > 0) {
      const newCopies = values.copies;
      values.copies = itemDetail.copies;
      values.copies.push(...newCopies);
    }

    values.status_type = itemDetail.status_type === 5 ?
        itemDetail.status_type : itemDetail.status_type !== 8 ?
            11 : values.status_type || itemDetail.status_type;
    await result.updateAttributes(values);
    return result.toJSON();
  }

  async updatePUCPeriod(options, purchase_date, new_purchase_date) {
    const result = await this.modals.pucs.findAll(
        {where: options, order: [['document_date', 'ASC']]});
    let document_date = new_purchase_date;
    let pucExpiryDate;
    return Promise.all(result.map((item) => {
      const pucItem = item.toJSON();
      const id = pucItem.id;
      if (moment.utc(pucItem.effective_date).startOf('days').
              isSame(moment.utc(purchase_date).startOf('days')) ||
          moment.utc(pucItem.effective_date).startOf('days').
              isBefore(moment.utc(new_purchase_date).startOf('days'))) {
        pucItem.effective_date = new_purchase_date;
        pucItem.document_date = new_purchase_date;
        pucExpiryDate = moment.utc(pucItem.expiry_date).add(1, 'days');
        pucItem.expiry_date = moment.utc(new_purchase_date, moment.ISO_8601).
            add(moment.utc(pucItem.expiry_date, moment.ISO_8601).
                add(1, 'days').
                diff(moment.utc(purchase_date, moment.ISO_8601), 'months',
                    true), 'months').subtract(1, 'days');
        pucItem.updated_by = options.user_id;
        pucItem.status_type = 11;
        document_date = moment.utc(pucItem.expiry_date).add(1, 'days');

        return this.modals.pucs.update(pucItem, {where: {id}});
      } else if (moment.utc(pucItem.effective_date).startOf('days').
          isSame(moment.utc(pucExpiryDate).startOf('days'))) {
        pucItem.effective_date = document_date;
        pucItem.document_date = document_date;
        pucExpiryDate = pucItem.expiry_date;
        pucItem.expiry_date = moment.utc(document_date, moment.ISO_8601).
            add(moment.utc(pucItem.expiry_date, moment.ISO_8601).
                add(1, 'days').diff(moment.utc(pucExpiryDate,
                    moment.ISO_8601), 'months', true), 'months').
            subtract(1, 'days');
        pucItem.updated_by = options.user_id;
        pucItem.status_type = 11;
        document_date = pucItem.expiry_date;
        return this.modals.pucs.update(pucItem, {where: {id}});
      }

      return undefined;
    }));
  }

  async removePUCs(id, copyId, values) {
    const result = await this.modals.pucs.findOne({where: {id}});
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(
          (item) => item.copyId !== parseInt(copyId));
      await result.updateAttributes(values);
      return result.toJSON();
    }

    await this.modals.pucs.destroy({where: {id}});
    return true;
  }

  async deletePUCs(id, user_id) {
    const result = await this.modals.pucs.findById(id);
    if (result) {
      await Promise.all([
        this.modals.mailBox.create({
          title: `User Deleted PUC #${id}`, job_id: result.job_id,
          bill_product_id: result.product_id, notification_type: 100,
        }),
        this.modals.pucs.destroy({where: {id, user_id}}),
        result.copies && result.copies.length > 0 ?
            this.modals.jobCopies.update({status_type: 3, updated_by: user_id},
                {where: {id: result.copies.map(item => item.copyId)}}) :
            undefined]);
    }

    return true;
  }
}

export default PUCAdaptor;
