/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _serviceCenter = require('./serviceCenter');

var _serviceCenter2 = _interopRequireDefault(_serviceCenter);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var BrandAdaptor = function () {
  function BrandAdaptor(modals) {
    _classCallCheck(this, BrandAdaptor);

    this.modals = modals;
    this.serviceCenterAdaptor = new _serviceCenter2.default(modals);
  }

    _createClass(BrandAdaptor, [{
        key: 'retrieveBrands',
        value: function retrieveBrands(options) {
            options.status_type = 1;
            return this.modals.brands.findAll({
                where: options,
                attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description']]
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
                attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description']]
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
                    console.log(result[1][0]);
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
            return Promise.all([this.modals.brands.findById(id, {
                where: options,
                attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description'], [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('"brands"."brand_id"'), '/reviews'), 'reviewUrl']],
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
                    status_type: 1
                }, include: [{
                    model: this.modals.brandDetails,
                    where: {
                        status_type: 1,
                        category_id: options.category_id
                    },
                    attributes: [],
                    as: 'details',
                    required: true
                }],
                attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description'], [this.modals.sequelize.literal('"details"."category_id"'), 'categoryId']]
            }).then(function (result) {
                return result.map(function (item) {
                    return item.toJSON();
                });
            });
        }
    }]);

  return BrandAdaptor;
}();

exports.default = BrandAdaptor;