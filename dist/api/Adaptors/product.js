/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _brands = require('./brands');

var _brands2 = _interopRequireDefault(_brands);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

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

var ProductAdaptor = function () {
  function ProductAdaptor(modals) {
    _classCallCheck(this, ProductAdaptor);

    this.modals = modals;
    this.brandAdaptor = new _brands2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
  }

  _createClass(ProductAdaptor, [{
    key: 'retrieveProducts',
    value: function retrieveProducts(options) {
      var _this = this;

      if (!options.status_type) {
        options.status_type = [5, 11];
      }

      var billOption = {};
      if (options.status_type === 8) {
        billOption.status_type = 5;
      }

      if (options.online_seller_id) {
        billOption.seller_id = options.online_seller_id;
      }
      options = _lodash2.default.omit(options, 'online_seller_id');

      var inProgressProductOption = {};
      _lodash2.default.assignIn(inProgressProductOption, options);
      options = _lodash2.default.omit(options, 'product_status_type');
      if (!inProgressProductOption.product_name) {
        inProgressProductOption = _lodash2.default.omit(options,
            'product_name');
      }
      if (!inProgressProductOption.brand_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'brand_id');
      }
      if (!inProgressProductOption.seller_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'seller_id');
      }
      if (!inProgressProductOption.online_seller_id) {
        inProgressProductOption = _lodash2.default.omit(options,
            'online_seller_id');
      }

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        include: [{
          model: this.modals.brands,
          as: 'brand',
          attributes: [
            [
              'brand_id',
              'brandId'],
            [
              'brand_name',
              'name'],
            [
              'brand_description',
              'description'],
            [
              this.modals.sequelize.fn('CONCAT', 'brands/',
                  this.modals.sequelize.col('"brand"."brand_id"'), '/reviews'),
              'reviewUrl']],
          required: false
        }, {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false
        }, {
          model: this.modals.bills,
          where: billOption,
          attributes: [
            [
              'consumer_name',
              'consumerName'],
            [
              'consumer_email',
              'consumerEmail'],
            [
              'consumer_phone_no',
              'consumerPhoneNo'],
            [
              'document_number',
              'invoiceNo']],
          include: [{
            model: this.modals.onlineSellers,
            as: 'sellers',
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
              'email',
              [
                this.modals.sequelize.fn('CONCAT', 'sellers/',
                    this.modals.sequelize.literal('"bill->sellers"."sid"'),
                    '/reviews?isonlineseller=true'),
                'reviewUrl']],
            include: [
              {
                model: this.modals.sellerReviews,
                as: 'sellerReviews',
                attributes: [
                  [
                    'review_ratings',
                    'ratings'],
                  [
                    'review_feedback',
                    'feedback'],
                  [
                    'review_comments',
                    'comments']],
                required: false,
              }],
            required: false
          }],
          required: options.status_type === 8,
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
            'longitude',
            [
              this.modals.sequelize.fn('CONCAT', 'sellers/',
                  this.modals.sequelize.literal('"sellers"."sid"'),
                  '/reviews?isonlineseller=false'),
              'reviewUrl']],
          include: [
            {
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [
                [
                  'review_ratings',
                  'ratings'],
                [
                  'review_feedback',
                  'feedback'],
                [
                  'review_comments',
                  'comments']],
              required: false,
            }],
          required: false,
        }, {
          model: this.modals.productReviews,
          as: 'productReviews',
          attributes: [
            [
              'review_ratings',
              'ratings'],
            [
              'review_feedback',
              'feedback'],
            [
              'review_comments',
              'comments']],
          required: false,
        }, {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false
        }],
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          [
            this.modals.sequelize.literal('"category"."category_id"'),
            'categoryId'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            'brand_id',
            'brandId'],
          [
            'colour_id',
            'colorId'],
          [
            'purchase_cost',
            'value'],
          'taxes',
          [
            this.modals.sequelize.fn('CONCAT', '/categories/',
                this.modals.sequelize.literal('"category"."category_id"'),
                '/images/'),
            'cImageURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"')),
            'productURL'],
          [
            'document_date',
            'purchaseDate'],
          [
            'document_number',
            'documentNo'],
          [
            'updated_at',
            'updatedDate'],
          [
            'bill_id',
            'billId'],
          [
            'job_id',
            'jobId'],
          [
            'seller_id',
            'sellerId'],
          'copies',
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"'), '/reviews'),
            'reviewUrl'],
          [
            this.modals.sequelize.literal('"category"."category_name"'),
            'categoryName'],
          [
            this.modals.sequelize.fn('CONCAT',
                '/consumer/servicecenters?brandid=',
                this.modals.sequelize.literal('"products"."brand_id"'),
                '&categoryid=',
                this.modals.sequelize.col('"products"."category_id"')),
            'serviceCenterUrl'],
          'status_type'],
      }).then(function (productResult) {
        products = productResult.map(function (item) {
          return item.toJSON();
        });
        inProgressProductOption = _lodash2.default.omit(inProgressProductOption,
            'product_name');
        inProgressProductOption.status_type = 5;
        inProgressProductOption.product_status_type = options.status_type;
        if (products.length > 0) {
          inProgressProductOption.product_id = products.map(function(item) {
            return item.id;
          });
          return Promise.all([
            _this.retrieveProductMetadata({
              product_id: {
                $in: products.map(function(item) {
                  return item.id;
                }),
              },
            }),
            _this.insuranceAdaptor.retrieveInsurances(inProgressProductOption),
            _this.warrantyAdaptor.retrieveWarranties(inProgressProductOption),
            _this.amcAdaptor.retrieveAMCs(inProgressProductOption),
            _this.repairAdaptor.retrieveRepairs(inProgressProductOption)]);
        }
        return undefined;
      }).then(function(results) {
        if (results) {
          var metaData = results[0];
          products = products.map(function(productItem) {
            productItem.productMetaData = metaData.filter(function(item) {
              return item.productId === productItem.id;
            });
            productItem.insuranceDetails = results[1].filter(function(item) {
              return item.productId === productItem.id;
            });
            productItem.warrantyDetails = results[2].filter(function(item) {
              return item.productId === productItem.id;
            });
            productItem.amcDetails = results[3].filter(function(item) {
              return item.productId === productItem.id;
            });
            productItem.repairBills = results[4].filter(function(item) {
              return item.productId === productItem.id;
            });

            productItem.requiredCount = productItem.insuranceDetails.length +
                productItem.warrantyDetails.length +
                productItem.amcDetails.length + productItem.repairBills.length;

            return productItem;
          });
        }

        return products;
      });
    }
  }, {
    key: 'retrieveUsersLastProduct',
    value: function retrieveUsersLastProduct(options) {
      var _this2 = this;

      var billOption = {};

      if (options.online_seller_id) {
        billOption.seller_id = options.online_seller_id;
      }
      options = _lodash2.default.omit(options, 'online_seller_id');

      var inProgressProductOption = {};
      _lodash2.default.assignIn(inProgressProductOption, options);
      options = _lodash2.default.omit(options, 'product_status_type');
      if (!inProgressProductOption.product_name) {
        inProgressProductOption = _lodash2.default.omit(options,
            'product_name');
      }
      if (!inProgressProductOption.brand_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'brand_id');
      }
      if (!inProgressProductOption.seller_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'seller_id');
      }
      if (!inProgressProductOption.online_seller_id) {
        inProgressProductOption = _lodash2.default.omit(options,
            'online_seller_id');
      }

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        include: [
          {
            model: this.modals.brands,
            as: 'brand',
            attributes: [
              [
                'brand_id',
                'brandId'],
              [
                'brand_name',
                'name'],
              [
                'brand_description',
                'description'],
              [
                this.modals.sequelize.fn('CONCAT', 'brands/',
                    this.modals.sequelize.col('"brand"."brand_id"'),
                    '/reviews'),
                'reviewUrl']],
            required: false,
          }, {
            model: this.modals.colours,
            as: 'color',
            attributes: [
              [
                'colour_id',
                'colorId'],
              [
                'colour_name',
                'colorName']],
            required: false,
          }, {
            model: this.modals.bills,
            where: billOption,
            attributes: [
              [
                'consumer_name',
                'consumerName'],
              [
                'consumer_email',
                'consumerEmail'],
              [
                'consumer_phone_no',
                'consumerPhoneNo'],
              [
                'document_number',
                'invoiceNo'],
              [
                'status_type',
                'billStatus']],
            include: [
              {
                model: this.modals.onlineSellers,
                as: 'sellers',
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
                  'email',
                  [
                    this.modals.sequelize.fn('CONCAT', 'sellers/',
                        this.modals.sequelize.literal('"bill->sellers"."sid"'),
                        '/reviews?isonlineseller=true'),
                    'reviewUrl']],
                include: [
                  {
                    model: this.modals.sellerReviews,
                    as: 'sellerReviews',
                    attributes: [
                      [
                        'review_ratings',
                        'ratings'],
                      [
                        'review_feedback',
                        'feedback'],
                      [
                        'review_comments',
                        'comments']],
                    required: false,
                  }],
                required: false,
              }],
            required: options.status_type === 8,
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
              'longitude',
              [
                this.modals.sequelize.fn('CONCAT', 'sellers/',
                    this.modals.sequelize.literal('"sellers"."sid"'),
                    '/reviews?isonlineseller=false'),
                'reviewUrl']],
            include: [
              {
                model: this.modals.sellerReviews,
                as: 'sellerReviews',
                attributes: [
                  [
                    'review_ratings',
                    'ratings'],
                  [
                    'review_feedback',
                    'feedback'],
                  [
                    'review_comments',
                    'comments']],
                required: false,
              }],
            required: false,
          }, {
            model: this.modals.productReviews,
            as: 'productReviews',
            attributes: [
              [
                'review_ratings',
                'ratings'],
              [
                'review_feedback',
                'feedback'],
              [
                'review_comments',
                'comments']],
            required: false,
          }],
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          [
            'category_id',
            'categoryId'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            'brand_id',
            'brandId'],
          [
            'colour_id',
            'colorId'],
          [
            'purchase_cost',
            'value'],
          'taxes',
          [
            this.modals.sequelize.fn('CONCAT', '/categories/',
                this.modals.sequelize.col('category_id'), '/images/'),
            'cImageURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"')),
            'productURL'],
          [
            'document_date',
            'purchaseDate'],
          [
            'document_number',
            'documentNo'],
          [
            'updated_at',
            'updatedDate'],
          [
            'bill_id',
            'billId'],
          [
            'job_id',
            'jobId'],
          [
            'seller_id',
            'sellerId'],
          'copies',
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"'), '/reviews'),
            'reviewUrl'],
          [
            this.modals.sequelize.fn('CONCAT',
                '/consumer/servicecenters?brandid=',
                this.modals.sequelize.literal('"products"."brand_id"'),
                '&categoryid=',
                this.modals.sequelize.col('"products"."category_id"')),
            'serviceCenterUrl'],
          'updated_at',
          'status_type'],
        order: [['updated_at', 'DESC']],
      }).then(function(productResult) {
        products = productResult.length > 0 ?
            productResult[0].toJSON() :
            undefined;
        inProgressProductOption = _lodash2.default.omit(inProgressProductOption,
            'product_name');
        inProgressProductOption.status_type = 5;
        inProgressProductOption.product_status_type = options.status_type;
        if (products) {
          inProgressProductOption.product_id = products.id;

          return Promise.all([
            _this2.retrieveProductMetadata({
              product_id: {
                $in: products.id,
              },
            }),
            _this2.insuranceAdaptor.retrieveInsurances(inProgressProductOption),
            _this2.warrantyAdaptor.retrieveWarranties(inProgressProductOption),
            _this2.amcAdaptor.retrieveAMCs(inProgressProductOption),
            _this2.repairAdaptor.retrieveRepairs(inProgressProductOption)]);
        }
        return undefined;
      }).then(function(results) {
        if (results) {
          var metaData = results[0];
          products.productMetaData = metaData.filter(function(item) {
            return item.productId === products.id;
          });
          products.insuranceDetails = results[1].filter(function(item) {
            return item.productId === products.id;
          });
          products.warrantyDetails = results[2].filter(function(item) {
            return item.productId === products.id;
          });
          products.amcDetails = results[3].filter(function(item) {
            return item.productId === products.id;
          });
          products.repairBills = results[4].filter(function(item) {
            return item.productId === products.id;
          });

          products.requiredCount = products.insuranceDetails.length +
              products.warrantyDetails.length + products.amcDetails.length +
              products.repairBills.length;
        }

        return options.status_type && options.status_type === 8 ?
            products.filter(function(item) {
              return item.requiredCount > 0;
            }) :
            products;
      });
    }
  }, {
    key: 'retrieveProductIds',
    value: function retrieveProductIds(options) {
      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9],
        };
      }

      var billOption = {
        status_type: 5,
      };

      if (options.online_seller_id) {
        billOption.seller_id = options.online_seller_id;
      }

      options = _lodash2.default.omit(options, 'online_seller_id');
      options = _lodash2.default.omit(options, 'product_status_type');

      return this.modals.products.findAll({
        where: options,
        include: [
          {
            model: this.modals.bills,
            where: billOption,
            include: [
              {
                model: this.modals.onlineSellers,
                as: 'sellers',
                attributes: [],
                required: false,
          }],
            attributes: [],
            required: true,
          }],
        attributes: ['id'],
      }).then(function (productResult) {
        return productResult.map(function(item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveProductCounts',
    value: function retrieveProductCounts(options) {
      var _this3 = this;

      if (!options.status_type) {
        options.status_type = [5, 11];
      }

      var billOption = {};
      if (options.status_type === 8) {
        billOption.status_type = 5;
      }

      var inProgressProductOption = {};
      _lodash2.default.assignIn(inProgressProductOption, options);
      var productResult = void 0;
      options = _lodash2.default.omit(options, 'product_status_type');
      return this.modals.products.findAll({
        where: options,
        include: [
          {
            model: this.modals.bills,
            where: billOption,
            attributes: [],
            required: options.status_type === 8,
          }],
        attributes: [
          [
            this.modals.sequelize.literal('COUNT(*)'),
            'productCounts'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            this.modals.sequelize.literal('max("products"."updated_at")'),
            'lastUpdatedAt']],
        group: 'main_category_id',
      }).then(function (productItems) {
        productResult = productItems.map(function(item) {
          return item.toJSON();
        });
        inProgressProductOption.status_type = 5;
        inProgressProductOption.product_status_type = options.status_type;
        return Promise.all([
          _this3.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
          _this3.insuranceAdaptor.retrieveInsuranceCount(
              inProgressProductOption),
          _this3.warrantyAdaptor.retrieveWarrantyCount(inProgressProductOption),
          _this3.repairAdaptor.retrieveRepairCount(inProgressProductOption)]);
      }).then(function (results) {
        if (options.status_type !== 8) {
          return productResult;
        }
        var availableResult = [].concat(_toConsumableArray(results[0]),
            _toConsumableArray(results[1]), _toConsumableArray(results[2]),
            _toConsumableArray(results[3]));

        return productResult.filter(function(item) {
          return availableResult.filter(function(availResult) {
            return availResult.masterCategoryId === item.masterCategoryId;
          }).length > 0;
        });
      });
    }
  }, {
    key: 'retrieveProductById',
    value: function retrieveProductById(id, options) {
      var _this4 = this;

      options.status_type = {
        $notIn: [3, 9],
      };

      var products = void 0;
      return this.modals.products.findById(id, {
        where: options,
        include: [
          {
            model: this.modals.colours,
            as: 'color',
            attributes: [
              [
                'colour_id',
                'colorId'],
              [
                'colour_name',
                'colorName']],
            required: false,
          }, {
            model: this.modals.bills,
            attributes: [
              [
                'consumer_name',
                'consumerName'],
              [
                'consumer_email',
                'consumerEmail'],
              [
                'consumer_phone_no',
                'consumerPhoneNo'],
              [
                'document_number',
                'invoiceNo']],
            include: [
              {
                model: this.modals.onlineSellers,
                as: 'sellers',
                attributes: [
                  [
                    'seller_name',
                    'sellerName'],
                  'url',
                  'gstin',
                  'contact',
                  'email',
                  [
                    this.modals.sequelize.fn('CONCAT', 'sellers/',
                        this.modals.sequelize.literal('"bill->sellers"."sid"'),
                        '/reviews?isonlineseller=true'),
                    'reviewUrl']],
                include: [
                  {
                    model: this.modals.sellerReviews,
                    as: 'sellerReviews',
                    attributes: [
                      [
                        'review_ratings',
                        'ratings'],
                      [
                        'review_feedback',
                        'feedback'],
                      [
                        'review_comments',
                        'comments']],
                    required: false,
                  }],
                required: false,
              }],
            required: false,
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
              'longitude',
              [
                this.modals.sequelize.fn('CONCAT', 'sellers/',
                    this.modals.sequelize.literal('"sellers"."sid"'),
                    '/reviews?isonlineseller=false'),
                'reviewUrl']],
            include: [
              {
                model: this.modals.sellerReviews,
                as: 'sellerReviews',
                attributes: [
                  [
                    'review_ratings',
                    'ratings'],
                  [
                    'review_feedback',
                    'feedback'],
                  [
                    'review_comments',
                    'comments']],
                required: false,
          }],
            required: false,
          }, {
            model: this.modals.productReviews,
            as: 'productReviews',
            attributes: [
              [
                'review_ratings',
                'ratings'],
              [
                'review_feedback',
                'feedback'],
              [
                'review_comments',
                'comments']],
            required: false,
          }, {
            model: this.modals.categories,
            as: 'category',
            attributes: [],
            required: false,
          }, {
            model: this.modals.categories,
            as: 'mainCategory',
            attributes: [],
            required: false,
          }],
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          [
            this.modals.sequelize.literal('"category"."category_id"'),
            'categoryId'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            'brand_id',
            'brandId'],
          [
            'colour_id',
            'colorId'],
          [
            'purchase_cost',
            'value'],
          [
            this.modals.sequelize.literal('"category"."category_name"'),
            'categoryName'],
          [
            this.modals.sequelize.literal('"mainCategory"."category_name"'),
            'masterCategoryName'],
          'taxes',
          [
            this.modals.sequelize.fn('CONCAT', '/categories/',
                this.modals.sequelize.col('"category"."category_id"'),
                '/images/'),
            'cImageURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"')),
            'productURL'],
          [
            'document_date',
            'purchaseDate'],
          [
            'document_number',
            'documentNo'],
          [
            'updated_at',
            'updatedDate'],
          [
            'bill_id',
            'billId'],
          [
            'job_id',
            'jobId'],
          [
            'seller_id',
            'sellerId'],
          [
            'updated_at',
            'updatedDate'],
          'copies',
          'status_type',
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"'), '/reviews'),
            'reviewUrl'],
          [
            this.modals.sequelize.fn('CONCAT',
                '/consumer/servicecenters?brandid=',
                this.modals.sequelize.literal('"products"."brand_id"'),
                '&categoryid=',
                this.modals.sequelize.col('"products"."category_id"')),
            'serviceCenterUrl']],
      }).then(function (productResult) {
        products = productResult ? productResult.toJSON() : productResult;
        if (products) {
          return Promise.all([
            _this4.retrieveProductMetadata({
              product_id: products.id,
            }), _this4.brandAdaptor.retrieveBrandById(products.brandId, {
              category_id: products.categoryId,
            }), _this4.insuranceAdaptor.retrieveInsurances({
              product_id: products.id,
            }), _this4.warrantyAdaptor.retrieveWarranties({
              product_id: products.id,
            }), _this4.amcAdaptor.retrieveAMCs({
              product_id: products.id,
            }), _this4.repairAdaptor.retrieveRepairs({
              product_id: products.id,
            })]);
        }
      }).then(function (results) {
        if (products) {
          products.metaData = results[0];
          products.brand = results[1];
          products.insuranceDetails = results[2];
          products.warrantyDetails = results[3];
          products.amcDetails = results[4];
          products.repairBills = results[5];
        }

        return products;
      });
    }
  }, {
    key: 'createProduct',
    value: function createProduct(productBody, metadataBody) {
      var _this5 = this;

      var brandPromise = productBody.brand_name ?
          this.modals.brands.findCreateFind({
            where: {
              brand_name: {
                $iLike: productBody.brand_name,
              },
              updated_by: productBody.user_id,
            },
            defaults: {
              brand_name: productBody.brand_name,
              updated_by: productBody.user_id,
              status_type: 11,
            },
          }) :
          '';
      console.log({
        metadataBody: metadataBody,
      });
      var dropDownPromise = metadataBody.map(function(item) {
        if (item.new_drop_down) {
          console.log({
            testMetadata: {
              title: {
                $iLike: item.form_value.toLowerCase(),
              },
              category_form_id: item.category_form_id,
              category_id: productBody.category_id,
              brand_id: productBody.brand_id,
            }
          });
          return _this5.modals.brandDropDown.findCreateFind({
            where: {
              title: {
                $iLike: item.form_value.toLowerCase(),
              },
              category_form_id: item.category_form_id,
              category_id: productBody.category_id,
              brand_id: productBody.brand_id,
            },
            defaults: {
              title: item.form_value,
              category_form_id: item.category_form_id,
              category_id: productBody.category_id,
              brand_id: productBody.brand_id,
              updated_by: item.updated_by,
              created_by: item.created_by,
              status_type: 11,
            }
          });
        }

        return '';
      });

      return Promise.all(
          [].concat(_toConsumableArray(dropDownPromise), [brandPromise])).
          then(function(newItemResult) {
            var product = productBody;
            var newBrand = productBody.brand_name ?
                newItemResult[newItemResult.length - 1][0] :
                undefined;
            product.brand_id = newBrand ? newBrand.brand_id : product.brand_id;
            product = !product.colour_id ?
                _lodash2.default.omit(product, 'colour_id') :
                product;
            product = !product.purchase_cost ?
                _lodash2.default.omit(product, 'purchase_cost') :
                product;
            product = !product.taxes ?
                _lodash2.default.omit(product, 'taxes') :
                product;
            product = !product.document_number ?
                _lodash2.default.omit(product, 'document_number') :
                product;
            product = !product.document_date ?
                _lodash2.default.omit(product, 'document_date') :
                product;
            product = !product.seller_id ?
                _lodash2.default.omit(product, 'seller_id') :
                product;
            var metadata = metadataBody.map(function(mdItem) {
          mdItem = _lodash2.default.omit(mdItem, 'new_drop_down');
          return mdItem;
        });
            return _this5.modals.products.count({
          where: product,
              include: [
                {
                  model: _this5.modals.metaData, where: {
                    $and: metadata,
                  }, required: true, as: 'metaData',
                }],
        }).then(function (count) {
          if (count === 0) {
            return _this5.modals.products.create(product);
          }

          return undefined;
        }).then(function (productResult) {
          if (productResult) {
            product = productResult.toJSON();
            var metadataPromise = metadata.map(function(mdItem) {
              mdItem.product_id = product.id;
              mdItem.status_type = 8;

              return _this5.modals.metaData.create(mdItem);
            });

            return Promise.all(metadataPromise);
          }

          return undefined;
        }).then(function (metaData) {
          if (metaData) {
            product.metaData = metaData.map(function(mdItem) {
              return mdItem.toJSON();
            });
            return product;
          }

          return undefined;
        });
      });
    }
  }, {
    key: 'retrieveProductMetadata',
    value: function retrieveProductMetadata(options) {
      options.status_type = {
        $notIn: [3, 9]
      };

      return this.modals.metaData.findAll({
        where: options,
        include: [{
          model: this.modals.categoryForms,
          as: 'categoryForm',
          attributes: []
        }, {
          model: this.modals.dropDowns,
          as: 'dropDown',
          where: {
            $and: [
              this.modals.sequelize.where(
                  this.modals.sequelize.literal('"categoryForm"."form_type"'),
                  2)],
          },
          attributes: ['id', 'title'],
          required: false
        }],

        attributes: [
          [
            'product_id',
            'productId'],
          [
            'form_value',
            'value'],
          [
            'category_form_id',
            'categoryFormId'],
          [
            this.modals.sequelize.literal('"categoryForm"."form_type"'),
            'formType'],
          [
            this.modals.sequelize.literal('"categoryForm"."title"'),
            'name'],
          [
            this.modals.sequelize.literal('"categoryForm"."display_index"'),
            'displayIndex']],
      }).then(function (metaData) {
        var unOrderedMetaData = metaData.map(function (item) {
          var metaDataItem = item.toJSON();
          if (metaData.formType === 2 && metaDataItem.value) {
            var dropDown = metaDataItem.dropDown.find(function(item) {
              return item.id === parseInt(metaDataItem.value);
            });
            metaDataItem.value = dropDown ? dropDown.title : metaDataItem.value;
          }

          return metaDataItem;
        });

        unOrderedMetaData.sort(function (itemA, itemB) {
          return itemA.displayIndex - itemB.displayIndex;
        });

        return unOrderedMetaData;
      });
    }
  }, {
    key: 'updateBrandReview',
    value: function updateBrandReview(user, brandId, request) {
      var payload = request.payload;
      return this.modals.brandReviews.findCreateFind({
        where: {
          user_id: user.id,
          brand_id: brandId,
          status_id: 1,
        },
        defaults: {
          user_id: user.id,
          brand_id: brandId,
          status_id: 1,
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        }
      }).then(function (result) {
        if (!result[1]) {
          result[0].updateAttributes({
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments
          });
        }

        return {
          status: true,
          message: 'Review Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: true,
          message: 'Review Update Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'updateSellerReview',
    value: function updateSellerReview(user, sellerId, isOnlineSeller, request) {
      var payload = request.payload;
      var whereClause = isOnlineSeller ? {
        user_id: user.id,
        seller_id: sellerId,
        status_id: 1,
      } : {
        user_id: user.id,
        offline_seller_id: sellerId,
        status_id: 1,
      };

      var defaultClause = isOnlineSeller ? {
        user_id: user.id,
        seller_id: sellerId,
        status_id: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      } : {
        user_id: user.id,
        offline_seller_id: sellerId,
        status_id: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      };

      return this.modals.sellerReviews.findCreateFind({
        where: whereClause,
        defaults: defaultClause
      }).then(function (result) {
        if (!result[1]) {
          result[0].updateAttributes({
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments
          });
        }

        return {
          status: true,
          message: 'Review Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: true,
          message: 'Review Update Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'updateProductReview',
    value: function updateProductReview(user, productId, request) {
      var payload = request.payload;
      var whereClause = {
        user_id: user.id,
        bill_product_id: productId,
        status_id: 1,
      };

      return this.modals.productReviews.findCreateFind({
        where: whereClause,
        defaults: {
          user_id: user.id,
          bill_product_id: productId,
          status_id: 1,
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        }
      }).then(function (result) {
        if (!result[1]) {
          result[0].updateAttributes({
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments
          });
        }

        return {
          status: true,
          message: 'Review Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: true,
          message: 'Review Update Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'retrieveNotificationProducts',
    value: function retrieveNotificationProducts(options) {
      var _this6 = this;

      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9],
        };
      }

      var billOption = {
        status_type: 5,
      };

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        include: [
          {
            model: this.modals.bills,
            where: billOption,
            required: true,
          }],
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          [
            'purchase_cost',
            'value'],
          [
            'main_category_id',
            'masterCategoryId'],
          'taxes',
          [
            'document_date',
            'purchaseDate'],
          [
            'document_number',
            'documentNo'],
          [
            'updated_at',
            'updatedDate'],
          [
            'bill_id',
            'billId'],
          [
            'job_id',
            'jobId'],
          'copies',
          'user_id'],
      }).then(function (productResult) {
        products = productResult.map(function(item) {
          return item.toJSON();
        });
        return _this6.retrieveProductMetadata({
          product_id: {
            $in: products.map(function(item) {
              return item.id;
            })
          }
        });
      }).then(function (results) {
        var metaData = results;

        products = products.map(function(productItem) {
          productItem.productMetaData = metaData.filter(function(item) {
            return item.productId === productItem.id;
          });

          return productItem;
        });

        return products;
      });
    }
  }, {
    key: 'retrieveMissingDocProducts',
    value: function retrieveMissingDocProducts(options) {
      var _this7 = this;

      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9],
        };
      }

      var billOption = {
        status_type: 5,
      };

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          [
            'purchase_cost',
            'value'],
          [
            'main_category_id',
            'masterCategoryId'],
          'taxes',
          [
            'document_date',
            'purchaseDate'],
          [
            'document_number',
            'documentNo'],
          [
            'updated_at',
            'updatedDate'],
          [
            'bill_id',
            'billId'],
          [
            'job_id',
            'jobId'],
          'copies',
          'user_id'],
      }).then(function (productResult) {
        products = productResult.map(function(item) {
          var product = item.toJSON();
          product.hasDocs = product.copies.length > 0;
          return product;
        });
        return Promise.all([
          _this7.insuranceAdaptor.retrieveInsurances({
            product_id: {
              $in: products.filter(function(item) {
                return item.masterCategoryId === 2 || item.masterCategoryId ===
                    3;
              }).map(function(item) {
                return item.id;
              }),
            },
          }), _this7.warrantyAdaptor.retrieveWarranties({
            product_id: {
              $in: products.filter(function(item) {
                return item.masterCategoryId === 2 || item.masterCategoryId ===
                    3;
              }).map(function(item) {
                return item.id;
              }),
            },
          })]);
      }).then(function (results) {
        var insurances = results[0];
        var warranties = results[1];

        products = products.map(function(productItem) {
          if (productItem.masterCategoryId === 2 ||
              productItem.masterCategoryId === 3) {
            productItem.hasInsurance = insurances.filter(function(item) {
              return item.productId === productItem.id;
            }).length > 0;

            productItem.hasWarranty = warranties.filter(function(item) {
              return item.productId === productItem.id;
            }).length > 0;
          }

          return productItem;
        });

        return products.filter(function(pItem) {
          return !pItem.hasDocs || pItem.hasInsurance && pItem.hasInsurance ===
              false || pItem.hasWarranty && pItem.hasWarranty === false;
        });
      });
    }
  }, {
    key: 'retrieveProductExpenses',
    value: function retrieveProductExpenses(options) {
      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9],
        };
      }

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          [
            'purchase_cost',
            'value'],
          [
            'main_category_id',
            'masterCategoryId'],
          'taxes',
          [
            'document_date',
            'purchaseDate'],
          [
            'document_number',
            'documentNo'],
          [
            'updated_at',
            'updatedDate'],
          [
            'bill_id',
            'billId'],
          [
            'job_id',
            'jobId'],
          'copies',
          'user_id'],
      }).then(function (productResult) {
        return productResult.map(function(item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'prepareProductDetail',
    value: function prepareProductDetail(user, request) {
      var productId = request.params.id;
      return this.retrieveProductById(productId, {
        where: {
          user_id: user.id,
          status_type: [5, 8, 11],
        }
      }).then(function (result) {
        if (result) {
          return {
            status: true,
            message: 'Successful',
            product: result,
            forceUpdate: request.pre.forceUpdate,
          };
        } else {
          return {
            status: false,
            product: {},
            message: 'No Data Found',
            forceUpdate: request.pre.forceUpdate
          };
        }
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: false,
          message: 'Unable to retrieve data',
          product: {},
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }]);

  return ProductAdaptor;
}();

exports.default = ProductAdaptor;