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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

var RepairAdaptor = function () {
  function RepairAdaptor(modals) {
    _classCallCheck(this, RepairAdaptor);

    this.modals = modals;
  }

  _createClass(RepairAdaptor, [{
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
        include: [{
          model: this.modals.onlineSellers,
          as: 'onlineSellers',
          attributes: [['sid', 'id'], ['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
          required: false
        }, {
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
        attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], 'user_id', ['document_number', 'policyNo'], ['repair_cost', 'premiumAmount'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['repair_cost', 'value'], ['repair_taxes', 'taxes'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], 'warranty_upto', 'repair_for', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies'],
        order: [['document_date', 'DESC']]
      }).then(function (repairResult) {
        return repairResult.map(function (item) {
          var productItem = item.toJSON();
          if (productItem.copies) {
            productItem.copies = productItem.copies.map(function (copyItem) {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }
          productItem.purchaseDate = _moment2.default.utc(productItem.purchaseDate, _moment2.default.ISO_8601).startOf('days');
          return productItem;
        }).sort(sortAmcWarrantyInsuranceRepair);
      });
    }
  }, {
    key: 'retrieveNotificationRepairs',
    value: function retrieveNotificationRepairs(options) {
      options.status_type = [5, 11];
      return this.modals.repairs.findAll({
        where: options,
        include: [{
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined
        }],
        attributes: ['id', ['product_id', 'productId'], ['job_id', 'jobId'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], 'user_id', ['document_number', 'policyNo'], ['repair_cost', 'premiumAmount'], [this.modals.sequelize.literal('"product"."product_name"'), 'productName'], ['repair_cost', 'value'], ['repair_taxes', 'taxes'], ['document_date', 'purchaseDate'], ['updated_at', 'updatedDate'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.literal('"product_id"')), 'productURL'], 'copies'],
        order: [['document_date', 'DESC']]
      }).then(function (repairResult) {
        return repairResult.map(function (item) {
          return item.toJSON();
        }).sort(sortAmcWarrantyInsuranceRepair);
      });
    }
  }, {
    key: 'retrieveRepairCount',
    value: function retrieveRepairCount(options) {
      options.status_type = [5, 11];
      var productOptions = options.product_status_type ? {
        status_type: options.product_status_type
      } : undefined;
      options = _lodash2.default.omit(options, 'category_id');
      options = _lodash2.default.omit(options, 'main_category_id');
      options = _lodash2.default.omit(options, 'product_status_type');
      return this.modals.repairs.findAll({
        where: options,
        include: [{
          model: this.modals.products,
          where: productOptions,
          attributes: [],
          required: productOptions !== undefined
        }],

        attributes: [[this.modals.sequelize.literal('COUNT(*)'), 'productCounts'], [this.modals.sequelize.literal('"product"."main_category_id"'), 'masterCategoryId'], [this.modals.sequelize.literal('max("repairs"."updated_at")'), 'lastUpdatedAt']],
        group: this.modals.sequelize.literal('"product"."main_category_id"')
      }).then(function (repairResult) {
        return repairResult.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'createRepairs',
    value: function createRepairs(values) {
      return this.modals.repairs.create(values).then(function (result) {
        return result.toJSON();
      });
    }
  }, {
    key: 'updateRepairs',
    value: function updateRepairs(id, values) {
      return this.modals.repairs.findOne({
        where: {
          id: id
        }
      }).then(function (result) {
        var itemDetail = result.toJSON();
        if (values.copies && values.copies.length > 0 && itemDetail.copies && itemDetail.copies.length > 0) {
          var _values$copies;

          var newCopies = values.copies;
          values.copies = itemDetail.copies;
          (_values$copies = values.copies).push.apply(_values$copies, _toConsumableArray(newCopies));
        }

        values.status_type = itemDetail.status_type !== 8 ? 11 : values.status_type || itemDetail.status_type;

        result.updateAttributes(values);
        return result.toJSON();
      });
    }
  }, {
    key: 'removeRepairs',
    value: function removeRepairs(id, copyId, values) {
      var _this = this;

      return this.modals.repairs.findOne({
        where: {
          id: id
        }
      }).then(function (result) {
        var itemDetail = result.toJSON();
        if (copyId && itemDetail.copies.length > 0) {
          values.copies = itemDetail.copies.filter(function (item) {
            return item.copyId !== parseInt(copyId);
          });

          result.updateAttributes(values);

          return result.toJSON();
        }

        return _this.modals.repairs.destroy({
          where: {
            id: id
          }
        }).then(function () {
          return true;
        });
      });
    }
  }, {
    key: 'deleteRepair',
    value: function deleteRepair(id, user_id) {
      var _this2 = this;

      return this.modals.repairs.findById(id).then(function (result) {
        if (result) {
          return Promise.all([_this2.modals.repairs.destroy({
            where: {
              id: id,
              user_id: user_id
            }
          }), result.copies && result.copies.length > 0 ? _this2.modals.jobCopies.update({
            status_type: 3,
            updated_by: user_id
          }, {
            where: {
              id: result.copies.map(function (item) {
                return item.copyId;
              })
            }
          }) : undefined]).then(function () {
            return true;
          });
        }

        return true;
      });
    }
  }]);

  return RepairAdaptor;
}();

exports.default = RepairAdaptor;