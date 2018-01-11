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

var sortAmcWarrantyInsuranceRepair = function sortAmcWarrantyInsuranceRepair(
    a, b) {
  var aDate = void 0;
  var bDate = void 0;

  aDate = a.expiry_date;
  bDate = b.expiry_date;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

var RepairAdaptor = function() {
  function RepairAdaptor(modals) {
    _classCallCheck(this, RepairAdaptor);

    this.modals = modals;
  }

  _createClass(RepairAdaptor, [
    {
      key: 'retrieveRepairs',
      value: function retrieveRepairs(options) {
        options.status_type = [5, 11];
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

        return this.modals.repairs.findAll({
          where: options,
          include: [
            {
              model: this.modals.onlineSellers,
              as: 'onlineSellers',
              attributes: [
                [
                  'sid',
                  'id'],
                'seller_name',
                'url',
                'contact',
                'email'],
              required: false,
            }, {
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
              'repair_cost',
              'value'],
            [
              'repair_taxes',
              'taxes'],
            'document_date',
            'updated_at',
            [
              this.modals.sequelize.fn('CONCAT', 'products/',
                  this.modals.sequelize.literal('"product_id"')),
              'product_url'],
            'copies'],
          order: [['document_date', 'DESC']],
        }).then(function(repairResult) {
          return repairResult.map(function(item) {
            var productItem = item.toJSON();

            productItem.copies = productItem.copies.map(function(copyItem) {
              copyItem.copy_id = copyItem.copy_id || copyItem.copyId;
              copyItem.copy_url = copyItem.copy_url || copyItem.copyUrl;
              copyItem = _lodash2.default.omit(copyItem, 'copyId');
              copyItem = _lodash2.default.omit(copyItem, 'copyUrl');
              return copyItem;
            });
            return productItem;
          }).sort(sortAmcWarrantyInsuranceRepair);
        });
      },
    }, {
      key: 'retrieveNotificationRepairs',
      value: function retrieveNotificationRepairs(options) {
        options.status_type = [5, 11];
        return this.modals.repairs.findAll({
          where: options,
          include: [
            {
              model: this.modals.products,
              attributes: [],
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
              'repair_cost',
              'value'],
            [
              'repair_taxes',
              'taxes'],
            'document_date',
            'updated_at',
            [
              this.modals.sequelize.fn('CONCAT', 'products/',
                  this.modals.sequelize.literal('"product_id"')),
              'product_url'],
            'copies'],
          order: [['document_date', 'DESC']],
        }).then(function(repairResult) {
          return repairResult.map(function(item) {
            return item.toJSON();
          }).sort(sortAmcWarrantyInsuranceRepair);
        });
      },
    }, {
      key: 'retrieveRepairCount',
      value: function retrieveRepairCount(options) {
        options.status_type = [5, 11];
        var productOptions = options.product_status_type ? {
          status_type: options.product_status_type,
        } : undefined;
        options = _lodash2.default.omit(options, 'category_id');
        options = _lodash2.default.omit(options, 'main_category_id');
        options = _lodash2.default.omit(options, 'product_status_type');
        return this.modals.repairs.findAll({
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
              this.modals.sequelize.literal('max("repairs"."updated_at")'),
              'last_updated_at']],
          group: this.modals.sequelize.literal('"product"."main_category_id"'),
        }).then(function(repairResult) {
          return repairResult.map(function(item) {
            return item.toJSON();
          });
        });
      },
    }, {
      key: 'createRepairs',
      value: function createRepairs(values) {
        return this.modals.repairs.create(values).then(function(result) {
          return result.toJSON();
        });
      },
    }, {
      key: 'updateRepairs',
      value: function updateRepairs(id, values) {
        return this.modals.repairs.findOne({
          where: {
            id: id,
          },
        }).then(function(result) {
          result.updateAttributes(values);
          return result.toJSON();
        });
      },
    }]);

  return RepairAdaptor;
}();

exports.default = RepairAdaptor;