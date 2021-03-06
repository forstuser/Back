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

class AmcAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveAMCs(options) {
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

    options = _lodash2.default.omit(options, ['ref_id', 'category_id', 'main_category_id', 'product_status_type', 'brand_id', 'product_name', 'bill_id', 'accessory_part_id', 'accessory_id']);

    const amcResult = await this.modals.amcs.findAll({
      where: options,
      include: [{
        model: this.modals.renewalTypes,
        attributes: []
      }, {
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: !!productOptions
      }, {
        model: this.modals.onlineSellers,
        as: 'onlineSellers',
        attributes: ['id', ['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
        required: false
      }, {
        model: this.modals.sellers,
        as: 'sellers',
        attributes: ['id', ['seller_name', 'sellerName'], 'url', ['contact_no', 'contact'], 'email', 'address', [this.modals.sequelize.literal('(Select state_name from table_states as state where state.id = sellers.state_id)'), 'state_name'], [this.modals.sequelize.literal('(Select name from table_cities as city where city.id = sellers.city_id)'), 'city_name'], [this.modals.sequelize.literal('(Select name from table_localities as locality where locality.id = sellers.locality_id)'), 'locality_name'], [this.modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'), 'pin_code'], 'latitude', 'longitude'],
        required: false
      }],
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], ['document_number', 'policyNo'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('"renewalType"."title"'), 'premiumType'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['renewal_cost', 'premiumAmount'], ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'], ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'], 'renewal_type', ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']]
    });
    return amcResult.map(item => {
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

  async retrieveNotificationAMCs(options) {
    options.status_type = [5, 11, 12];

    const amcResult = await this.modals.amcs.findAll({
      where: options,
      include: [{
        model: this.modals.renewalTypes,
        attributes: []
      }, {
        model: this.modals.products,
        attributes: []
      }],
      attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], ['document_number', 'policyNo'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], ['renewal_taxes', 'taxes'], [this.modals.sequelize.literal('"renewalType"."title"'), 'premiumType'], ['renewal_cost', 'value'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['renewal_cost', 'premiumAmount'], ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id'],
      order: [['expiry_date', 'DESC']]
    });
    return amcResult.map(item => {
      const productItem = item.toJSON();
      if (productItem.copies) {
        productItem.copies = productItem.copies.map(copyItem => {
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
      status_type: options.product_status_type
    } : undefined;
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'main_category_id');
    options = _lodash2.default.omit(options, 'product_status_type');

    const amcResult = await this.modals.amcs.findAll({
      where: options,
      include: [{
        model: this.modals.products,
        where: productOptions,
        attributes: [],
        required: productOptions !== undefined
      }],

      attributes: [[this.modals.sequelize.literal('COUNT(*)'), 'productCounts'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('max("amcs"."updated_at")'), 'lastUpdatedAt']],
      group: this.modals.sequelize.literal('"product"."main_category_id"')
    });
    return amcResult.map(item => item.toJSON());
  }

  async createAMCs(values) {
    const result = await this.modals.amcs.create(values);
    return result.toJSON();
  }

  async updateAMCs(id, values) {
    const result = await this.modals.amcs.findOne({
      where: {
        id
      }
    });

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

  async updateAMCPeriod(options, productPurchaseDate, productNewPurchaseDate) {
    const result = await this.modals.amcs.findAll({ where: options, order: [['document_date', 'ASC']] });
    let document_date = productNewPurchaseDate;
    let amcExpiryDate;
    return await Promise.all(result.map(item => {
      const amcItem = item.toJSON();
      const id = amcItem.id;
      if (_moment2.default.utc(amcItem.effective_date).startOf('days').isSame(_moment2.default.utc(productPurchaseDate).startOf('days')) || _moment2.default.utc(amcItem.effective_date).startOf('days').isBefore(_moment2.default.utc(productNewPurchaseDate).startOf('days'))) {
        amcItem.effective_date = productNewPurchaseDate;
        amcItem.document_date = productNewPurchaseDate;
        amcExpiryDate = _moment2.default.utc(amcItem.expiry_date).add(1, 'days');
        amcItem.expiry_date = _moment2.default.utc(productNewPurchaseDate, _moment2.default.ISO_8601).add(_moment2.default.utc(amcItem.expiry_date, _moment2.default.ISO_8601).add(1, 'days').diff(_moment2.default.utc(productPurchaseDate, _moment2.default.ISO_8601), 'months', true), 'months').subtract(1, 'days');
        amcItem.updated_by = options.user_id;
        amcItem.status_type = 11;
        document_date = _moment2.default.utc(amcItem.expiry_date).add(1, 'days');

        return this.modals.amcs.update(amcItem, { where: { id } });
      } else if (_moment2.default.utc(amcItem.effective_date).startOf('days').isSame(_moment2.default.utc(amcExpiryDate).startOf('days'))) {
        amcItem.effective_date = document_date;
        amcItem.document_date = document_date;
        amcExpiryDate = amcItem.expiry_date;
        amcItem.expiry_date = _moment2.default.utc(document_date, _moment2.default.ISO_8601).add(_moment2.default.utc(amcItem.expiry_date, _moment2.default.ISO_8601).add(1, 'days').diff(_moment2.default.utc(amcExpiryDate, _moment2.default.ISO_8601), 'months', true), 'months').subtract(1, 'days');
        amcItem.updated_by = options.user_id;
        amcItem.status_type = 11;
        document_date = amcItem.expiry_date;
        return this.modals.amcs.update(amcItem, { where: { id } });
      }

      return undefined;
    }));
  }

  async removeAMCs(id, copyId, values) {
    const result = await this.modals.amcs.findOne({ where: { id } });
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(item => item.copyId !== parseInt(copyId));
      await result.updateAttributes(values);
      return result.toJSON();
    }

    await Promise.all([this.modals.mailBox.create({
      title: `User tried to Delete AMC ${id}`,
      job_id: itemDetail.job_id,
      bill_product_id: itemDetail.product_id,
      notification_type: 100
    }), this.modals.amcs.destroy({
      where: {
        id
      }
    })]);
    return true;
  }

  async deleteAMC(id, user_id) {
    const result = await this.modals.amcs.findById(id);
    if (result) {
      await Promise.all([this.modals.mailBox.create({
        title: `User tried to Delete AMC ${id}`, job_id: result.job_id,
        bill_product_id: result.product_id, notification_type: 100
      }), this.modals.amcs.destroy({ where: { id, user_id } }), result.copies && result.copies.length > 0 ? this.modals.jobCopies.update({ status_type: 3, updated_by: user_id }, { where: { id: result.copies.map(item => item.copyId) } }) : undefined]);
    }

    return true;
  }
}

exports.default = AmcAdaptor;