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

    return this.modals.warranties.findAll({
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
          include: [
            {
              model: this.modals.categories,
              as: 'category',
              attributes: [],
              required: false,
            },
          ],
        },
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
          model: this.modals.insuranceBrands,
          as: 'provider',
          attributes: [
            'id',
            'name',
            [
              'pan_no',
              'panNo'],
            [
              'reg_no',
              'regNo'],
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
          'document_number',
          'policyNo'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          this.modals.sequelize.literal(
              '"product->category"."dual_warranty_item"'),
          'dualWarrantyItem'],
        [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'],
        'renewal_type',
        [
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          'renewal_cost',
          'premiumAmount'],
        'user_id',
        'warranty_type',
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
      order: [['expiry_date', 'DESC']],
    }).
        then((warrantyResult) => warrantyResult.map((item) => {
          const productItem = item.toJSON();
          productItem.purchaseDate = moment.utc(productItem.purchaseDate,
              moment.ISO_8601).
              startOf('days');
          return productItem;
        }).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveNotificationWarranties(options) {
    options.status_type = [5, 11, 12];
    return this.modals.warranties.findAll({
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
      order: [['expiry_date', 'DESC']],
    }).
        then((warrantyResult) => warrantyResult.map((item) => item.toJSON()).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveWarrantyCount(options) {
    options.status_type = [5, 11, 12];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
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

  createWarranties(values) {
    return this.modals.warranties.create(values).
        then(result => result.toJSON());
  }

  updateWarranties(id, values) {
    return this.modals.warranties.findOne({
      where: {
        id,
      },
    }).then(result => {
      const itemDetail = result.toJSON();
      if (values.copies && values.copies.length > 0 && itemDetail.copies &&
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

  updateWarrantyPeriod(options, productPurchaseDate, productNewPurchaseDate) {
    options.warranty_type = [1, 3];
    return this.modals.warranties.findAll({
      where: options,
      order: [['document_date', 'ASC']],
    }).then(result => {
      let document_date = productNewPurchaseDate;
      let dual_date;
      let warrantyExpiryDate;
      let dualWarrantyExpiryDate;
      return Promise.all(result.map((item) => {
        const warrantyItem = item.toJSON();
        const id = warrantyItem.id;
        if (moment.utc(warrantyItem.effective_date).
                startOf('days').
                valueOf() ===
            moment.utc(productPurchaseDate).startOf('days').valueOf() ||
            moment.utc(warrantyItem.effective_date).
                startOf('days').
                valueOf() <
            moment.utc(productNewPurchaseDate).startOf('days').valueOf()) {
          warrantyItem.effective_date = productNewPurchaseDate;
          warrantyItem.document_date = productNewPurchaseDate;
          if (warrantyItem.warranty_type === 1) {
            warrantyExpiryDate = moment.utc(warrantyItem.expiry_date).
                add(1, 'days');
          } else {
            dualWarrantyExpiryDate = moment.utc(warrantyItem.expiry_date).
                add(1, 'days');
          }
          warrantyItem.expiry_date = moment.utc(productNewPurchaseDate,
              moment.ISO_8601).
              add(moment.utc(warrantyItem.expiry_date, moment.ISO_8601).
                  add(1, 'days').
                  diff(moment.utc(productPurchaseDate, moment.ISO_8601),
                      'months'), 'months').
              subtract(1, 'days');
          warrantyItem.updated_by = options.user_id;
          warrantyItem.status_type = 11;
          if (warrantyItem.warranty_type === 1) {
            document_date = moment.utc(warrantyItem.expiry_date).add(1, 'days');
          } else {
            dual_date = moment.utc(warrantyItem.expiry_date).add(1, 'days');
          }

          return this.modals.warranties.update(warrantyItem, {where: {id}});
        } else if (moment.utc(warrantyItem.effective_date).
                startOf('days').
                valueOf() ===
            moment.utc(warrantyExpiryDate).startOf('days').valueOf() ||
            moment.utc(warrantyItem.effective_date).
                startOf('days').
                valueOf() ===
            moment.utc(dualWarrantyExpiryDate).startOf('days').valueOf()) {
          warrantyItem.effective_date = warrantyItem.warranty_type === 1 ?
              document_date :
              dual_date;
          warrantyItem.document_date = warrantyItem.warranty_type === 1 ?
              document_date :
              dual_date;
          if (warrantyItem.warranty_type === 1) {
            warrantyExpiryDate = warrantyItem.expiry_date;
          } else {
            dualWarrantyExpiryDate = warrantyItem.expiry_date;
          }
          warrantyItem.expiry_date = moment.utc(
              warrantyItem.warranty_type === 1 ? document_date : dual_date,
              moment.ISO_8601).
              add(moment.utc(warrantyItem.expiry_date, moment.ISO_8601).
                  add(1, 'days').
                  diff(moment.utc(warrantyItem.warranty_type === 1 ?
                      warrantyExpiryDate :
                      dualWarrantyExpiryDate,
                      moment.ISO_8601), 'months'), 'months').
              subtract(1, 'days');
          warrantyItem.updated_by = options.user_id;
          warrantyItem.status_type = 11;

          if (warrantyItem.warranty_type === 1) {
            document_date = warrantyItem.expiry_date;
          } else {
            dual_date = warrantyItem.expiry_date;
          }

          return this.modals.warranties.update(warrantyItem, {where: {id}});
        }

        return undefined;
      }));
    });
  }

  removeWarranties(id, copyId, values) {
    return this.modals.warranties.findOne({
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

      return this.modals.warranties.destroy({
        where: {
          id,
        },
      }).then(() => {
        return true;
      });
    });
  }

  deleteWarranties(id, user_id) {
    return this.modals.warranties.findById(id).then((result) => {
      if (result) {
        return Promise.all([
          this.modals.warranties.destroy({
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

export default WarrantyAdaptor;
