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

  retrieveInsurances(options) {
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

    return this.modals.insurances.findAll({
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
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          'job_id',
          'jobId'],
        [
          'document_number',
          'policyNo'],
        'provider_id',
        [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        'renewal_type',
        [
          'renewal_cost',
          'premiumAmount'],
        [
          'renewal_cost',
          'value'],
        [
          'renewal_taxes',
          'taxes'],
        ['amount_insured', 'amountInsured'],
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
        'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    }).
        then((insuranceResult) => insuranceResult.map((item) => {
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
        }).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveNotificationInsurances(options) {
    options.status_type = [5, 11, 12];
    return this.modals.insurances.findAll({
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
          this.modals.sequelize.literal('"product"."main_category_id"'),
          'masterCategoryId'],
        [
          'job_id',
          'jobId'],
        [
          'document_number',
          'policyNo'],
        [
          this.modals.sequelize.literal('"renewalType"."title"'),
          'premiumType'],
        [
          this.modals.sequelize.literal('"product"."product_name"'),
          'productName'],
        [
          'renewal_cost',
          'premiumAmount'],
        [
          'renewal_cost',
          'value'],
        [
          'renewal_taxes',
          'taxes'],
        ['amount_insured', 'amountInsured'],
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
        'copies', 'user_id'],
      order: [['expiry_date', 'DESC']],
    }).
        then((insuranceResult) => insuranceResult.map((item) => {
          const productItem = item.toJSON();
          if (productItem.copies) {
            productItem.copies = productItem.copies.map((copyItem) => {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }

          return productItem;
        }).
            sort(sortAmcWarrantyInsuranceRepair));
  }

  retrieveInsuranceCount(options) {
    options.status_type = [5, 11, 12];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type,
    } : undefined;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'main_category_id');
    options = _.omit(options, 'product_status_type');
    return this.modals.insurances.findAll({
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
          this.modals.sequelize.literal('max("insurances"."updated_at")'),
          'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"'),
    }).then((insuranceResult) => insuranceResult.map((item) => item.toJSON()));
  }

  createInsurances(values) {
    return this.modals.insurances.create(values).
        then(result => result.toJSON());
  }

  findCreateInsuranceBrand(values) {
    let insuranceBrand;
    return this.modals.insuranceBrands.findOne({
      where: {
        name: {
          $iLike: `${values.name}`,
        },
        main_category_id: values.main_category_id,
        type: values.type,
      },
      include: {
        model: this.modals.categories,
        where: {
          category_id: values.category_id,
        },
        as: 'categories',
        attributes: ['category_id'],
        required: true,
      },
    }).then((result) => {
      if (!result) {
        return this.modals.insuranceBrands.create(
            _.omit(values, 'category_id'));
      }

      return result;
    }).then((updatedResult) => {
      insuranceBrand = updatedResult.toJSON();
      console.log(insuranceBrand);
      if (!insuranceBrand.categories) {
        return this.modals.insuranceBrandCategories.create({
          insurance_brand_id: insuranceBrand.id,
          category_id: values.category_id,
        });
      }

      return undefined;
    }).then((finalResult) => {
      if (finalResult) {
        insuranceBrand.categories = finalResult.toJSON();
      }

      return insuranceBrand;
    });
  }

  updateInsurances(id, values) {
    return this.modals.insurances.findOne({
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

  updateInsurancePeriod(options, productPurchaseDate, productNewPurchaseDate) {
    return this.modals.insurances.findAll({
      where: options,
      order: [['document_date', 'ASC']],
    }).then(result => {
      let document_date = productNewPurchaseDate;
      let insuranceExpiryDate;
      return Promise.all(result.map((item) => {
        const insuranceItem = item.toJSON();
        const id = insuranceItem.id;
        if (moment.utc(insuranceItem.effective_date).
                startOf('days').
                valueOf() ===
            moment.utc(productPurchaseDate).startOf('days').valueOf() ||
            moment.utc(insuranceItem.effective_date).startOf('days').valueOf() <
            moment.utc(productNewPurchaseDate).startOf('days').valueOf()) {
          insuranceItem.effective_date = productNewPurchaseDate;
          insuranceItem.document_date = productNewPurchaseDate;
          insuranceExpiryDate = moment.utc(insuranceItem.expiry_date).
              add(1, 'days');
          insuranceItem.expiry_date = moment.utc(productNewPurchaseDate,
              moment.ISO_8601).
              add(moment.utc(insuranceItem.expiry_date, moment.ISO_8601).
                  add(1, 'days').
                  diff(moment.utc(productPurchaseDate, moment.ISO_8601),
                      'months', true), 'months').
              subtract(1, 'days');
          insuranceItem.updated_by = options.user_id;
          insuranceItem.status_type = 11;
          document_date = moment.utc(insuranceItem.expiry_date).add(1, 'days');

          return this.modals.insurances.update(insuranceItem, {where: {id}});
        } else if (moment.utc(insuranceItem.effective_date).
                startOf('days').
                valueOf() ===
            moment.utc(insuranceExpiryDate).startOf('days').valueOf()) {
          insuranceItem.effective_date = document_date;
          insuranceItem.document_date = document_date;
          insuranceExpiryDate = insuranceItem.expiry_date;
          insuranceItem.expiry_date = moment.utc(document_date,
              moment.ISO_8601).
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
    });
  }

  removeInsurances(id, copyId, values) {
    return this.modals.insurances.findOne({
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

      return this.modals.insurances.destroy({
        where: {
          id,
        },
      }).then(() => {
        return true;
      });
    });
  }

  deleteInsurance(id, user_id) {
    return this.modals.insurances.findById(id).then((result) => {
      if (result) {
        return Promise.all([
          this.modals.insurances.destroy({
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

export default InsuranceAdaptor;