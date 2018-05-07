/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _serviceCenter = require('./serviceCenter');

var _serviceCenter2 = _interopRequireDefault(_serviceCenter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BrandAdaptor = function () {
  function BrandAdaptor(modals) {
    _classCallCheck(this, BrandAdaptor);

    this.modals = modals;
    this.serviceCenterAdaptor = new _serviceCenter2.default(modals);
  }

  _createClass(BrandAdaptor, [{
    key: 'retrieveBrands',
    value: function retrieveBrands(options) {
      options.status_type = [1, 11];
      return this.modals.brands.findAll({
        where: options,
        attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description']],
        order: [['brand_index', 'desc'], ['brand_name']]
      }).then(function (brandResult) {
        return brandResult.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveASCBrands',
    value: function retrieveASCBrands(options) {
      var _this = this;

      var brand = void 0;
      return this.modals.brands.findAll({
        where: {
          status_type: 1,
          brand_name: {
            $iLike: options.brand_name.toLowerCase() + '%'
          }
        },
        attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description']],
        order: [['brand_index', 'desc'], ['brand_name']]
      }).then(function (brandResults) {
        if (brandResults.length > 0) {
          brand = brandResults.map(function (item) {
            return item.toJSON();
          })[0];

          return Promise.all([_this.retrieveBrandDetails({
            status_type: 1,
            category_id: 327,
            brand_id: brand.id
          }), _this.serviceCenterAdaptor.retrieveServiceCenters({
            status_type: 1,
            category_id: 327,
            brand_id: brand.id
          })]);
        }

        return undefined;
      }).then(function (result) {
        if (result) {
          brand.details = result[0];
          brand.serviceCenters = result[1];

          return brand;
        }

        return undefined;
      });
    }
  }, {
    key: 'retrieveBrandById',
    value: function retrieveBrandById(id, options) {
      options.status_type = 1;
      var detailOptions = options;
      options = _lodash2.default.omit(options, 'category_id');
      detailOptions.brand_id = id;
      return Promise.all([this.modals.brands.findById(id, {
        where: options,
        attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description'], 'status_type', [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('"brands"."brand_id"'), '/reviews'), 'reviewUrl'], [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('"brands"."brand_id"'), '/images'), 'imageUrl']],
        include: [{
          model: this.modals.brandReviews,
          as: 'brandReviews',
          attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
          required: false
        }]
      }), this.retrieveBrandDetails(detailOptions)]).then(function (results) {
        var brand = results[0] ? results[0].toJSON() : results[0];
        if (brand) {
          brand.details = results[1];
        }

        return brand;
      });
    }
  }, {
    key: 'retrieveBrandDetails',
    value: function retrieveBrandDetails(options) {
      return this.modals.brandDetails.findAll({
        where: options,
        include: [{
          model: this.modals.detailTypes,
          attributes: []
        }],
        attributes: [[this.modals.sequelize.literal('"detailType"."type"'), 'typeId'], [this.modals.sequelize.literal('"detailType"."title"'), 'displayName'], ['value', 'details'], ['category_id', 'categoryId'], ['brand_id', 'brandId']]
      }).then(function (detailResult) {
        return detailResult.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveCategoryBrands',
    value: function retrieveCategoryBrands(options) {
      return this.modals.brands.findAll({
        where: {
          status_type: [1, 11]
        }, include: [{
          model: this.modals.brandDetails,
          where: {
            category_id: options.category_id
          },
          attributes: [],
          as: 'details',
          required: true
        }],
        attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description'], [this.modals.sequelize.literal('"details"."category_id"'), 'categoryId'], 'status_type', 'created_by', 'updated_by'],
        order: [['brand_index', 'desc'], ['brand_name']]
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveBrandDropDowns',
    value: function retrieveBrandDropDowns(options) {
      return this.modals.brandDropDown.findAll({
        where: options,
        order: [['title', 'asc']]
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'findCreateBrand',
    value: function findCreateBrand(values) {
      var _this2 = this;

      var brandData = void 0;
      var brandDetail = void 0;
      var category = void 0;
      return Promise.all([this.modals.brands.findOne({
        where: {
          brand_name: {
            $iLike: '' + values.brand_name
          }
        }
      }), this.modals.categories.findOne({
        where: {
          category_id: values.category_id
        }
      })]).then(function (result) {
        category = result[1].toJSON();
        if (result[0]) {
          brandData = result[0].toJSON();
          return _this2.modals.brandDetails.findOne({
            where: {
              brand_id: brandData.brand_id,
              category_id: values.category_id
            }
          });
        }

        return false;
      }).then(function (result) {
        if (!result) {
          return _this2.modals.brands.create({
            status_type: 11,
            brand_name: values.brand_name + '(' + category.category_name + ')',
            updated_by: values.updated_by,
            created_by: values.created_by
          });
        }

        brandDetail = result.toJSON();
        return brandData;
      }).then(function (updatedResult) {
        if (brandDetail) {
          brandData = updatedResult;
        } else {
          brandData = updatedResult.toJSON();
        }

        if (brandData.status_type === 11) {
          return _this2.modals.brandDetails.create({
            brand_id: brandData.brand_id,
            detail_type: 1,
            updated_by: values.updated_by,
            created_by: values.created_by,
            status_type: 11,
            category_id: values.category_id
          });
        }

        return undefined;
      }).then(function () {
        return brandData;
      });
    }
  }]);

  return BrandAdaptor;
}();

exports.default = BrandAdaptor;