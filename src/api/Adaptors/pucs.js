/*jshint esversion: 6 */
'use strict';

import moment from 'moment';
import _ from 'lodash';

const sortAmcWarrantyInsurancePUC = (a, b) => {
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

  retrievePUCs(options) {
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
          'masterCategoryId'],
        'user_id',
        [
          'document_number',
          'policyNo'],
        [
          'renewal_cost',
          'premiumAmount'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          'renewal_cost',
          'value'],
        'renewal_type',
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
      order: [['document_date', 'DESC']],
    }).
        then((pucResult) => pucResult.map((item) => {
          const productItem = item.toJSON();
          productItem.purchaseDate = moment.utc(productItem.purchaseDate,
              moment.ISO_8601).
              startOf('days');
          return productItem;
        }).
            sort(sortAmcWarrantyInsurancePUC));
  }

  retrieveNotificationPUCs(options) {
    options.status_type = [5, 11];
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
        [
          'product_id',
          'productId'],
        [
          'job_id',
          'jobId'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        'user_id',
        [
          'document_number',
          'policyNo'],
        [
          'renewal_cost',
          'premiumAmount'],
        'renewal_type',
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
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
      order: [['document_date', 'DESC']],
    }).
        then((pucResult) => pucResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsurancePUC));
  }

  retrievePUCCount(options) {
    options.status_type = [5, 11];
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
        [this.modals.sequelize.literal('COUNT(*)'), 'productCounts'],
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('max("pucs"."updated_at")'),
          'lastUpdatedAt']],
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
    }).then(result => {
      const itemDetail = result.toJSON();
      if (values.copies && values.copies.length > 0 &&
          itemDetail.copies && itemDetail.copies.length > 0) {
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

  updatePUCPeriod(options, productPurchaseDate, productNewPurchaseDate) {
    return this.modals.pucs.findAll({
      where: options,
      order: [['document_date', 'ASC']],
    }).then(result => {
      let document_date = productNewPurchaseDate;
      let pucExpiryDate;
      return Promise.all(result.map((item) => {
        const pucItem = item.toJSON();
        const id = pucItem.id;
        if (moment.utc(pucItem.effective_date).startOf('days').valueOf() ===
            moment.utc(productPurchaseDate).startOf('days').valueOf() ||
            moment.utc(pucItem.effective_date).startOf('days').valueOf() <
            moment.utc(productNewPurchaseDate).startOf('days').valueOf()) {
          pucItem.effective_date = productNewPurchaseDate;
          pucItem.document_date = productNewPurchaseDate;
          pucExpiryDate = moment.utc(pucItem.expiry_date).
              add(1, 'days');
          pucItem.expiry_date = moment.utc(productNewPurchaseDate,
              moment.ISO_8601).
              add(moment.utc(pucItem.expiry_date, moment.ISO_8601).
                  add(1, 'days').
                  diff(moment.utc(productPurchaseDate, moment.ISO_8601),
                      'months', true), 'months').
              subtract(1, 'days');
          pucItem.updated_by = options.user_id;
          pucItem.status_type = 11;
          document_date = moment.utc(pucItem.expiry_date).add(1, 'days');

          return this.modals.pucs.update(pucItem, {where: {id}});
        } else if (moment.utc(pucItem.effective_date).
                startOf('days').
                valueOf() ===
            moment.utc(pucExpiryDate).startOf('days').valueOf()) {
          pucItem.effective_date = document_date;
          pucItem.document_date = document_date;
          pucExpiryDate = pucItem.expiry_date;
          pucItem.expiry_date = moment.utc(document_date,
              moment.ISO_8601).
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
    });
  }

  removePUCs(id, copyId, values) {
    return this.modals.pucs.findOne({
      where: {
        id,
      },
    }).then(result => {
      const itemDetail = result.toJSON();
      if (copyId &&
          itemDetail.copies.length > 0) {
        values.copies = itemDetail.copies.filter(
            (item) => item.copyId !== parseInt(copyId));
        result.updateAttributes(values);

        return result.toJSON();
      }

      return this.modals.pucs.destroy({
        where: {
          id,
        },
      }).then(() => {
        return true;
      });
    });
  }

  deletePUCs(id, user_id) {
    return this.modals.pucs.findById(id).then((result) => {
      if (result) {
        return Promise.all([
          this.modals.pucs.destroy({
            where: {
              id,
              user_id,
            },
          }),
          result.copies && result.copies.length > 0 ?
              this.modals.jobCopies.update({
            status_type: 3,
            updated_by: user_id,
          }, {
            where: {
              id: result.copies.map(item => item.copyId),
            },
          }) : undefined]).then(() => {
          return true;
        });
      }

      return true;
    });
  }
}

export default PUCAdaptor;
