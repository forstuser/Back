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

const sortAmcWarrantyInsuranceRepair = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

class RepairAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveRepairs(options) {
    const { status_type, main_category_id, product_status_type, category_id } = options;
    if (!status_type) {
      options.status_type = [5, 11, 12];
    }
    let productOptions = JSON.parse(JSON.stringify({
      main_category_id,
      status_type: product_status_type,
      category_id
    }));

    productOptions = productOptions === {} ? undefined : productOptions;
    options = _lodash2.default.omit(options, 'ref_id');
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'main_category_id');
    options = _lodash2.default.omit(options, 'product_status_type');
    options = _lodash2.default.omit(options, 'brand_id');

    const repairResult = await this.modals.repairs.findAll({
      where: options,
      include: [{
        model: this.modals.onlineSellers,
        as: 'onlineSellers',
        attributes: ['id', ['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
        required: false
      }, {
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: productOptions !== undefined
      }, {
        model: this.modals.sellers,
        as: 'sellers',
        attributes: ['id', ['seller_name', 'sellerName'], ['owner_name', 'ownerName'], ['pan_no', 'panNo'], ['reg_no', 'regNo'], ['is_service', 'isService'], 'url', 'gstin', ['contact_no', 'contact'], 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude'],
        required: false
      }],
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], 'user_id', ['document_number', 'policyNo'], ['repair_cost', 'premiumAmount'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['repair_cost', 'value'], ['repair_taxes', 'taxes'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], 'warranty_upto', 'repair_for', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies'],
      order: [['document_date', 'DESC']]
    });
    return repairResult.map(item => {
      const productItem = item.toJSON();
      if (productItem.copies) {
        productItem.copies = productItem.copies.map(copyItem => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      productItem.purchaseDate = _moment2.default.utc(productItem.purchaseDate, _moment2.default.ISO_8601).startOf('days');
      return productItem;
    }).sort(sortAmcWarrantyInsuranceRepair);
  }

  async retrieveNotificationRepairs(options) {
    options.status_type = [5, 11];
    const repairResult = await this.modals.repairs.findAll({
      where: options,
      include: [{
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: productOptions !== undefined
      }],
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], 'user_id', ['document_number', 'policyNo'], ['repair_cost', 'premiumAmount'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['repair_cost', 'value'], ['repair_taxes', 'taxes'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies'],
      order: [['document_date', 'DESC']]
    });
    return repairResult.map(item => item.toJSON()).sort(sortAmcWarrantyInsuranceRepair);
  }

  async retrieveRepairCount(options) {
    options.status_type = [5, 11];
    const productOptions = options.product_status_type ? {
      status_type: options.product_status_type
    } : undefined;
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'main_category_id');
    options = _lodash2.default.omit(options, 'product_status_type');
    const repairResult = await this.modals.repairs.findAll({
      where: options, include: [{
        model: this.modals.products, where: productOptions,
        attributes: [], required: productOptions !== undefined
      }], attributes: [[this.modals.sequelize.literal('COUNT(*)'), 'productCounts'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('max("repairs"."updated_at")'), 'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"')
    });
    return repairResult.map(item => item.toJSON());
  }

  async createRepairs(values) {
    const result = await this.modals.repairs.create(values);
    return result.toJSON();
  }

  async updateRepairs(id, values) {
    const result = await this.modals.repairs.findOne({ where: { id } });
    const itemDetail = result.toJSON();
    if (values.copies && values.copies.length > 0 && itemDetail.copies && itemDetail.copies.length > 0) {
      const newCopies = values.copies;
      values.copies = itemDetail.copies;
      values.copies.push(...newCopies);
    }

    values.status_type = itemDetail.status_type === 5 ? itemDetail.status_type : itemDetail.status_type !== 8 ? 11 : values.status_type || itemDetail.status_type;

    await result.updateAttributes(values);
    return result.toJSON();
  }

  async removeRepairs(id, copyId, values) {
    const result = await this.modals.repairs.findOne({ where: { id } });
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(item => item.copyId !== parseInt(copyId));

      await result.updateAttributes(values);
      return result.toJSON();
    }

    await this.modals.repairs.destroy({
      where: {
        id
      }
    });
    return true;
  }

  async deleteRepair(id, user_id) {
    const result = await this.modals.repairs.findById(id);
    if (result) {
      await Promise.all([this.modals.mailBox.create({
        title: `User Deleted Repair #${id}`, job_id: result.job_id,
        bill_product_id: result.product_id, notification_type: 100
      }), this.modals.repairs.destroy({ where: { id, user_id } }), result.copies && result.copies.length > 0 ? this.modals.jobCopies.update({ status_type: 3, updated_by: user_id }, { where: { id: result.copies.map(item => item.copyId) } }) : undefined]);
    }

    return true;
  }
}

exports.default = RepairAdaptor;