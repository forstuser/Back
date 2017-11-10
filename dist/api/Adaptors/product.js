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
        seller_id: options.online_seller_id,
      };

      options = _lodash2.default.omit(options, 'online_seller_id');
      options = _lodash2.default.omit(options, 'product_status_type');

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        include: [{
          model: this.modals.brands,
          as: 'brand',
          attributes: [['brand_id', 'brandId'], ['brand_name', 'name'], ['brand_description', 'description']],
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
            attributes: [['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
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
            'contact_no',
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
            this.modals.sequelize.fn('CONCAT', 'categories/',
                this.modals.sequelize.col('category_id'), '/images'),
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
    key: 'retrieveProductCounts',
    value: function retrieveProductCounts(options) {
      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9],
        };
      }

      options = _lodash2.default.omit(options, 'product_status_type');
      return this.modals.products.findAll({
        where: options,
        attributes: [
          [
            this.modals.sequelize.literal('COUNT(*)'),
            'productCounts'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            this.modals.sequelize.literal('max("updated_at")'),
            'lastUpdatedAt']],
        group: 'main_category_id',
      }).then(function(productItems) {
        return productItems.map(function(item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveProductById',
    value: function retrieveProductById(id, options) {
      var _this2 = this;

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
                  'email'],
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
              'contact_no',
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
            this.modals.sequelize.fn('CONCAT', 'categories/',
                this.modals.sequelize.col('category_id'), '/images'),
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
            this.modals.sequelize.fn('CONCAT',
                '/consumer/servicecenters?brandid=',
                this.modals.sequelize.col('brand_id'), '&categoryid=',
                this.modals.sequelize.col('category_id')),
            'serviceCenterUrl']],
      }).then(function(productResult) {
        products = productResult ? productResult.toJSON() : productResult;
        if (products) {
          return Promise.all([
            _this2.retrieveProductMetadata({
              product_id: products.id,
            }), _this2.brandAdaptor.retrieveBrandById(products.brandId, {
              category_id: products.categoryId,
            }), _this2.insuranceAdaptor.retrieveInsurances({
              product_id: products.id,
            }), _this2.warrantyAdaptor.retrieveWarranties({
              product_id: products.id,
            }), _this2.amcAdaptor.retrieveAMCs({
              product_id: products.id,
            }), _this2.repairAdaptor.retrieveRepairs({
              product_id: products.id,
            })]);
        }
      }).then(function(results) {
        if (products) {
          products.metaData = results[0];
          products.brand = results[1];
          products.insuranceDetails = results[3];
          products.warrantyDetails = results[4];
          products.amcDetails = results[5];
          products.repairBills = results[6];
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
              this.modals.sequelize.where(this.modals.sequelize.literal(
                  'cast("metaData"."form_value" as integer)'),
                  this.modals.sequelize.literal('"dropDown"."id"')),
              this.modals.sequelize.where(
                  this.modals.sequelize.literal('"categoryForm"."form_type"'),
                  2)],
          },
          attributes: ['title'],
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
            this.modals.sequelize.literal('"categoryForm"."title"'),
            'name'],
          [
            this.modals.sequelize.literal('"categoryForm"."display_index"'),
            'displayIndex']],
      }).then(function (metaData) {
        var unOrderedMetaData = metaData.map(function (item) {
          var metaDataItem = item.toJSON();
          metaDataItem.value = metaDataItem.dropDown ? metaDataItem.dropDown.title : metaDataItem.value;
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
      return this.modals.brandReviews.findOrCreate({
        where: {
          user_id: user.ID,
          brand_id: brandId,
          status_type: 1
        },
        defaults: {
          user_id: user.ID,
          brand_id: brandId,
          status_type: 1,
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
        user_id: user.ID,
        seller_id: sellerId,
        status_type: 1
      } : {
        user_id: user.ID,
        offline_seller_id: sellerId,
        status_type: 1
      };

      var defaultClause = isOnlineSeller ? {
        user_id: user.ID,
        seller_id: sellerId,
        status_type: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      } : {
        user_id: user.ID,
        offline_seller_id: sellerId,
        status_type: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      };

      return this.modals.sellerReviews.findOrCreate({
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
        user_id: user.ID,
        bill_product_id: productId,
        status_type: 1
      };

      return this.modals.productReviews.findOrCreate({
        where: whereClause,
        defaults: {
          user_id: user.ID,
          bill_product_id: productId,
          status_type: 1,
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
          user_id: user.ID
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