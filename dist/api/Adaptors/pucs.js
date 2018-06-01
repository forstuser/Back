/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sortAmcWarrantyInsurancePUC = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
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
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'main_category_id');
    options = _lodash2.default.omit(options, 'product_status_type');
    options = _lodash2.default.omit(options, 'brand_id');

    return this.modals.pucs.findAll({
      where: options,
      include: [{
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: productOptions !== undefined
      }, {
        model: this.modals.offlineSellers,
        as: 'sellers',
        attributes: [['sid', 'id'], ['seller_name', 'sellerName'], ['owner_name', 'ownerName'], ['pan_no', 'panNo'], ['reg_no', 'regNo'], ['is_service', 'isService'], 'url', 'gstin', ['contact_no', 'contact'], 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude'],
        required: false
      }],
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], 'user_id', ['document_number', 'policyNo'], ['renewal_cost', 'premiumAmount'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['renewal_cost', 'value'], 'renewal_type', ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies'],
      order: [['document_date', 'DESC']]
    }).then(pucResult => pucResult.map(item => {
      const productItem = item.toJSON();
      if (productItem.copies) {
        productItem.copies = productItem.copies.map(copyItem => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      productItem.purchaseDate = _moment2.default.utc(productItem.purchaseDate, _moment2.default.ISO_8601).startOf('days');
      return productItem;
    }).sort(sortAmcWarrantyInsurancePUC));
  }

  retrieveNotificationPUCs(options) {
    options.status_type = [5, 11];
    return this.modals.pucs.findAll({
      where: options,
      include: [{
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: productOptions !== undefined
      }],
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], 'user_id', ['document_number', 'policyNo'], ['renewal_cost', 'premiumAmount'], 'renewal_type', [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies'],
      order: [['document_date', 'DESC']]
    }).then(pucResult => pucResult.map(item => item.toJSON()).sort(sortAmcWarrantyInsurancePUC));
  }

  retrievePUCCount(options) {
    options.status_type = [5, 11];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type
    } : undefined;
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'main_category_id');
    options = _lodash2.default.omit(options, 'product_status_type');
    return this.modals.pucs.findAll({
      where: options,
      include: [{
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: productOptions !== undefined
      }],

      attributes: [[this.modals.sequelize.literal('COUNT(*)'), 'productCounts'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('max("pucs"."updated_at")'), 'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"')
    }).then(pucResult => pucResult.map(item => item.toJSON()));
  }

  createPUCs(values) {
    return this.modals.pucs.create(values).then(result => result.toJSON());
  }

  updatePUCs(id, values) {
    return this.modals.pucs.findOne({
      where: {
        id
      }
    }).then(result => {
      const itemDetail = result.toJSON();
      if (values.copies && values.copies.length > 0 && itemDetail.copies && itemDetail.copies.length > 0) {
        const newCopies = values.copies;
        values.copies = itemDetail.copies;
        values.copies.push(...newCopies);
      }

      values.status_type = itemDetail.status_type === 5 ? itemDetail.status_type : itemDetail.status_type !== 8 ? 11 : values.status_type || itemDetail.status_type;
      result.updateAttributes(values);
      return result.toJSON();
    });
  }

  updatePUCPeriod(options, productPurchaseDate, productNewPurchaseDate) {
    return this.modals.pucs.findAll({
      where: options,
      order: [['document_date', 'ASC']]
    }).then(result => {
      let document_date = productNewPurchaseDate;
      let pucExpiryDate;
      console.log('\n\n\n', JSON.stringify({ puc: result }));
      return Promise.all(result.map(item => {
        const pucItem = item.toJSON();
        const id = pucItem.id;
        if (_moment2.default.utc(pucItem.effective_date).startOf('days').valueOf() === _moment2.default.utc(productPurchaseDate).startOf('days').valueOf() || _moment2.default.utc(pucItem.effective_date).startOf('days').valueOf() < _moment2.default.utc(productNewPurchaseDate).startOf('days').valueOf()) {
          pucItem.effective_date = productNewPurchaseDate;
          pucItem.document_date = productNewPurchaseDate;
          pucExpiryDate = _moment2.default.utc(pucItem.expiry_date).add(1, 'days');
          pucItem.expiry_date = _moment2.default.utc(productNewPurchaseDate, _moment2.default.ISO_8601).add(_moment2.default.utc(pucItem.expiry_date, _moment2.default.ISO_8601).add(1, 'days').diff(_moment2.default.utc(productPurchaseDate, _moment2.default.ISO_8601), 'months', true), 'months').subtract(1, 'days');
          pucItem.updated_by = options.user_id;
          pucItem.status_type = 11;
          document_date = _moment2.default.utc(pucItem.expiry_date).add(1, 'days');

          return this.modals.pucs.update(pucItem, { where: { id } });
        } else if (_moment2.default.utc(pucItem.effective_date).startOf('days').valueOf() === _moment2.default.utc(pucExpiryDate).startOf('days').valueOf()) {
          pucItem.effective_date = document_date;
          pucItem.document_date = document_date;
          pucExpiryDate = pucItem.expiry_date;
          pucItem.expiry_date = _moment2.default.utc(document_date, _moment2.default.ISO_8601).add(_moment2.default.utc(pucItem.expiry_date, _moment2.default.ISO_8601).add(1, 'days').diff(_moment2.default.utc(pucExpiryDate, _moment2.default.ISO_8601), 'months', true), 'months').subtract(1, 'days');
          pucItem.updated_by = options.user_id;
          pucItem.status_type = 11;
          document_date = pucItem.expiry_date;
          return this.modals.pucs.update(pucItem, { where: { id } });
        }

        return undefined;
      }));
    });
  }

  removePUCs(id, copyId, values) {
    return this.modals.pucs.findOne({
      where: {
        id
      }
    }).then(result => {
      const itemDetail = result.toJSON();
      if (copyId && itemDetail.copies.length > 0) {
        values.copies = itemDetail.copies.filter(item => item.copyId !== parseInt(copyId));
        result.updateAttributes(values);

        return result.toJSON();
      }

      return this.modals.pucs.destroy({
        where: {
          id
        }
      }).then(() => {
        return true;
      });
    });
  }

  deletePUCs(id, user_id) {
    return this.modals.pucs.findById(id).then(result => {
      if (result) {
        return Promise.all([this.modals.mailBox.create({
          title: `User Deleted PUC #${id}`,
          job_id: result.job_id,
          bill_product_id: result.product_id,
          notification_type: 100
        }), this.modals.pucs.destroy({
          where: {
            id,
            user_id
          }
        }), result.copies && result.copies.length > 0 ? this.modals.jobCopies.update({
          status_type: 3,
          updated_by: user_id
        }, {
          where: {
            id: result.copies.map(item => item.copyId)
          }
        }) : undefined]).then(() => {
          return true;
        });
      }

      return true;
    });
  }
}

exports.default = PUCAdaptor;