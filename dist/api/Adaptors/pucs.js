/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var sortAmcWarrantyInsurancePUC = function sortAmcWarrantyInsurancePUC(a, b) {
  var aDate = void 0;
  var bDate = void 0;

  aDate = a.expiry_date;
  bDate = b.expiry_date;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

var PUCAdaptor = function() {
  function PUCAdaptor(modals) {
    _classCallCheck(this, PUCAdaptor);

    this.modals = modals;
  }

  _createClass(PUCAdaptor, [
    {
      key: 'retrievePUCs',
      value: function retrievePUCs(options) {
        options.status_type = [5, 11, 12];
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

        return this.modals.pucs.findAll({
          where: options,
          include: [
            {
              model: this.modals.products,
              where: productOptions,
              attributes: [],
              required: productOptions !== undefined,
            }, {
              model: this.modals.offlineSellers,
              as: 'sellers',
              attributes: [
                [
                  'sid',
                  'id'],
                'seller_name',
                'owner_name',
                'url',
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
              required: false,
            }],
          attributes: [
            'id',
            'product_id',
            'job_id',
            [
              this.modals.sequelize.literal('"product"."main_category_id"'),
              'main_category_id'],
            'user_id',
            'document_number',
            [
              this.modals.sequelize.literal('"product"."product_name"'),
              'product_name'],
            [
              'renewal_type',
              'premium_type'],
            [
              'renewal_cost',
              'value'],
            [
              'renewal_taxes',
              'taxes'],
            'effective_date',
            'expiry_date',
            'document_date',
            'updated_at',
            [
              this.modals.sequelize.fn('CONCAT', 'products/',
                  this.modals.sequelize.literal('"product_id"')),
              'product_url'],
            'copies'],
          order: [['document_date', 'DESC']],
        }).then(function(pucResult) {
          return pucResult.map(function(item) {
            return item.toJSON();
          }).sort(sortAmcWarrantyInsurancePUC);
        });
      },
    }, {
      key: 'retrieveNotificationPUCs',
      value: function retrieveNotificationPUCs(options) {
        options.status_type = [5, 11, 12];
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
            'product_id',
            'job_id',
            [
              this.modals.sequelize.literal('"product"."main_category_id"'),
              'main_category_id'],
            'user_id',
            'document_number',
            [
              this.modals.sequelize.literal('"product"."product_name"'),
              'product_name'],
            [
              'renewal_cost',
              'value'],
            [
              'renewal_taxes',
              'taxes'],
            'effective_date',
            'expiry_date',
            'document_date',
            'updated_at',
            [
              this.modals.sequelize.fn('CONCAT', 'products/',
                  this.modals.sequelize.literal('"product_id"')),
              'product_url'],
            'copies'],
          order: [['document_date', 'DESC']],
        }).then(function(pucResult) {
          return pucResult.map(function(item) {
            return item.toJSON();
          }).sort(sortAmcWarrantyInsurancePUC);
        });
      },
    }, {
      key: 'retrievePUCCount',
      value: function retrievePUCCount(options) {
        options.status_type = [5, 11, 12];
        var productOptions = options.product_status_type ? {
          status_type: options.product_status_type,
        } : undefined;
        options = _lodash2.default.omit(options, 'category_id');
        options = _lodash2.default.omit(options, 'main_category_id');
        options = _lodash2.default.omit(options, 'product_status_type');
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
            [
              this.modals.sequelize.literal('COUNT(*)'),
              'product_counts'],
            [
              this.modals.sequelize.literal('"product"."main_category_id"'),
              'main_category_id'],
            [
              this.modals.sequelize.literal('max("pucs"."updated_at")'),
              'last_updated_at']],
          group: this.modals.sequelize.literal('"product"."main_category_id"'),
        }).then(function(pucResult) {
          return pucResult.map(function(item) {
            return item.toJSON();
          });
        });
      },
    }, {
      key: 'createPUCs',
      value: function createPUCs(values) {
        return this.modals.pucs.create(values).then(function(result) {
          return result.toJSON();
        });
      },
    }, {
      key: 'updatePUCs',
      value: function updatePUCs(id, values) {
        return this.modals.pucs.findOne({
          where: {
            id: id,
          },
        }).then(function(result) {
          result.updateAttributes(values);
          return result.toJSON();
        });
      },
    }]);

  return PUCAdaptor;
}();

exports.default = PUCAdaptor;