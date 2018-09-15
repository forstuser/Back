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

const sortAmcWarrantyRegCertRepair = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

class RefuelingAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.fuel_types = ['Petrol', 'Diesel', 'CNG', 'LPG', 'Hybrid'];
  }

  async retrieveRefueling(options) {
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
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'main_category_id');
    options = _lodash2.default.omit(options, 'product_status_type');
    options = _lodash2.default.omit(options, 'brand_id');
    options = _lodash2.default.omit(options, 'ref_id');

    const refuelingResult = await this.modals.refueling.findAll({
      where: options,
      include: [{
        model: this.modals.products, where: productOptions,
        attributes: [], required: productOptions !== undefined
      }],
      attributes: ['id', 'product_id', [this.modals.sequelize.literal('"product"."main_category_id"'), 'main_category_id'], 'job_id', 'document_number', [this.modals.sequelize.literal('"product"."product_name"'), 'product_name'], ['purchase_cost', 'value'], ['purchase_taxes', 'taxes'], 'document_date', 'effective_date', 'odometer_reading', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id', 'fuel_type', 'fuel_quantity'],
      order: [['odometer_reading', 'DESC'], ['effective_date', 'DESC']]
    });
    return refuelingResult.map(item => {
      const productItem = item.toJSON();
      productItem.fuel = this.fuel_types[productItem.fuel_type];
      if (productItem.copies) {
        productItem.copies = productItem.copies.map(copyItem => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      productItem.document_date = _moment2.default.utc(productItem.document_date, _moment2.default.ISO_8601).startOf('days');
      return productItem;
    }).sort(sortAmcWarrantyRegCertRepair);
  }

  async retrieveNotificationRefueling(options) {
    options.status_type = [5, 11, 12];
    const refuelingResult = await this.modals.refueling.findAll({
      where: options, include: [{ model: this.modals.products, attributes: [] }],
      attributes: ['id', 'product_id', [this.modals.sequelize.literal('"product"."main_category_id"'), 'main_category_id'], 'job_id', 'document_number', [this.modals.sequelize.literal('"product"."product_name"'), 'product_name'], ['purchase_cost', 'value'], ['purchase_taxes', 'taxes'], 'document_date', 'effective_date', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id'],
      order: [['effective_date', 'DESC']]
    });
    return refuelingResult.map(item => {
      const productItem = item.toJSON();
      if (productItem.copies) {
        productItem.copies = productItem.copies.map(copyItem => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }

      return productItem;
    }).sort(sortAmcWarrantyRegCertRepair);
  }

  async createRefuelings(values) {
    const result = await this.modals.refueling.create(values);
    return result.toJSON();
  }

  async updateRefuelings(id, values) {
    try {
      const result = await this.modals.refueling.findOne({ where: { id } });
      const itemDetail = result.toJSON();
      if (values.copies && values.copies.length > 0 && itemDetail.copies && itemDetail.copies.length > 0) {
        const newCopies = values.copies;
        values.copies = itemDetail.copies;
        values.copies.push(...newCopies);
      }

      values.status_type = itemDetail.status_type === 5 ? itemDetail.status_type : itemDetail.status_type !== 8 ? 11 : values.status_type || itemDetail.status_type;

      await result.updateAttributes(values);
      return result.toJSON();
    } catch (e) {
      throw e;
    }
  }

  async removeRefueling(id, copyId, values) {
    const result = await this.modals.refueling.findOne({ where: { id } });
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(item => item.copyId !== parseInt(copyId));
      await result.updateAttributes(values);
      return result.toJSON();
    }

    await this.modals.refueling.destroy({ where: { id } });
    return true;
  }

  async deleteRefueling(id, user_id) {
    try {
      const result = await this.modals.refueling.findById(id);
      if (result) {
        await Promise.all([this.modals.mailBox.create({
          title: `User Deleted Refueling detail #${id}`,
          job_id: result.job_id,
          bill_product_id: result.product_id,
          notification_type: 100
        }), this.modals.refueling.destroy({ where: { id, user_id } }), result.copies && result.copies.length > 0 ? this.modals.jobCopies.update({ status_type: 3, updated_by: user_id }, { where: { id: result.copies.map(item => item.copyId) } }) : undefined]);
      }

      return true;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

exports.default = RefuelingAdaptor;