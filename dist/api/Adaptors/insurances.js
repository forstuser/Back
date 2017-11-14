/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sortAmcWarrantyInsuranceRepair = function sortAmcWarrantyInsuranceRepair(a, b) {
  var aDate = void 0;
  var bDate = void 0;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

var InsuranceAdaptor = function () {
  function InsuranceAdaptor(modals) {
    _classCallCheck(this, InsuranceAdaptor);

    this.modals = modals;
  }

  _createClass(InsuranceAdaptor, [{
    key: 'retrieveInsurances',
    value: function retrieveInsurances(options) {
      options.status_type = 5;
      var productOptions = options.main_category_id ||
      options.product_status_type ? {
        main_category_id: options.main_category_id,
        status_type: options.product_status_type,
      } : undefined;
      options = _lodash2.default.omit(options, 'main_category_id');
      options = _lodash2.default.omit(options, 'product_status_type');
      return this.modals.insurances.findAll({
        where: options,
        include: [{
          model: this.modals.renewalTypes,
          attributes: []
        }, {
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined,
        }, {
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
          required: false
        }, {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [
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
            [
              'contact_no',
              'contact'],
            'email',
            'address',
            'city',
            'state',
            'pincode',
            'latitude',
            'longitude'],
          required: false
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
          [
            'effective_date',
            'effectiveDate'],
          [
            'expiry_date',
            'expiryDate'],
          [
            'document_date',
            'purchaseDate'],
          [
            'updated_at',
            'updatedDate'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"product_id"')),
            'productURL'],
          'copies'],
        order: [['expiry_date', 'DESC']]
      }).then(function (insuranceResult) {
        return insuranceResult.map(function (item) {
          return item.toJSON();
        }).sort(sortAmcWarrantyInsuranceRepair);
      });
    }
  }, {
    key: 'retrieveInsuranceCount',
    value: function retrieveInsuranceCount(options) {
      options.status_type = 5;
      var productOptions = options.main_category_id ||
      options.product_status_type ? {
        main_category_id: options.main_category_id,
        status_type: options.product_status_type,
      } : undefined;
      options = _lodash2.default.omit(options, 'main_category_id');
      options = _lodash2.default.omit(options, 'product_status_type');
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
          [
            this.modals.sequelize.literal('COUNT(*)'),
            'productCounts'],
          [
            this.modals.sequelize.literal('"product"."main_category_id"'),
            'masterCategoryId'],
          [
            this.modals.sequelize.literal('max("insurances"."updated_at")'),
            'lastUpdatedAt']],
        group: this.modals.sequelize.literal('"product"."main_category_id"'),
      }).then(function(insuranceResult) {
        return insuranceResult.map(function(item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return InsuranceAdaptor;
}();

exports.default = InsuranceAdaptor;