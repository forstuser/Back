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

class InsuranceAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveInsurances(options) {
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
    console.log('\n\n\n\n\n\n\n', JSON.stringify({options}));

    const insuranceResult = await this.modals.insurances.findAll({
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
            'id', ['seller_name', 'sellerName'],
            'url', 'contact', 'email'],
          required: false,
        },
        {
          model: this.modals.insuranceBrands,
          as: 'provider',
          attributes: [
            'id', 'name', 'url', ['contact_no', 'contact'],
            'email', 'address', 'state', 'city', 'pincode',
            'latitude', 'longitude', [
              this.modals.sequelize.fn('CONCAT', 'providers/',
                  this.modals.sequelize.col('"provider"."id"'), '/images'),
              'imageUrl'], 'status_type'],
          required: false,
        },
        {
          model: this.modals.sellers,
          as: 'sellers',
          attributes: [
            'id', ['seller_name', 'sellerName'],
            ['owner_name', 'ownerName'], 'url',
            ['contact_no', 'contact'], 'email', 'address',
            [this.modals.sequelize.literal(
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
              'pin_code'], 'latitude', 'longitude'],
          required: false,
        }],
      attributes: [
        'id', ['product_id', 'productId'], [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], ['job_id', 'jobId'],
        'provider_id', [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'], ['document_number', 'policyNo'], [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'], ['renewal_cost', 'premiumAmount'],
        ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'],
        ['amount_insured', 'amountInsured'], ['expiry_date', 'expiryDate'],
        ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'],
        ['effective_date', 'effectiveDate'], 'renewal_type', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    });
    return insuranceResult.map((item) => {
      const productItem = item.toJSON();

      if (productItem.copies) {
        productItem.copies = productItem.copies.map((copyItem) => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      productItem.purchaseDate = moment.utc(productItem.purchaseDate,
          moment.ISO_8601).
          startOf('days');
      return productItem;
    }).sort(sortAmcWarrantyInsuranceRepair);
  }

  async retrieveNotificationInsurances(options) {
    options.status_type = [5, 11, 12];
    const insuranceResult = await this.modals.insurances.findAll({
      where: options, include: [
        {model: this.modals.renewalTypes, attributes: []},
        {model: this.modals.products, attributes: []}],
      attributes: [
        'id', ['product_id', 'productId'], [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'], ['job_id', 'jobId'],
        'provider_id', [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'], ['document_number', 'policyNo'], [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'], ['renewal_cost', 'premiumAmount'],
        ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'],
        ['amount_insured', 'amountInsured'], ['expiry_date', 'expiryDate'],
        ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'],
        ['effective_date', 'effectiveDate'], 'renewal_type', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"product_id"')),
          'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    });
    return insuranceResult.map((item) => {
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

  async retrieveInsuranceCount(options) {
    options.status_type = [5, 11, 12];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    const insuranceResult = await this.modals.insurances.findAll({
      where: options, include: [
        {
          model: this.modals.products, where: productOptions,
          attributes: [], required: productOptions !== undefined,
        }], attributes: [
        [this.modals.sequelize.literal('COUNT(*)'), 'productCounts'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('max("insurances"."updated_at")'),
          'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    });
    return insuranceResult.map((item) => item.toJSON());
  }

  async createInsurances(values) {
    const result = await this.modals.insurances.create(values);
    return result.toJSON();
  }

  async findCreateInsuranceBrand(values) {
    let result = await this.modals.insuranceBrands.findOne({
      where: {
        name: {$iLike: `${values.name}`},
        main_category_id: values.main_category_id,
        type: values.type,
      }, include: {
        model: this.modals.categories,
        where: {category_id: values.category_id},
        as: 'categories', attributes: ['category_id'],
        required: true,
      },
    });
    if (!result) {
      result = await this.modals.insuranceBrands.create(
          _.omit(values, 'category_id'));
    }

    let insuranceBrand = result.toJSON();
    let finalResult;
    if (!insuranceBrand.categories) {
      finalResult = await this.modals.insuranceBrandCategories.create({
        insurance_brand_id: insuranceBrand.id,
        category_id: values.category_id,
      });
    }

    if (finalResult) {
      insuranceBrand.categories = finalResult.toJSON();
    }

    return insuranceBrand;
  }

  async updateInsurances(id, values) {
    const result = await this.modals.insurances.findOne({where: {id}});
    const itemDetail = result.toJSON();
    if (values.copies && values.copies.length > 0 && itemDetail.copies &&
        itemDetail.copies.length > 0) {
      const newCopies = values.copies;
      values.copies = itemDetail.copies;
      values.copies.push(...newCopies);
    }

    values.status_type = itemDetail.status_type === 5 ?
        itemDetail.status_type : itemDetail.status_type !== 8 ? 11 :
            values.status_type || itemDetail.status_type;

    await result.updateAttributes(values);
    return result.toJSON();

  }

  async updateInsurancePeriod(parameters) {
    let {options, purchase_date, new_purchase_date} = parameters;
    const result = await this.modals.insurances.findAll(
        {where: options, order: [['document_date', 'ASC']]});
    let document_date = new_purchase_date;
    let insuranceExpiryDate;
    return await Promise.all(result.map((item) => {
      const insuranceItem = item.toJSON();
      const id = insuranceItem.id;
      if (moment.utc(insuranceItem.effective_date).startOf('days').
              isSame(moment.utc(purchase_date).startOf('days')) ||
          moment.utc(insuranceItem.effective_date).startOf('days').
              isBefore(moment.utc(new_purchase_date).startOf('days'))) {
        insuranceItem.effective_date = new_purchase_date;
        insuranceItem.document_date = new_purchase_date;
        insuranceExpiryDate = moment.utc(insuranceItem.expiry_date).
            add(1, 'days');
        insuranceItem.expiry_date = moment.utc(new_purchase_date,
            moment.ISO_8601).
            add(moment.utc(insuranceItem.expiry_date, moment.ISO_8601).
                add(1, 'days').
                diff(moment.utc(purchase_date, moment.ISO_8601), 'months',
                    true), 'months').subtract(1, 'days');
        insuranceItem.updated_by = options.user_id;
        insuranceItem.status_type = 11;
        document_date = moment.utc(insuranceItem.expiry_date).add(1, 'days');

        return this.modals.insurances.update(insuranceItem, {where: {id}});
      } else if (moment.utc(insuranceItem.effective_date).startOf('days').
          isSame(moment.utc(insuranceExpiryDate).startOf('days'))) {
        insuranceItem.effective_date = document_date;
        insuranceItem.document_date = document_date;
        insuranceExpiryDate = insuranceItem.expiry_date;
        insuranceItem.expiry_date = moment.utc(document_date, moment.ISO_8601).
            add(moment.utc(insuranceItem.expiry_date, moment.ISO_8601).
                add(1, 'days').diff(moment.utc(insuranceExpiryDate,
                    moment.ISO_8601), 'months', true), 'months').
            subtract(1, 'days');
        insuranceItem.updated_by = options.user_id;
        insuranceItem.status_type = 11;
        document_date = insuranceItem.expiry_date;
        return this.modals.insurances.update(insuranceItem, {where: {id}});
      }

      return undefined;
    }));
  }

  async removeInsurances(id, copyId, values) {
    const result = await this.modals.insurances.findOne({where: {id}});
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(
          (item) => item.copyId !== parseInt(copyId));
      await result.updateAttributes(values);
      return result.toJSON();
    }

    await this.modals.insurances.destroy({where: {id}});
    return true;
  }

  async deleteInsurance(id, user_id) {
    const result = await this.modals.insurances.findById(id);
    if (result) {
      await Promise.all([
        this.modals.mailBox.create({
          title: `User Deleted Insurance #${id}`, job_id: result.job_id,
          bill_product_id: result.product_id, notification_type: 100,
        }),
        this.modals.insurances.destroy({where: {id, user_id}}),
        result.copies && result.copies.length > 0 ?
            this.modals.jobCopies.update({status_type: 3, updated_by: user_id},
                {where: {id: result.copies.map(item => item.copyId)}}) :
            undefined]);
    }

    return true;
  }
}

export default InsuranceAdaptor;