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

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

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

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var ProductAdaptor = function() {
  function ProductAdaptor(modals) {
    _classCallCheck(this, ProductAdaptor);

    this.modals = modals;
    this.brandAdaptor = new _brands2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
    this.categoryAdaptor = new _category2.default(modals);
  }

  _createClass(ProductAdaptor, [
    {
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
          include: [
            {
              model: this.modals.brands,
              as: 'brand',
              attributes: [
                [
                  'brand_id',
                  'brandId'],
                [
                  'brand_id',
                  'id'],
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
                'seller_id'],
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
                          this.modals.sequelize.literal(
                              '"bill->sellers"."sid"'),
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
            }, {
              model: this.modals.categories,
              as: 'category',
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
          order: [['document_date', 'DESC']],
        }).then(function(productResult) {
          products = productResult.map(function(item) {
            return item.toJSON();
          });
          if (billOption.seller_id && billOption.seller_id.length > 0) {
            products = products.filter(function(item) {
              return item.bill && billOption.seller_id.find(function(sItem) {
                return parseInt(item.bill.seller_id) === parseInt(sItem);
              });
            });
          }
          inProgressProductOption = _lodash2.default.omit(
              inProgressProductOption, 'product_name');
          inProgressProductOption.status_type = [5, 12];
          inProgressProductOption.product_status_type = options.status_type;
          var warrantyOptions = {};
          _lodash2.default.assignIn(warrantyOptions, inProgressProductOption);
          warrantyOptions.warranty_type = [1, 2];
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
              _this.insuranceAdaptor.retrieveInsurances(
                  inProgressProductOption),
              _this.warrantyAdaptor.retrieveWarranties(warrantyOptions),
              _this.amcAdaptor.retrieveAMCs(inProgressProductOption),
              _this.repairAdaptor.retrieveRepairs(inProgressProductOption)]);
          }
          return undefined;
        }).then(function(results) {
          if (results) {
            var metaData = results[0];
            products = products.map(function(productItem) {
              var pucItem = metaData.find(function(item) {
                return item.name.toLowerCase().includes('puc');
              });
              if (pucItem) {
                productItem.pucDetail = {
                  expiry_date: pucItem.value,
                };
              }
              productItem.productMetaData = metaData.filter(function(item) {
                return item.productId === productItem.id &&
                    !item.name.toLowerCase().includes('puc');
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
                  productItem.amcDetails.length +
                  productItem.repairBills.length;

              return productItem;
            });
          }

          return products;
        });
      },
    }, {
      key: 'retrieveUsersLastProduct',
      value: function retrieveUsersLastProduct(options) {
        var _this2 = this;

        var billOption = {};

        if (options.online_seller_id) {
          billOption.seller_id = options.online_seller_id;
        } else {
          billOption = undefined;
        }
        options = _lodash2.default.omit(options, 'online_seller_id');

        options = _lodash2.default.omit(options, 'product_status_type');

        var product = void 0;
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
                  'brand_id',
                  'id'],
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
                          this.modals.sequelize.literal(
                              '"bill->sellers"."sid"'),
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
          var products = productResult.map(function(item) {
            return item.toJSON();
          }).filter(function(producItem) {
            return producItem.status_type !== 8 || producItem.status_type ===
                8 && producItem.bill && producItem.bill.billStatus === 5;
          });
          product = products.length > 0 ? products[0] : undefined;

          if (product) {
            return Promise.all([
              _this2.retrieveProductMetadata({
                product_id: product.id,
              }), _this2.insuranceAdaptor.retrieveInsurances({
                product_id: product.id,
              }), _this2.warrantyAdaptor.retrieveWarranties({
                product_id: product.id,
                warranty_type: [1, 2],
              }), _this2.amcAdaptor.retrieveAMCs({
                product_id: product.id,
              }), _this2.repairAdaptor.retrieveRepairs({
                product_id: product.id,
              })]);
          }

          return undefined;
        }).then(function(results) {
          if (results) {
            var metaData = results[0];
            var pucItem = metaData.find(function(item) {
              return item.name.toLowerCase().includes('puc');
            });
            if (pucItem) {
              product.pucDetail = {
                expiry_date: pucItem.value,
              };
            }
            product.metaData = metaData.filter(function(item) {
              return !item.name.toLowerCase().includes('puc');
            });
            product.insuranceDetails = results[1];
            product.warrantyDetails = results[2];
            product.amcDetails = results[3];
            product.repairBills = results[4];

            product.requiredCount = product.insuranceDetails.length +
                product.warrantyDetails.length + product.amcDetails.length +
                product.repairBills.length;
          }

          return product;
        });
      },
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
        }).then(function(productResult) {
          return productResult.map(function(item) {
            return item.toJSON();
          });
        });
      },
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
        }).then(function(productItems) {
          productResult = productItems.map(function(item) {
            return item.toJSON();
          });
          inProgressProductOption.status_type = 5;
          inProgressProductOption.product_status_type = options.status_type;
          return Promise.all([
            _this3.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
            _this3.insuranceAdaptor.retrieveInsuranceCount(
                inProgressProductOption),
            _this3.warrantyAdaptor.retrieveWarrantyCount(
                inProgressProductOption),
            _this3.repairAdaptor.retrieveRepairCount(inProgressProductOption)]);
        }).then(function(results) {
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
      },
    }, {
      key: 'retrieveProductById',
      value: function retrieveProductById(id, options) {
        var _this4 = this;

        if (!options.status_type) {
          options.status_type = {
            $notIn: [3, 9],
          };
        }

        options.id = id;
        var products = void 0;
        return this.modals.products.findOne({
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
                          this.modals.sequelize.literal(
                              '"bill->sellers"."sid"'),
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
              this.modals.sequelize.literal('"category"."dual_warranty_item"'),
              'dualWarrantyItem'],
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
        }).then(function(productResult) {
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
        }).then(function(results) {
          if (products) {
            var metaData = results[0];
            var pucItem = metaData.find(function(item) {
              return item.name.toLowerCase().includes('puc');
            });
            if (pucItem) {
              products.pucDetail = {
                expiry_date: pucItem.value,
              };
            }
            products.metaData = metaData.filter(function(item) {
              return !item.name.toLowerCase().includes('puc');
            });
            products.brand = results[1];
            products.insuranceDetails = results[2];
            products.warrantyDetails = results[3];
            products.amcDetails = results[4];
            products.repairBills = results[5];
          }

          return products;
        });
      },
    }, {
      key: 'createProduct',
      value: function createProduct(productBody, metadataBody, otherItems) {
        var _this5 = this;

        var brandBody = {
          brand_name: productBody.brand_name,
          updated_by: productBody.user_id,
          created_by: productBody.user_id,
          status_type: 11,
        };

        var brandPromise = productBody.brand_name ?
            this.modals.brands.findCreateFind({
              where: {
                brand_name: {
                  $iLike: productBody.brand_name,
                },
              },
              defaults: brandBody,
            }) :
            this.modals.brands.findAll({
              where: {
                brand_name: {
                  $iLike: productBody.brand_name,
                },
              },
            });
        var renewalTypes = void 0;
        var product = productBody;
        var metadata = void 0;
        return brandPromise.then(function(newItemResult) {
          var newBrand = productBody.brand_name ?
              newItemResult[0].toJSON() :
              undefined;
          product = _lodash2.default.omit(product, 'brand_name');
          product.brand_id = newBrand ? newBrand.brand_id : product.brand_id;

          var dropDownPromise = metadataBody.map(function(item) {
            if (item.new_drop_down) {
              return _this5.modals.brandDropDown.findCreateFind({
                where: {
                  title: {
                    $iLike: item.form_value.toLowerCase(),
                  },
                  category_form_id: item.category_form_id,
                  category_id: productBody.category_id,
                  brand_id: product.brand_id,
                },
                defaults: {
                  title: item.form_value,
                  category_form_id: item.category_form_id,
                  category_id: productBody.category_id,
                  brand_id: product.brand_id,
                  updated_by: item.updated_by,
                  created_by: item.created_by,
                  status_type: 11,
                },
              });
            }

            return '';
          });
          metadata = metadataBody.map(function(mdItem) {
            mdItem = _lodash2.default.omit(mdItem, 'new_drop_down');
            return mdItem;
          });
          return Promise.all(dropDownPromise);
        }).then(function() {
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

          return Promise.all([
            _this5.modals.products.count({
              where: product,
              include: [
                {
                  model: _this5.modals.metaData, where: {
                    $and: metadata,
                  }, required: true, as: 'metaData',
                }],
            }), _this5.categoryAdaptor.retrieveRenewalTypes({
              id: {
                $gte: 7,
              },
            })]);
        }).then(function(countRenewalTypeResult) {
          renewalTypes = countRenewalTypeResult[1];
          if (countRenewalTypeResult[0] === 0) {
            return _this5.modals.products.create(product);
          }

          return undefined;
        }).then(function(productResult) {
          if (productResult) {
            product = productResult.toJSON();
            var warrantyItemPromise = [];
            if (otherItems.warranty) {
              var warrantyRenewalType = void 0;
              var expiry_date = void 0;
              if (otherItems.warranty.renewal_type) {
                warrantyRenewalType = renewalTypes.find(function(item) {
                return item.type === otherItems.warranty.renewal_type;
              });
                var effective_date = (0, _moment2.default)(
                    otherItems.warranty.effective_date,
                    _moment2.default.ISO_8601).isValid() ?
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        _moment2.default.ISO_8601).startOf('day') :
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        'DD MMM YY').startOf('day');
                expiry_date = (0, _moment2.default)(effective_date,
                    _moment2.default.ISO_8601).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
              warrantyItemPromise.push(_this5.warrantyAdaptor.createWarranties({
                renewal_type: otherItems.warranty.renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: (0, _moment2.default)(expiry_date).
                    format('YYYY-MM-DD'),
                effective_date: (0, _moment2.default)(effective_date).
                    format('YYYY-MM-DD'),
                document_date: (0, _moment2.default)(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 1,
                user_id: productBody.user_id,
              }));
              }

              if (otherItems.warranty.dual_renewal_type) {
                warrantyRenewalType = renewalTypes.find(function(item) {
                  return item.type === otherItems.warranty.dual_renewal_type;
                });
                var _effective_date = (0, _moment2.default)(
                    otherItems.warranty.effective_date,
                    _moment2.default.ISO_8601).isValid() ?
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        _moment2.default.ISO_8601).startOf('day') :
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        'DD MMM YY').startOf('day');
                expiry_date = (0, _moment2.default)(_effective_date,
                    _moment2.default.ISO_8601).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(
                    _this5.warrantyAdaptor.createWarranties({
                      renewal_type: otherItems.warranty.dual_renewal_type,
                      updated_by: productBody.user_id,
                      status_type: 11,
                      product_id: product.id,
                      expiry_date: (0, _moment2.default)(expiry_date).
                          format('YYYY-MM-DD'),
                      effective_date: (0, _moment2.default)(_effective_date).
                          format('YYYY-MM-DD'),
                      document_date: (0, _moment2.default)(_effective_date).
                          format('YYYY-MM-DD'),
                      warranty_type: 3,
                      user_id: productBody.user_id,
                    }));
              }

              if (otherItems.warranty.extended_renewal_type) {
                warrantyRenewalType = renewalTypes.find(function(item) {
                  return item.type ===
                      otherItems.warranty.extended_renewal_type;
                });
                var _effective_date2 = (0, _moment2.default)(
                    otherItems.warranty.effective_date,
                    _moment2.default.ISO_8601).isValid() ?
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        _moment2.default.ISO_8601).startOf('day') :
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        'DD MMM YY').startOf('day');
                expiry_date = (0, _moment2.default)(_effective_date2).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(
                    _this5.warrantyAdaptor.createWarranties({
                      renewal_type: otherItems.warranty.extended_renewal_type,
                      updated_by: productBody.user_id,
                      status_type: 11,
                      product_id: product.id,
                      expiry_date: (0, _moment2.default)(expiry_date).
                          format('YYYY-MM-DD'),
                      effective_date: (0, _moment2.default)(_effective_date2).
                          format('YYYY-MM-DD'),
                      document_date: (0, _moment2.default)(_effective_date2).
                          format('YYYY-MM-DD'),
                      warranty_type: 2,
                      user_id: productBody.user_id,
                    }));
              }

              if (otherItems.warranty.accessory_renewal_type) {
                warrantyRenewalType = renewalTypes.find(function(item) {
                  return item.type ===
                      otherItems.warranty.accessory_renewal_type;
                });
                var _effective_date3 = (0, _moment2.default)(
                    otherItems.warranty.effective_date,
                    _moment2.default.ISO_8601).isValid() ?
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        _moment2.default.ISO_8601).startOf('day') :
                    (0, _moment2.default)(otherItems.warranty.effective_date,
                        'DD MMM YY').startOf('day');
                expiry_date = (0, _moment2.default)(_effective_date3).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(
                    _this5.warrantyAdaptor.createWarranties({
                      renewal_type: otherItems.warranty.accessory_renewal_type,
                      updated_by: productBody.user_id,
                      status_type: 11,
                      product_id: product.id,
                      expiry_date: (0, _moment2.default)(expiry_date).
                          format('YYYY-MM-DD'),
                      effective_date: (0, _moment2.default)(_effective_date3).
                          format('YYYY-MM-DD'),
                      document_date: (0, _moment2.default)(_effective_date3).
                          format('YYYY-MM-DD'),
                      warranty_type: 4,
                      user_id: productBody.user_id,
                    }));
            }
            }

            var insurancePromise = [];
            if (otherItems.insurance) {
              var _effective_date4 = (0, _moment2.default)(
                  otherItems.insurance.effective_date,
                  _moment2.default.ISO_8601).isValid() ?
                  (0, _moment2.default)(otherItems.insurance.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  (0, _moment2.default)(otherItems.insurance.effective_date,
                      'DD MMM YY').startOf('day');
              var _expiry_date = (0, _moment2.default)(_effective_date4,
                  _moment2.default.ISO_8601).add(8759, 'hours').endOf('days');
              insurancePromise.push(_this5.insuranceAdaptor.createInsurances({
                renewal_type: 8,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: (0, _moment2.default)(_expiry_date).
                    format('YYYY-MM-DD'),
                effective_date: (0, _moment2.default)(_effective_date4).
                    format('YYYY-MM-DD'),
                document_date: (0, _moment2.default)(_effective_date4).
                    format('YYYY-MM-DD'),
                document_number: otherItems.insurance.policy_no,
                provider_id: otherItems.insurance.provider_id,
                amount_insured: otherItems.insurance.amount_insured,
                renewal_cost: otherItems.insurance.renewal_cost,
                user_id: productBody.user_id,
              }));
            }

            var amcPromise = [];
            if (otherItems.amc) {
              var amcRenewalType = renewalTypes.find(function(item) {
                return item.type === otherItems.amc.expiry_period;
              });
              var _effective_date5 = (0, _moment2.default)(
                  otherItems.amc.effective_date, _moment2.default.ISO_8601).
                  isValid() ?
                  (0, _moment2.default)(otherItems.amc.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  (0, _moment2.default)(otherItems.amc.effective_date,
                      'DD MMM YY').startOf('day');
              var _expiry_date2 = (0, _moment2.default)(_effective_date5,
                  _moment2.default.ISO_8601).
                  add(amcRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days').
                  format('YYYY-MM-DD');
              amcPromise.push(_this5.amcAdaptor.createAMCs({
                renewal_type: 8,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: (0, _moment2.default)(_expiry_date2).
                    format('YYYY-MM-DD'),
                effective_date: (0, _moment2.default)(_effective_date5).
                    format('YYYY-MM-DD'),
                document_date: (0, _moment2.default)(_effective_date5).
                    format('YYYY-MM-DD'),
                user_id: productBody.user_id,
              }));
            }
            var metadataPromise = metadata.map(function(mdItem) {
              mdItem.product_id = product.id;
              mdItem.status_type = 8;

              return _this5.modals.metaData.create(mdItem);
            });

            if (otherItems.puc) {
              var pucRenewalType = renewalTypes.find(function(item) {
                return item.type === otherItems.puc.expiry_period;
              });
              var _effective_date6 = (0, _moment2.default)(
                  otherItems.puc.effective_date, _moment2.default.ISO_8601).
                  isValid() ?
                  (0, _moment2.default)(otherItems.puc.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  (0, _moment2.default)(otherItems.puc.effective_date,
                      'DD MMM YY').startOf('day');
              var form_value = (0, _moment2.default)(_effective_date6,
                  _moment2.default.ISO_8601).
                  add(pucRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days').
                  format('YYYY-MM-DD');
              metadataPromise.push(_this5.modals.metaData.create({
                category_form_id: product.category_id === 138 ? 1191 : 1192,
                form_value: form_value,
                product_id: product.id,
                status_type: 8, updated_by: product.user_id,
              }));
            }

            return Promise.all([
              metadataPromise,
              insurancePromise,
              warrantyItemPromise,
              amcPromise]);
          }

          return undefined;
        }).then(function(productItemsResult) {
          if (productItemsResult) {
            product.metaData = productItemsResult[0].map(function(mdItem) {
              return mdItem.toJSON();
            });
            product.insurances = productItemsResult[1];
            product.warranties = productItemsResult[2];
            product.amcs = productItemsResult[3];
            return product;
          }

          return undefined;
        });
      }
    }, {
      key: 'retrieveProductMetadata',
      value: function retrieveProductMetadata(options) {
        var _this6 = this;

        options.status_type = {
          $notIn: [3, 9],
        };

        return this.modals.metaData.findAll({
          where: options,
          include: [
            {
              model: this.modals.categoryForms,
              as: 'categoryForm',
              attributes: [],
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
        }).then(function(metaDataResult) {
          var metaData = metaDataResult.map(function(item) {
            return item.toJSON();
          });
          var categoryFormIds = metaData.map(function(item) {
            return item.categoryFormId;
          });

          return Promise.all([
            metaData, _this6.modals.dropDowns.findAll({
              where: {
                category_form_id: categoryFormIds,
              },
              attributes: ['id', 'title'],
            })]);
        }).then(function(result) {
          var unOrderedMetaData = result[0].map(function(item) {
            var metaDataItem = item;
            if (metaDataItem.formType === 2 && metaDataItem.value) {
              var dropDown = result[1].find(function(item) {
                return item.id === parseInt(metaDataItem.value);
              });
              metaDataItem.value = dropDown ?
                  dropDown.title :
                  metaDataItem.value;
            }

            return metaDataItem;
          });

          unOrderedMetaData.sort(function(itemA, itemB) {
            return itemA.displayIndex - itemB.displayIndex;
          });

          return unOrderedMetaData;
        });
      },
    }, {
      key: 'updateBrandReview',
      value: function updateBrandReview(user, brandId, request) {
        var payload = request.payload;
        return this.modals.brandReviews.findCreateFind({
          where: {
            user_id: user.id || user.ID,
            brand_id: brandId,
            status_id: 1,
          },
          defaults: {
            user_id: user.id || user.ID,
            brand_id: brandId,
            status_id: 1,
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments,
          },
        }).then(function(result) {
          if (!result[1]) {
            result[0].updateAttributes({
              review_ratings: payload.ratings,
              review_feedback: payload.feedback,
              review_comments: payload.comments,
            });
          }

          return {
            status: true,
            message: 'Review Updated Successfully',
            forceUpdate: request.pre.forceUpdate,
          };
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return {
            status: true,
            message: 'Review Update Failed',
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }, {
      key: 'updateSellerReview',
      value: function updateSellerReview(
          user, sellerId, isOnlineSeller, request) {
        var payload = request.payload;
        var whereClause = isOnlineSeller ? {
          user_id: user.id || user.ID,
          seller_id: sellerId,
          status_id: 1,
        } : {
          user_id: user.id || user.ID,
          offline_seller_id: sellerId,
          status_id: 1,
        };

        var defaultClause = isOnlineSeller ? {
          user_id: user.id || user.ID,
          seller_id: sellerId,
          status_id: 1,
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments,
        } : {
          user_id: user.id || user.ID,
          offline_seller_id: sellerId,
          status_id: 1,
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments,
        };

        return this.modals.sellerReviews.findCreateFind({
          where: whereClause,
          defaults: defaultClause,
        }).then(function(result) {
          if (!result[1]) {
            result[0].updateAttributes({
              review_ratings: payload.ratings,
              review_feedback: payload.feedback,
              review_comments: payload.comments,
            });
          }

          return {
            status: true,
            message: 'Review Updated Successfully',
            forceUpdate: request.pre.forceUpdate,
          };
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return {
            status: true,
            message: 'Review Update Failed',
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }, {
      key: 'updateProductReview',
      value: function updateProductReview(user, productId, request) {
        var payload = request.payload;
        var whereClause = {
          user_id: user.id || user.ID,
          bill_product_id: productId,
          status_id: 1,
        };

        return this.modals.productReviews.findCreateFind({
          where: whereClause,
          defaults: {
            user_id: user.id || user.ID,
            bill_product_id: productId,
            status_id: 1,
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments,
          },
        }).then(function(result) {
          if (!result[1]) {
            result[0].updateAttributes({
              review_ratings: payload.ratings,
              review_feedback: payload.feedback,
              review_comments: payload.comments,
            });
          }

          return {
            status: true,
            message: 'Review Updated Successfully',
            forceUpdate: request.pre.forceUpdate,
          };
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return {
            status: true,
            message: 'Review Update Failed',
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }, {
      key: 'retrieveNotificationProducts',
      value: function retrieveNotificationProducts(options) {
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
        }).then(function(productResult) {
          products = productResult.map(function(item) {
            return item.toJSON();
          });
          return _this7.retrieveProductMetadata({
            product_id: {
              $in: products.map(function(item) {
                return item.id;
              }),
            },
          });
        }).then(function(results) {
          var metaData = results;

          products = products.map(function(productItem) {
            productItem.productMetaData = metaData.filter(function(item) {
              return item.productId === productItem.id;
            });

            return productItem;
          });

          return products;
        });
      },
    }, {
      key: 'retrieveMissingDocProducts',
      value: function retrieveMissingDocProducts(options) {
        var _this8 = this;

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
        }).then(function(productResult) {
          products = productResult.map(function(item) {
            var product = item.toJSON();
            product.hasDocs = product.copies.length > 0;
            return product;
          });
          return Promise.all([
            _this8.insuranceAdaptor.retrieveInsurances({
              product_id: {
                $in: products.filter(function(item) {
                  return item.masterCategoryId === 2 ||
                      item.masterCategoryId === 3;
                }).map(function(item) {
                  return item.id;
                }),
              },
            }), _this8.warrantyAdaptor.retrieveWarranties({
              product_id: {
                $in: products.filter(function(item) {
                  return item.masterCategoryId === 2 ||
                      item.masterCategoryId === 3;
                }).map(function(item) {
                  return item.id;
                }),
              },
            })]);
        }).then(function(results) {
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
            return !pItem.hasDocs || pItem.hasInsurance &&
                pItem.hasInsurance === false || pItem.hasWarranty &&
                pItem.hasWarranty === false;
          });
        });
      },
    }, {
      key: 'retrieveProductExpenses',
      value: function retrieveProductExpenses(options) {
        if (!options.status_type) {
          options.status_type = {
            $notIn: [3, 9],
          };
        }

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
        }).then(function(productResult) {
          return productResult.map(function(item) {
            return item.toJSON();
          });
        });
      },
    }, {
      key: 'prepareProductDetail',
      value: function prepareProductDetail(user, request) {
        var productId = request.params.id;
        return this.retrieveProductById(productId, {
          user_id: user.id || user.ID,
          status_type: [5, 8, 11],
        }).then(function(result) {
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
              forceUpdate: request.pre.forceUpdate,
            };
          }
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return {
            status: false,
            message: 'Unable to retrieve data',
            product: {},
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }]);

  return ProductAdaptor;
}();

exports.default = ProductAdaptor;