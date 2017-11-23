/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
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
          attributes: [['consumer_name', 'consumerName'], ['consumer_email', 'consumerEmail'], ['consumer_phone_no', 'consumerPhoneNo'], ['document_number', 'invoiceNo']],
          include: [{
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
            required: false
          }],
          required: true,
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
          required: false
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
            'serviceCenterUrl']],
      }).then(function (productResult) {
        products = productResult.map(function (item) {
          return item.toJSON();
        });
        return Promise.all([
          _this.retrieveProductMetadata({
          product_id: {
            $in: products.map(function (item) {
              return item.id;
            })
          }
          }), _this.insuranceAdaptor.retrieveInsurances({
            product_id: {
              $in: products.map(function(item) {
                return item.id;
              }),
            },
          }), _this.warrantyAdaptor.retrieveWarranties({
            product_id: {
              $in: products.map(function(item) {
                return item.id;
              }),
            },
          }), _this.amcAdaptor.retrieveAMCs({
            product_id: {
              $in: products.map(function(item) {
                return item.id;
              }),
            },
          }), _this.repairAdaptor.retrieveRepairs({
            product_id: {
              $in: products.map(function(item) {
                return item.id;
              }),
            },
          })]);
      }).then(function(results) {
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
            required: true,
          }],
        attributes: ['id'],
      }).then(function(productResult) {
        return productResult.map(function(item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveProductCounts',
    value: function retrieveProductCounts(options) {
      var _this2 = this;

      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9],
        };
      }

      var productResult = void 0;
      options = _lodash2.default.omit(options, 'product_status_type');
      return this.modals.products.findAll({
        where: options,
        include: [
          {
            model: this.modals.bills,
            where: {
              status_type: 5,
            },
            attributes: [],
            required: true,
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
        var inProgressProductOption = {};
        _lodash2.default.assignIn(inProgressProductOption, options);
        inProgressProductOption.status_type = 5;
        return Promise.all([
          _this2.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
          _this2.insuranceAdaptor.retrieveInsuranceCount(
              inProgressProductOption),
          _this2.warrantyAdaptor.retrieveWarrantyCount(inProgressProductOption),
          _this2.repairAdaptor.retrieveRepairCount(inProgressProductOption)]);
      }).then(function(results) {
        if (options.status_type === 5) {
          return productResult;
        }
        var availableResult = [].concat(_toConsumableArray(results[0]),
            _toConsumableArray(results[1]), _toConsumableArray(results[2]),
            _toConsumableArray(results[3]));

        return productResult.filter(function(item) {
          return availableResult.includes(function(availResult) {
            return availResult.masterCategoryId === item.masterCategoryId;
          });
        });
      });
    }
  }, {
    key: 'retrieveProductById',
    value: function retrieveProductById(id, options) {
      var _this3 = this;

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
            required: true,
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
            _this3.retrieveProductMetadata({
              product_id: products.id,
            }), _this3.brandAdaptor.retrieveBrandById(products.brandId, {
              category_id: products.categoryId,
            }), _this3.insuranceAdaptor.retrieveInsurances({
              product_id: products.id,
            }), _this3.warrantyAdaptor.retrieveWarranties({
              product_id: products.id,
            }), _this3.amcAdaptor.retrieveAMCs({
              product_id: products.id,
            }), _this3.repairAdaptor.retrieveRepairs({
              product_id: products.id,
            })]);
        }
      }).then(function(results) {
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
    key: 'prepareProductDetail',
    value: function prepareProductDetail(user, request) {
      var productId = request.params.id;
      return this.retrieveProductById(productId, {
        where: {
          user_id: user.id,
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