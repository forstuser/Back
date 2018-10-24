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

class RegCertificateAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveRegCerts(options) {
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

    const regCertResult = await this.modals.reg_certificate.findAll({
      where: options,
      include: [{
        model: this.modals.renewalTypes,
        as: 'renewal_detail',
        attributes: []
      }, {
        model: this.modals.products, where: productOptions,
        attributes: [], required: productOptions !== undefined
      }, {
        model: this.modals.states, as: 'state',
        attributes: ['id', 'state_name'], required: false
      }],
      attributes: ['id', 'product_id', [this.modals.sequelize.literal('"product"."main_category_id"'), 'main_category_id'], 'job_id', [this.modals.sequelize.literal('"renewal_detail"."title"'), 'renewal_type'], 'document_number', [this.modals.sequelize.literal('"product"."product_name"'), 'product_name'], ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'], 'expiry_date', 'document_date', 'effective_date', 'renewal_type', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']]
    });
    return regCertResult.map(item => {
      const productItem = item.toJSON();

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

  async retrieveNotificationRegCerts(options) {
    options.status_type = [5, 11, 12];
    const regCertResult = await this.modals.reg_certificate.findAll({
      where: options, include: [{ model: this.modals.renewalTypes, attributes: [] }, { model: this.modals.products, attributes: [] }],
      attributes: ['id', ['product_id', 'productId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], ['job_id', 'jobId'], 'provider_id', [this.modals.sequelize.literal('"renewalType"."title"'), 'premiumType'], ['document_number', 'policyNo'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['renewal_cost', 'premiumAmount'], ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'], ['amount_insured', 'amountInsured'], ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], ['effective_date', 'effectiveDate'], 'renewal_type', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']]
    });
    return regCertResult.map(item => {
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

  async createRegCerts(values) {
    const result = await this.modals.reg_certificate.create(values);
    return result.toJSON();
  }

  async updateRegCerts(id, values) {
    const result = await this.modals.reg_certificate.findOne({ where: { id } });
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

  async updateRegCertPeriod(parameters) {
    let { options, purchase_date, new_purchase_date } = parameters;
    const result = await this.modals.reg_certificate.findAll({ where: options, order: [['document_date', 'ASC']] });
    let document_date = new_purchase_date;
    let regCertExpiryDate;
    return await Promise.all(result.map(item => {
      const regCertItem = item.toJSON();
      const id = regCertItem.id;
      if (_moment2.default.utc(regCertItem.effective_date).startOf('days').isSame(_moment2.default.utc(purchase_date).startOf('days')) || _moment2.default.utc(regCertItem.effective_date).startOf('days').isBefore(_moment2.default.utc(new_purchase_date).startOf('days'))) {
        regCertItem.effective_date = new_purchase_date;
        regCertItem.document_date = new_purchase_date;
        regCertExpiryDate = _moment2.default.utc(regCertItem.expiry_date).add(1, 'days');
        regCertItem.expiry_date = _moment2.default.utc(new_purchase_date, _moment2.default.ISO_8601).add(_moment2.default.utc(regCertItem.expiry_date, _moment2.default.ISO_8601).add(1, 'days').diff(_moment2.default.utc(purchase_date, _moment2.default.ISO_8601), 'months', true), 'months').subtract(1, 'days');
        regCertItem.updated_by = options.user_id;
        regCertItem.status_type = 11;
        document_date = _moment2.default.utc(regCertItem.expiry_date).add(1, 'days');

        return this.modals.reg_certificate.update(regCertItem, { where: { id } });
      } else if (_moment2.default.utc(regCertItem.effective_date).startOf('days').isSame(_moment2.default.utc(regCertExpiryDate).startOf('days'))) {
        regCertItem.effective_date = document_date;
        regCertItem.document_date = document_date;
        regCertExpiryDate = regCertItem.expiry_date;
        regCertItem.expiry_date = _moment2.default.utc(document_date, _moment2.default.ISO_8601).add(_moment2.default.utc(regCertItem.expiry_date, _moment2.default.ISO_8601).add(1, 'days').diff(_moment2.default.utc(regCertExpiryDate, _moment2.default.ISO_8601), 'months', true), 'months').subtract(1, 'days');
        regCertItem.updated_by = options.user_id;
        regCertItem.status_type = 11;
        document_date = regCertItem.expiry_date;
        return this.modals.reg_certificate.update(regCertItem, { where: { id } });
      }

      return undefined;
    }));
  }

  async removeRegCerts(id, copyId, values) {
    const result = await this.modals.reg_certificate.findOne({ where: { id } });
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(item => item.copyId !== parseInt(copyId));
      await result.updateAttributes(values);
      return result.toJSON();
    }

    await this.modals.reg_certificate.destroy({ where: { id } });
    return true;
  }

  async deleteRegCert(id, user_id) {
    const result = await this.modals.reg_certificate.findById(id);
    if (result) {
      await Promise.all([this.modals.mailBox.create({
        title: `User Deleted Registration Certificate #${id}`,
        job_id: result.job_id,
        bill_product_id: result.product_id,
        notification_type: 100
      }), this.modals.reg_certificate.destroy({ where: { id, user_id } }), result.copies && result.copies.length > 0 ? this.modals.jobCopies.update({ status_type: 3, updated_by: user_id }, { where: { id: result.copies.map(item => item.copyId) } }) : undefined]);
    }

    return true;
  }
}

exports.default = RegCertificateAdaptor;