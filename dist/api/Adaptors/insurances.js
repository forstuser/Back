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

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}

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
      if (!options.status_type) {
        options.status_type = [5, 11, 12];
      }
      var productOptions = {};

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

      return this.modals.insurances.findAll({
        where: options,
        include: [{
          model: this.modals.renewalTypes,
          attributes: []
        }, {
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined
        }, {
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [
            [
              'sid',
              'id'],
            [
              'seller_name',
              'sellerName'],
            'url',
            'gstin',
            'contact',
            'email'],
          required: false
        }, {
          model: this.modals.insuranceBrands,
          as: 'provider',
          attributes: ['id', 'name', ['pan_no', 'panNo'], ['reg_no', 'regNo'], 'url', 'gstin', ['contact_no', 'contact'], 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude'],
          required: false
        }, {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [
            [
              'sid',
              'id'],
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
          [
            'amount_insured',
            'amountInsured'],
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
          'copies',
          'user_id'],
        order: [['expiry_date', 'DESC']]
      }).then(function (insuranceResult) {
        return insuranceResult.map(function (item) {
          return item.toJSON();
        }).sort(sortAmcWarrantyInsuranceRepair);
      });
    }
  }, {
    key: 'retrieveNotificationInsurances',
    value: function retrieveNotificationInsurances(options) {
      options.status_type = [5, 11, 12];
      return this.modals.insurances.findAll({
        where: options,
        include: [{
          model: this.modals.renewalTypes,
          attributes: []
        }, {
          model: this.modals.products,
          attributes: []
        }],
        attributes: ['id', ['product_id', 'productId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], ['job_id', 'jobId'], ['document_number', 'policyNo'], [this.modals.sequelize.literal('"renewalType"."title"'), 'premiumType'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['renewal_cost', 'premiumAmount'], ['renewal_cost', 'value'], ['renewal_taxes', 'taxes'], ['amount_insured', 'amountInsured'], ['effective_date', 'effectiveDate'], ['expiry_date', 'expiryDate'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies', 'user_id'],
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
      options.status_type = [5, 11, 12];
      var productOptions = options.product_status_type ? {
        status_type: options.product_status_type
      } : undefined;
      options = _lodash2.default.omit(options, 'category_id');
      options = _lodash2.default.omit(options, 'main_category_id');
      options = _lodash2.default.omit(options, 'product_status_type');
      return this.modals.insurances.findAll({
        where: options,
        include: [{
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined
        }],

        attributes: [[this.modals.sequelize.literal('COUNT(*)'), 'productCounts'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('max("insurances"."updated_at")'), 'lastUpdatedAt']],
        group: this.modals.sequelize.literal('"product"."main_category_id"')
      }).then(function (insuranceResult) {
        return insuranceResult.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'createInsurances',
    value: function createInsurances(values) {
      return this.modals.insurances.create(values).then(function (result) {
        return result.toJSON();
      });
    }
  }, {
    key: 'findCreateInsuranceBrand',
    value: function findCreateInsuranceBrand(values) {
      var _this = this;

      var insuranceBrand = void 0;
      return this.modals.insuranceBrands.findOne({
        where: {
          name: {
            $iLike: '' + values.name,
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
        }
      }).then(function(result) {
        if (!result) {
          return _this.modals.insuranceBrands.create(
              _lodash2.default.omit(values, 'category_id'));
        }

        return result;
      }).then(function(updatedResult) {
        insuranceBrand = updatedResult.toJSON();
        console.log(insuranceBrand);
        if (!insuranceBrand.categories) {
          return _this.modals.insuranceBrandCategories.create({
            insurance_brand_id: insuranceBrand.id,
            category_id: values.category_id,
          });
        }

        return undefined;
      }).then(function(finalResult) {
        if (finalResult) {
          insuranceBrand.categories = finalResult.toJSON();
        }

        return insuranceBrand;
      });
    }
  }, {
    key: 'updateInsurances',
    value: function updateInsurances(id, values) {
      return this.modals.insurances.findOne({
        where: {
          id: id
        }
      }).then(function (result) {
        var itemDetail = result.toJSON();
        if (values.copies && values.copies.length > 0 &&
            itemDetail.copies.length > 0) {
          var _values$copies;

          var newCopies = values.copies;
          values.copies = itemDetail.copies;
          (_values$copies = values.copies).push.apply(_values$copies,
              _toConsumableArray(newCopies));
        }

        values.status_type = itemDetail.status_type !== 8 ?
            11 :
            values.status_type || itemDetail.status_type;

        result.updateAttributes(values);
        return result.toJSON();
      });
    }
  }, {
    key: 'removeInsurances',
    value: function removeInsurances(id, copyId, values) {
      var _this2 = this;

      return this.modals.insurances.findOne({
        where: {
          id: id,
        }
      }).then(function(result) {
        var itemDetail = result.toJSON();
        if (copyId && itemDetail.copies.length > 0) {
          values.copies = itemDetail.copies.filter(function(item) {
            return item.copyId !== parseInt(copyId);
          });

          if (values.copies.length > 0) {
            result.updateAttributes(values);
          }

          return result.toJSON();
        }

        return _this2.modals.insurances.destroy({
          where: {
            id: id,
          }
        }).then(function() {
          return true;
        });
      });
    }
  }, {
    key: 'deleteInsurance',
    value: function deleteInsurance(id, user_id) {
      return this.modals.insurances.destroy({
        where: {
          id: id,
          user_id: user_id,
        },
      }).then(function() {
        return true;
      });
    }
  }]);

  return InsuranceAdaptor;
}();

exports.default = InsuranceAdaptor;