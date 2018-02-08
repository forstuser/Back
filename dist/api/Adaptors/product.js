/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _brands = require('./brands');

var _brands2 = _interopRequireDefault(_brands);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _pucs = require('./pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _sellers = require('./sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _serviceSchedules = require('./serviceSchedules');

var _serviceSchedules2 = _interopRequireDefault(_serviceSchedules);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ProductAdaptor = function () {
  function ProductAdaptor(modals) {
    _classCallCheck(this, ProductAdaptor);

    this.modals = modals;
    this.brandAdaptor = new _brands2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.pucAdaptor = new _pucs2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
    this.categoryAdaptor = new _category2.default(modals);
    this.sellerAdaptor = new _sellers2.default(modals);
    this.serviceScheduleAdaptor = new _serviceSchedules2.default(modals);
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
        inProgressProductOption = _lodash2.default.omit(options, 'product_name');
      }
      if (!inProgressProductOption.brand_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'brand_id');
      }
      if (!inProgressProductOption.seller_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'seller_id');
      }
      if (!inProgressProductOption.online_seller_id) {
        inProgressProductOption = _lodash2.default.omit(options, 'online_seller_id');
      }

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        include: [{
          model: this.modals.brands,
          as: 'brand',
          attributes: [['brand_id', 'brandId'], ['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description'], [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('"brand"."brand_id"'), '/reviews'), 'reviewUrl']],
          required: false
        }, {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false
        }, {
          model: this.modals.serviceSchedules,
          as: 'schedule',
          attributes: [
            'id',
            'inclusions',
            'exclusions',
            'service_number',
            'service_type',
            'distance',
            'due_in_months',
            'due_in_days'],
          required: false,
        }, {
          model: this.modals.bills,
          where: billOption,
          attributes: [['consumer_name', 'consumerName'], ['consumer_email', 'consumerEmail'], ['consumer_phone_no', 'consumerPhoneNo'], ['document_number', 'invoiceNo'], 'seller_id'],
          include: [{
            model: this.modals.onlineSellers,
            as: 'sellers',
            attributes: [['sid', 'id'], ['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.literal('"bill->sellers"."sid"'), '/reviews?isonlineseller=true'), 'reviewUrl']],
            include: [{
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
              required: false
            }],
            required: false
          }],
          required: options.status_type === 8
        }, {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [['sid', 'id'], ['seller_name', 'sellerName'], ['owner_name', 'ownerName'], ['pan_no', 'panNo'], ['reg_no', 'regNo'], ['is_service', 'isService'], 'url', 'gstin', ['contact_no', 'contact'], 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.literal('"sellers"."sid"'), '/reviews?isonlineseller=false'), 'reviewUrl']],
          include: [{
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }],
          required: false
        }, {
          model: this.modals.productReviews,
          as: 'productReviews',
          attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
          required: false
        }, {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false
        },
          {
            model: this.modals.categories,
            as: 'sub_category',
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
          'sub_category_id',
          [
            this.modals.sequelize.literal('"sub_category"."category_name"'),
            'sub_category_name'],
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
            this.modals.sequelize.literal('"category"."category_name"'),
            'categoryName'],
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
          'model',
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
        order: [['document_date', 'DESC']]
      }).then(function (productResult) {
        products = productResult.map(function (item) {
          var productItem = item.toJSON();
          productItem.purchaseDate = _moment2.default.utc(
              productItem.purchaseDate, _moment2.default.ISO_8601).
              startOf('days');
          if (productItem.schedule) {
            productItem.schedule.due_date = _moment2.default.utc(
                productItem.purchaseDate, _moment2.default.ISO_8601).
                add(productItem.schedule.due_in_months, 'months');
          }
          return productItem;
        });
        if (billOption.seller_id && billOption.seller_id.length > 0) {
          products = products.filter(function (item) {
            return item.bill && billOption.seller_id.find(function (sItem) {
              return parseInt(item.bill.seller_id) === parseInt(sItem);
            });
          });
        }
        inProgressProductOption = _lodash2.default.omit(inProgressProductOption, 'product_name');
        inProgressProductOption.status_type = [5, 11, 12];
        inProgressProductOption.product_status_type = options.status_type;
        var warrantyOptions = {};
        _lodash2.default.assignIn(warrantyOptions, inProgressProductOption);
        warrantyOptions.warranty_type = [1, 2];
        if (products.length > 0) {
          inProgressProductOption.product_id = products.map(function (item) {
            return item.id;
          });
          return Promise.all([_this.retrieveProductMetadata({
            product_id: products.map(function(item) {
              return item.id;
            })
          }), _this.insuranceAdaptor.retrieveInsurances(inProgressProductOption), _this.warrantyAdaptor.retrieveWarranties(warrantyOptions), _this.amcAdaptor.retrieveAMCs(inProgressProductOption), _this.repairAdaptor.retrieveRepairs(inProgressProductOption), _this.pucAdaptor.retrievePUCs(inProgressProductOption)]);
        }
        return undefined;
      }).then(function (results) {
        if (results) {
          var metaData = results[0];
          products = products.map(function (productItem) {
            if (productItem.copies) {
              productItem.copies = productItem.copies.map(function(copyItem) {
                copyItem.file_type = copyItem.file_type || copyItem.fileType;
                return copyItem;
              });
            }
            var pucItem = metaData.find(function (item) {
              return item.name.toLowerCase().includes('puc');
            });
            if (pucItem) {
              productItem.pucDetail = {
                expiry_date: pucItem.value
              };
            }
            productItem.productMetaData = metaData.filter(function (item) {
              return item.productId === productItem.id && !item.name.toLowerCase().includes('puc');
            });
            productItem.insuranceDetails = results[1].filter(function (item) {
              return item.productId === productItem.id;
            });
            productItem.warrantyDetails = results[2].filter(function (item) {
              return item.productId === productItem.id;
            });
            productItem.amcDetails = results[3].filter(function (item) {
              return item.productId === productItem.id;
            });
            productItem.repairBills = results[4].filter(function (item) {
              return item.productId === productItem.id;
            });
            productItem.pucDetails = results[5].filter(function (item) {
              return item.productId === productItem.id;
            });

            productItem.requiredCount = productItem.insuranceDetails.length + productItem.warrantyDetails.length + productItem.amcDetails.length + productItem.repairBills.length + productItem.pucDetails.length;

            return productItem;
          });
        }

        return products;
      });
    }
  }, {
    key: 'retrieveUpcomingProducts',
    value: function retrieveUpcomingProducts(options) {
      if (!options.status_type) {
        options.status_type = [5, 11];
      }

      options.model = {
        $not: null,
      };
      options.service_schedule_id = {
        $not: null,
      };

      return this.modals.products.findAll({
        where: options,
        include: [
          {
            model: this.modals.serviceSchedules,
            as: 'schedule',
            attributes: [
              'id',
              'inclusions',
              'exclusions',
              'service_number',
              'service_type',
              'distance',
              'due_in_months',
              'due_in_days'],
            required: false,
          }, {
            model: this.modals.categories,
            as: 'category',
            attributes: [],
            required: false,
          }, {
            model: this.modals.categories,
            as: 'sub_category',
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
          'sub_category_id',
          [
            this.modals.sequelize.literal('"sub_category"."category_name"'),
            'sub_category_name'],
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
            this.modals.sequelize.literal('"category"."category_name"'),
            'categoryName'],
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
          'model',
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
        return productResult.map(function(item) {
          var productItem = item.toJSON();

          if (productItem.copies) {
            productItem.copies = productItem.copies.map(function(copyItem) {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }
          productItem.purchaseDate = _moment2.default.utc(
              productItem.purchaseDate, _moment2.default.ISO_8601).
              startOf('days');
          if (productItem.schedule) {
            productItem.schedule.due_date = _moment2.default.utc(
                productItem.purchaseDate, _moment2.default.ISO_8601).
                add(productItem.schedule.due_in_months, 'months');
          }
          return productItem;
        });
      });
    }
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
        include: [{
          model: this.modals.brands,
          as: 'brand',
          attributes: [['brand_id', 'brandId'], ['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id'], [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('"brand"."brand_id"'), '/reviews'), 'reviewUrl']],
          required: false
        }, {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false
        }, {
          model: this.modals.serviceSchedules,
          as: 'schedule',
          attributes: [
            'id',
            'inclusions',
            'exclusions',
            'service_number',
            'service_type',
            'distance',
            'due_in_months',
            'due_in_days'],
          required: false,
        }, {
          model: this.modals.bills,
          where: billOption,
          attributes: [['consumer_name', 'consumerName'], ['consumer_email', 'consumerEmail'], ['consumer_phone_no', 'consumerPhoneNo'], ['document_number', 'invoiceNo'], ['status_type', 'billStatus']],
          include: [{
            model: this.modals.onlineSellers,
            as: 'sellers',
            attributes: [['sid', 'id'], ['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.literal('"bill->sellers"."sid"'), '/reviews?isonlineseller=true'), 'reviewUrl']],
            include: [{
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
              required: false
            }],
            required: false
          }],
          required: false
        }, {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [['sid', 'id'], ['seller_name', 'sellerName'], ['owner_name', 'ownerName'], ['pan_no', 'panNo'], ['reg_no', 'regNo'], ['is_service', 'isService'], 'url', 'gstin', ['contact_no', 'contact'], 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.literal('"sellers"."sid"'), '/reviews?isonlineseller=false'), 'reviewUrl']],
          include: [{
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }],
          required: false
        }, {
          model: this.modals.productReviews,
          as: 'productReviews',
          attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
          required: false
        },
          {
            model: this.modals.categories,
            as: 'sub_category',
            attributes: [],
            required: false,
          },
          {
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
          'model',
          [
            'category_id',
            'categoryId'],
          [
            this.modals.sequelize.literal('"category"."category_name"'),
            'categoryName'],
          [
            'main_category_id',
            'masterCategoryId'],
          'sub_category_id',
          [
            this.modals.sequelize.literal('"sub_category"."category_name"'),
            'sub_category_name'],
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
                this.modals.sequelize.col('"products"."category_id"'),
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
            this.modals.sequelize.fn('CONCAT',
                '/consumer/servicecenters?brandid=',
                this.modals.sequelize.literal('"products"."brand_id"'),
                '&categoryid=',
                this.modals.sequelize.col('"products"."category_id"')),
            'serviceCenterUrl'],
          'updated_at',
          'status_type'],
        order: [['updated_at', 'DESC']]
      }).then(function (productResult) {
        var products = productResult.map(function (item) {
          var productItem = item.toJSON();
          if (productItem.copies) {
            productItem.copies = productItem.copies.map(function(copyItem) {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }
          productItem.purchaseDate = _moment2.default.utc(
              productItem.purchaseDate, _moment2.default.ISO_8601).
              startOf('days');
          if (productItem.schedule) {
            productItem.schedule.due_date = _moment2.default.utc(
                productItem.purchaseDate, _moment2.default.ISO_8601).
                add(productItem.schedule.due_in_months, 'months');
          }
          return productItem;
        }).filter(function(productItem) {
          return productItem.status_type !== 8 || productItem.status_type ===
              8 && productItem.bill && productItem.bill.billStatus === 5;
        });
        product = products.length > 0 ? products[0] : undefined;

        if (product) {
          return Promise.all([
            _this2.retrieveProductMetadata({
            product_id: product.id
            }), _this2.insuranceAdaptor.retrieveInsurances({
            product_id: product.id
            }), _this2.warrantyAdaptor.retrieveWarranties({
            product_id: product.id,
            warranty_type: [1, 2]
            }), _this2.amcAdaptor.retrieveAMCs({
            product_id: product.id
            }), _this2.repairAdaptor.retrieveRepairs({
            product_id: product.id
            }), _this2.pucAdaptor.retrievePUCs({
            product_id: product.id
          })]);
        }

        return undefined;
      }).then(function (results) {
        if (results) {
          var metaData = results[0];
          var pucItem = metaData.find(function (item) {
            return item.name.toLowerCase().includes('puc');
          });
          if (pucItem) {
            product.pucDetail = {
              expiry_date: pucItem.value
            };
          }
          product.metaData = metaData.filter(function (item) {
            return !item.name.toLowerCase().includes('puc');
          });
          product.insuranceDetails = results[1];
          product.warrantyDetails = results[2];
          product.amcDetails = results[3];
          product.repairBills = results[4];
          product.pucDetails = results[5];

          product.requiredCount = product.insuranceDetails.length + product.warrantyDetails.length + product.amcDetails.length + product.repairBills.length + product.pucDetails.length;
        }

        return product;
      });
    }
  }, {
    key: 'retrieveProductIds',
    value: function retrieveProductIds(options) {
      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9]
        };
      }

      var billOption = {
        status_type: 5
      };

      if (options.online_seller_id) {
        billOption.seller_id = options.online_seller_id;
      }

      options = _lodash2.default.omit(options, 'online_seller_id');
      options = _lodash2.default.omit(options, 'product_status_type');

      return this.modals.products.findAll({
        where: options,
        include: [{
          model: this.modals.bills,
          where: billOption,
          include: [{
            model: this.modals.onlineSellers,
            as: 'sellers',
            attributes: [],
            required: false
          }],
          attributes: ['status_type'],
          required: !!billOption.seller_id,
        }],
        attributes: ['id', 'status_type'],
      }).then(function (productResult) {
        return productResult.map(function(item) {
          return item.toJSON();
        }).filter(function(productItem) {
          return productItem.status_type !== 8 || productItem.status_type ===
              8 && productItem.bill && productItem.bill.status_type === 5;
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
        include: [{
          model: this.modals.bills,
          where: billOption,
          attributes: [],
          required: options.status_type === 8
        }],
        attributes: [[this.modals.sequelize.literal('COUNT(*)'), 'productCounts'], ['main_category_id', 'masterCategoryId'], [this.modals.sequelize.literal('max("products"."updated_at")'), 'lastUpdatedAt']],
        group: 'main_category_id'
      }).then(function (productItems) {
        productResult = productItems.map(function (item) {
          return item.toJSON();
        });
        inProgressProductOption.status_type = 5;
        inProgressProductOption.product_status_type = options.status_type;
        return Promise.all([
          _this3.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
          _this3.insuranceAdaptor.retrieveInsuranceCount(
              inProgressProductOption),
          _this3.warrantyAdaptor.retrieveWarrantyCount(inProgressProductOption),
          _this3.repairAdaptor.retrieveRepairCount(inProgressProductOption),
          _this3.pucAdaptor.retrievePUCs(inProgressProductOption)]);
      }).then(function (results) {
        if (options.status_type !== 8) {
          return productResult;
        }
        var availableResult = [].concat(_toConsumableArray(results[0]),
            _toConsumableArray(results[1]), _toConsumableArray(results[2]),
            _toConsumableArray(results[3]), _toConsumableArray(results[4]));

        return productResult.filter(function (item) {
          return availableResult.filter(function (availResult) {
            return availResult.masterCategoryId === item.masterCategoryId;
          }).length > 0;
        });
      });
    }
  }, {
    key: 'retrieveProductById',
    value: function retrieveProductById(id, options) {
      var _this4 = this;

      options.id = id;
      var products = void 0;
      var productItem = void 0;
      return this.modals.products.findOne({
        where: options,
        include: [{
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false
        }, {
          model: this.modals.serviceSchedules,
          as: 'schedule',
          attributes: [
            'id',
            'category_id',
            'brand_id',
            'title',
            'inclusions',
            'exclusions',
            'service_number',
            'service_type',
            'distance',
            'due_in_months',
            'due_in_days'],
          required: false,
        }, {
          model: this.modals.bills,
          attributes: [['consumer_name', 'consumerName'], ['consumer_email', 'consumerEmail'], ['consumer_phone_no', 'consumerPhoneNo'], ['document_number', 'invoiceNo']],
          include: [{
            model: this.modals.onlineSellers,
            as: 'sellers',
            attributes: [['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.literal('"bill->sellers"."sid"'), '/reviews?isonlineseller=true'), 'reviewUrl']],
            include: [{
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
              required: false
            }],
            required: false
          }],
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
            'longitude',
            [
              this.modals.sequelize.fn('CONCAT', 'sellers/',
                  this.modals.sequelize.literal('"sellers"."sid"'),
                  '/reviews?isonlineseller=false'),
              'reviewUrl']],
          include: [{
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }],
          required: false
        }, {
          model: this.modals.productReviews,
          as: 'productReviews',
          attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
          required: false
        }, {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false
        }, {
          model: this.modals.categories,
          as: 'mainCategory',
          attributes: [],
          required: false
        }, {
          model: this.modals.categories,
          as: 'sub_category',
          attributes: [],
          required: false,
        }],
        attributes: [
          'id',
          [
            'product_name',
            'productName'],
          'model',
          [
            this.modals.sequelize.literal('"category"."category_id"'),
            'categoryId'],
          [
            this.modals.sequelize.literal('"category"."dual_warranty_item"'),
            'dualWarrantyItem'],
          [
            'main_category_id',
            'masterCategoryId'],
          'sub_category_id',
          [
            this.modals.sequelize.literal('"sub_category"."category_name"'),
            'sub_category_name'],
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
          productItem = productResult;
          if (products.copies) {
            products.copies = products.copies.map(function(copyItem) {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }
          if (products.schedule) {
            products.schedule.due_date = _moment2.default.utc(
                products.purchaseDate, _moment2.default.ISO_8601).
                add(products.schedule.due_in_months, 'months');
          }
          var serviceSchedulePromise = products.schedule ?
              _this4.serviceScheduleAdaptor.retrieveServiceSchedules({
                category_id: products.schedule.category_id,
                brand_id: products.schedule.brand_id,
                title: products.schedule.title,
                id: {
                  $gte: products.schedule.id,
                },
                status_type: 1,
          }) : undefined;
          return Promise.all([
            _this4.retrieveProductMetadata({
            product_id: products.id
            }), _this4.brandAdaptor.retrieveBrandById(products.brandId, {
            category_id: products.categoryId
            }), _this4.insuranceAdaptor.retrieveInsurances({
            product_id: products.id
            }), _this4.warrantyAdaptor.retrieveWarranties({
            product_id: products.id
            }), _this4.amcAdaptor.retrieveAMCs({
            product_id: products.id
            }), _this4.repairAdaptor.retrieveRepairs({
            product_id: products.id
            }), _this4.pucAdaptor.retrievePUCs({
            product_id: products.id
            }), serviceSchedulePromise, _this4.modals.serviceCenters.count({
              include: [
                {
                  model: _this4.modals.brands,
                  as: 'brands',
                  where: {
                    brand_id: products.brandId,
                  },
                  attributes: [],
                  required: true,
                }, {
                  model: _this4.modals.centerDetails,
                  where: {
                    category_id: products.categoryId,
                  },
                  attributes: [],
                  required: true,
                  as: 'centerDetails',
                }],
            })]);
        }
      }).then(function (results) {
        if (products) {

          products.purchaseDate = _moment2.default.utc(products.purchaseDate,
              _moment2.default.ISO_8601).startOf('days');
          var metaData = results[0];
          var pucItem = metaData.find(function (item) {
            return item.name.toLowerCase().includes('puc');
          });
          if (pucItem) {
            products.pucDetail = {
              expiry_date: pucItem.value
            };
          }
          products.metaData = metaData.filter(function (item) {
            return !item.name.toLowerCase().includes('puc');
          });
          products.brand = results[1];
          products.insuranceDetails = results[2];
          products.warrantyDetails = results[3];
          products.amcDetails = results[4];
          products.repairBills = results[5];
          products.pucDetails = results[6];
          products.serviceSchedules = results[7] ?
              results[7].map(function(scheduleItem) {
                scheduleItem.due_date = _moment2.default.utc(
                    products.purchaseDate, _moment2.default.ISO_8601).
                    add(scheduleItem.due_in_months, 'months');

            return scheduleItem;
              }) :
              results[7];
          products.serviceCenterUrl = results[8] && results[8] > 0 ?
              products.serviceCenterUrl :
              '';
        }

        return products;
      });
    }
  }, {
    key: 'createProduct',
    value: function createProduct(productBody, metadataBody, otherItems) {
      var _this5 = this;

      var brandBody = {
        brand_name: productBody.brand_name,
        updated_by: productBody.user_id,
        created_by: productBody.user_id,
        status_type: 11
      };

      var brandPromise = productBody.brand_name ? this.modals.brands.findCreateFind({
        where: {
          brand_name: {
            $iLike: productBody.brand_name
          }
        },
        defaults: brandBody
      }) : this.modals.brands.findAll({
        where: {
          brand_name: {
            $iLike: productBody.brand_name
          }
        }
      });
      var renewalTypes = void 0;
      var product = productBody;
      var metadata = void 0;
      return brandPromise.then(function (newItemResult) {
        var newBrand = productBody.brand_name ? newItemResult[0].toJSON() : undefined;
        product = _lodash2.default.omit(product, 'brand_name');
        product.brand_id = newBrand ? newBrand.brand_id : product.brand_id;

        var dropDownPromise = metadataBody.map(function (item) {
          if (item.new_drop_down) {
            return _this5.modals.brandDropDown.findCreateFind({
              where: {
                title: {
                  $iLike: item.form_value.toLowerCase()
                },
                category_id: productBody.category_id,
                brand_id: product.brand_id
              },
              defaults: {
                title: item.form_value,
                category_id: productBody.category_id,
                brand_id: product.brand_id,
                updated_by: item.updated_by,
                created_by: item.created_by,
                status_type: 11
              }
            });
          }

          return '';
        });
        metadata = metadataBody.map(function (mdItem) {
          mdItem = _lodash2.default.omit(mdItem, 'new_drop_down');
          return mdItem;
        });
        return Promise.all(dropDownPromise);
      }).then(function () {
        product = !product.colour_id ? _lodash2.default.omit(product, 'colour_id') : product;
        product = !product.purchase_cost ? _lodash2.default.omit(product, 'purchase_cost') : product;
        product = !product.taxes ? _lodash2.default.omit(product, 'taxes') : product;
        product = !product.document_number ? _lodash2.default.omit(product, 'document_number') : product;
        product = !product.document_date ? _lodash2.default.omit(product, 'document_date') : product;
        product = !product.seller_id ? _lodash2.default.omit(product, 'seller_id') : product;

        return Promise.all([
          _this5.modals.products.count({
          where: product,
          include: [{
            model: _this5.modals.metaData, where: {
              $and: metadata
            }, required: true, as: 'metaData'
          }]
          }), _this5.categoryAdaptor.retrieveRenewalTypes({
            status_type: 1,
        })]);
      }).then(function (countRenewalTypeResult) {
        renewalTypes = countRenewalTypeResult[1];
        if (countRenewalTypeResult[0] === 0) {
          return _this5.modals.products.create(product);
        }

        return undefined;
      }).then(function (productResult) {
        if (productResult) {
          product = productResult.toJSON();
          var warrantyItemPromise = [];
          if (otherItems.warranty) {
            var warrantyRenewalType = void 0;
            var expiry_date = void 0;
            if (otherItems.warranty.renewal_type) {
              warrantyRenewalType = renewalTypes.find(function (item) {
                return item.type === otherItems.warranty.renewal_type;
              });
              var effective_date = _moment2.default.utc(
                  otherItems.warranty.effective_date,
                  _moment2.default.ISO_8601).isValid() ?
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      'DD MMM YY').startOf('day');
              expiry_date = _moment2.default.utc(effective_date,
                  _moment2.default.ISO_8601).
                  add(warrantyRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days');
              warrantyItemPromise.push(_this5.warrantyAdaptor.createWarranties({
                renewal_type: otherItems.warranty.renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: _moment2.default.utc(expiry_date).
                    format('YYYY-MM-DD'),
                effective_date: _moment2.default.utc(effective_date).
                    format('YYYY-MM-DD'),
                document_date: _moment2.default.utc(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 1,
                user_id: productBody.user_id
              }));
            }

            if (otherItems.warranty.dual_renewal_type) {
              warrantyRenewalType = renewalTypes.find(function (item) {
                return item.type === otherItems.warranty.dual_renewal_type;
              });
              var _effective_date = _moment2.default.utc(
                  otherItems.warranty.effective_date,
                  _moment2.default.ISO_8601).isValid() ?
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      'DD MMM YY').startOf('day');
              expiry_date = _moment2.default.utc(_effective_date,
                  _moment2.default.ISO_8601).
                  add(warrantyRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days');
              warrantyItemPromise.push(_this5.warrantyAdaptor.createWarranties({
                renewal_type: otherItems.warranty.dual_renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: _moment2.default.utc(expiry_date).
                    format('YYYY-MM-DD'),
                effective_date: _moment2.default.utc(_effective_date).
                    format('YYYY-MM-DD'),
                document_date: _moment2.default.utc(_effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 3,
                user_id: productBody.user_id
              }));
            }

            if (otherItems.warranty.extended_renewal_type) {
              warrantyRenewalType = renewalTypes.find(function (item) {
                return item.type === otherItems.warranty.extended_renewal_type;
              });
              var _effective_date2 = _moment2.default.utc(
                  otherItems.warranty.effective_date,
                  _moment2.default.ISO_8601).isValid() ?
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      'DD MMM YY').startOf('day');
              expiry_date = _moment2.default.utc(_effective_date2).
                  add(warrantyRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days');
              warrantyItemPromise.push(_this5.warrantyAdaptor.createWarranties({
                renewal_type: otherItems.warranty.extended_renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: _moment2.default.utc(expiry_date).
                    format('YYYY-MM-DD'),
                effective_date: _moment2.default.utc(_effective_date2).
                    format('YYYY-MM-DD'),
                document_date: _moment2.default.utc(_effective_date2).
                    format('YYYY-MM-DD'),
                warranty_type: 2,
                user_id: productBody.user_id
              }));
            }

            if (otherItems.warranty.accessory_renewal_type) {
              warrantyRenewalType = renewalTypes.find(function (item) {
                return item.type === otherItems.warranty.accessory_renewal_type;
              });
              var _effective_date3 = _moment2.default.utc(
                  otherItems.warranty.effective_date,
                  _moment2.default.ISO_8601).isValid() ?
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      _moment2.default.ISO_8601).startOf('day') :
                  _moment2.default.utc(otherItems.warranty.effective_date,
                      'DD MMM YY').startOf('day');
              expiry_date = _moment2.default.utc(_effective_date3).
                  add(warrantyRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days');
              warrantyItemPromise.push(_this5.warrantyAdaptor.createWarranties({
                renewal_type: otherItems.warranty.accessory_renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: _moment2.default.utc(expiry_date).
                    format('YYYY-MM-DD'),
                effective_date: _moment2.default.utc(_effective_date3).
                    format('YYYY-MM-DD'),
                document_date: _moment2.default.utc(_effective_date3).
                    format('YYYY-MM-DD'),
                warranty_type: 4,
                user_id: productBody.user_id
              }));
            }
          }

          var insurancePromise = [];
          if (otherItems.insurance) {
            var _effective_date4 = _moment2.default.utc(
                otherItems.insurance.effective_date, _moment2.default.ISO_8601).
                isValid() ?
                _moment2.default.utc(otherItems.insurance.effective_date,
                    _moment2.default.ISO_8601).startOf('day') :
                _moment2.default.utc(otherItems.insurance.effective_date,
                    'DD MMM YY').startOf('day');
            var _expiry_date = _moment2.default.utc(_effective_date4,
                _moment2.default.ISO_8601).add(8759, 'hours').endOf('days');
            insurancePromise.push(_this5.insuranceAdaptor.createInsurances({
              renewal_type: 8,
              updated_by: productBody.user_id,
              status_type: 11,
              product_id: product.id,
              expiry_date: _moment2.default.utc(_expiry_date).
                  format('YYYY-MM-DD'),
              effective_date: _moment2.default.utc(_effective_date4).
                  format('YYYY-MM-DD'),
              document_date: _moment2.default.utc(_effective_date4).
                  format('YYYY-MM-DD'),
              document_number: otherItems.insurance.policy_no,
              provider_id: otherItems.insurance.provider_id,
              amount_insured: otherItems.insurance.amount_insured,
              renewal_cost: otherItems.insurance.value,
              user_id: productBody.user_id
            }));
          }

          var amcPromise = [];
          if (otherItems.amc) {
            var amcRenewalType = renewalTypes.find(function (item) {
              return item.type === 8;
            });
            var _effective_date5 = _moment2.default.utc(
                otherItems.amc.effective_date, _moment2.default.ISO_8601).
                isValid() ?
                _moment2.default.utc(otherItems.amc.effective_date,
                    _moment2.default.ISO_8601).startOf('day') :
                _moment2.default.utc(otherItems.amc.effective_date,
                    'DD MMM YY').startOf('day');
            var _expiry_date2 = _moment2.default.utc(_effective_date5,
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
              expiry_date: _moment2.default.utc(_expiry_date2).
                  format('YYYY-MM-DD'),
              effective_date: _moment2.default.utc(_effective_date5).
                  format('YYYY-MM-DD'),
              document_date: _moment2.default.utc(_effective_date5).
                  format('YYYY-MM-DD'),
              user_id: productBody.user_id
            }));
          }
          var metadataPromise = metadata.map(function (mdItem) {
            mdItem.product_id = product.id;
            mdItem.status_type = 8;

            return _this5.modals.metaData.create(mdItem);
          });

          var pucPromise = [];
          if (otherItems.puc) {
            var pucRenewalType = otherItems.puc.expiry_period;
            var _effective_date6 = _moment2.default.utc(
                otherItems.puc.effective_date, _moment2.default.ISO_8601).
                isValid() ?
                _moment2.default.utc(otherItems.puc.effective_date,
                    _moment2.default.ISO_8601).startOf('day') :
                _moment2.default.utc(otherItems.puc.effective_date,
                    'DD MMM YY').startOf('day');
            var _expiry_date3 = _moment2.default.utc(_effective_date6,
                _moment2.default.ISO_8601).
                add(pucRenewalType, 'months').
                subtract(1, 'day').
                endOf('days').
                format('YYYY-MM-DD');
            pucPromise.push(otherItems.puc.id ?
                _this5.pucAdaptor.updatePUCs(otherItems.puc.id, {
              renewal_type: otherItems.puc.expiry_period,
              updated_by: productBody.user_id,
              status_type: 11,
              seller_id: isProductPUCSellerSame ? sellerList[0].sid : otherItems.puc.seller_name || otherItems.puc.seller_contact ? sellerList[3].sid : undefined,
              product_id: productId,
                  expiry_date: _moment2.default.utc(_expiry_date3).
                      format('YYYY-MM-DD'),
                  effective_date: _moment2.default.utc(_effective_date6).
                      format('YYYY-MM-DD'),
                  document_date: _moment2.default.utc(_effective_date6).
                      format('YYYY-MM-DD'),
              user_id: productBody.user_id
                }) :
                _this5.pucAdaptor.createPUCs({
              renewal_type: otherItems.puc.expiry_period || 7,
              updated_by: productBody.user_id,
              status_type: 11,
              renewal_cost: otherItems.puc.value,
              product_id: productId,
              seller_id: isProductPUCSellerSame ? sellerList[0].sid : otherItems.puc.seller_name || otherItems.puc.seller_contact ? sellerList[3].sid : undefined,
                  expiry_date: _moment2.default.utc(_expiry_date3).
                      format('YYYY-MM-DD'),
                  effective_date: _moment2.default.utc(_effective_date6).
                      format('YYYY-MM-DD'),
                  document_date: _moment2.default.utc(_effective_date6).
                      format('YYYY-MM-DD'),
              user_id: productBody.user_id
            }));
          }

          return Promise.all([metadataPromise, insurancePromise, warrantyItemPromise, amcPromise, pucPromise]);
        }

        return undefined;
      }).then(function (productItemsResult) {
        if (productItemsResult) {
          product.metaData = productItemsResult[0].map(function (mdItem) {
            return mdItem.toJSON();
          });
          product.insurances = productItemsResult[1];
          product.warranties = productItemsResult[2];
          product.amcs = productItemsResult[3];
          product.pucDetail = productItemsResult[4];
          return product;
        }

        return undefined;
      });
    }
  }, {
    key: 'updateProductDetails',
    value: function updateProductDetails(productBody, metadataBody, otherItems, productId) {
      var _this6 = this;

      var sellerPromise = [];
      var isProductAMCSellerSame = false;
      var isProductRepairSellerSame = false;
      var isAMCRepairSellerSame = otherItems.repair && otherItems.amc &&
          otherItems.repair.seller_contact === otherItems.amc.seller_contact;
      var isProductPUCSellerSame = false;
      var insuranceProviderPromise = otherItems.insurance &&
      otherItems.insurance.provider_name ?
          this.insuranceAdaptor.findCreateInsuranceBrand({
            main_category_id: productBody.main_category_id,
            category_id: productBody.category_id,
            type: 1,
            status_type: 11,
            updated_by: productBody.user_id,
            name: otherItems.insurance.provider_name,
          }) :
          undefined;
      var warrantyProviderPromise = otherItems.warranty &&
      otherItems.warranty.extended_provider_name ?
          this.insuranceAdaptor.findCreateInsuranceBrand({
            main_category_id: productBody.main_category_id,
            category_id: productBody.category_id,
            type: 2,
            status_type: 11,
            updated_by: productBody.user_id,
            name: otherItems.warranty.extended_provider_name,
          }) :
          undefined;

      var brandPromise = !productBody.brand_id && productBody.brand_name ?
          this.brandAdaptor.findCreateBrand({
            status_type: 11,
            brand_name: productBody.brand_name,
            updated_by: productBody.user_id,
            created_by: productBody.user_id,
          }) :
          undefined;
      this.prepareSellerPromise({
        sellerPromise: sellerPromise,
        productBody: productBody,
        otherItems: otherItems,
        isProductAMCSellerSame: isProductAMCSellerSame,
        isProductRepairSellerSame: isProductRepairSellerSame,
        isProductPUCSellerSame: isProductPUCSellerSame,
      });
      sellerPromise.push(insuranceProviderPromise);
      sellerPromise.push(brandPromise);
      sellerPromise.push(warrantyProviderPromise);
      var renewalTypes = void 0;
      var product = productBody;
      var metadata = void 0;
      var sellerList = void 0;
      return Promise.all(sellerPromise).then(function (newItemResults) {
        sellerList = newItemResults;
        var newSeller = productBody.seller_contact || productBody.seller_name ? sellerList[0] : undefined;
        product = _lodash2.default.omit(product, 'seller_name');
        product = _lodash2.default.omit(product, 'seller_contact');
        product = _lodash2.default.omit(product, 'brand_name');
        product.seller_id = newSeller ? newSeller.sid : product.seller_id;
        product.brand_id = sellerList[5] ?
            sellerList[5].brand_id :
            product.brand_id;
        metadata = metadataBody.map(function(mdItem) {
          mdItem = _lodash2.default.omit(mdItem, 'new_drop_down');
          return mdItem;
        });
        if (product.new_drop_down && product.model) {
          return _this6.modals.brandDropDown.findCreateFind({
            where: {
              title: {
                $iLike: product.model,
              },
              category_id: product.category_id,
              brand_id: product.brand_id,
            },
            defaults: {
              title: product.model,
              category_id: product.category_id,
              brand_id: product.brand_id,
              updated_by: product.updated_by,
              created_by: product.created_by,
              status_type: 11,
            }
          });
        }

        return '';
      }).then(function () {
        product = !product.colour_id ? _lodash2.default.omit(product, 'colour_id') : product;
        product = !product.purchase_cost ? _lodash2.default.omit(product, 'purchase_cost') : product;
        product = _lodash2.default.omit(product, 'new_drop_down');
        product = !product.model && product.model !== '' ?
            _lodash2.default.omit(product, 'model') :
            product;
        product = !product.taxes ? _lodash2.default.omit(product, 'taxes') : product;
        product = !product.document_number ? _lodash2.default.omit(product, 'document_number') : product;
        product = !product.document_date ? _lodash2.default.omit(product, 'document_date') : product;
        product = !product.seller_id ? _lodash2.default.omit(product, 'seller_id') : product;
        product = !product.brand_id ? _lodash2.default.omit(product, 'brand_id') : product;
        return Promise.all([
          _this6.categoryAdaptor.retrieveRenewalTypes({
            status_type: 1,
          }), _this6.updateProduct(productId, product)]);
      }).then(function (updateProductResult) {
        renewalTypes = updateProductResult[0];
        product = updateProductResult[1] || undefined;
        if (product) {
          var serviceSchedule = void 0;
          if (product.main_category_id === 3 && product.model) {
            var diffDays = _moment2.default.utc().
                diff(_moment2.default.utc(product.document_date), 'days', true);
            var diffMonths = _moment2.default.utc().
                diff(_moment2.default.utc(product.document_date), 'months',
                    true);
            serviceSchedule = _this6.serviceScheduleAdaptor.retrieveServiceSchedules(
                {
                  category_id: product.category_id,
                  brand_id: product.brand_id,
                  title: {
                    $iLike: product.model + '%',
                  },
                  $or: {
                    due_in_days: {
                      $gte: diffDays,
                    },
                    due_in_months: {
                      $gte: diffMonths,
                    },
                  },
                  status_type: 1,
                });
          }
          var warrantyItemPromise = [];
          if (otherItems.warranty) {
            _this6.prepareWarrantyPromise({
              otherItems: otherItems,
              renewalTypes: renewalTypes,
              warrantyItemPromise: warrantyItemPromise,
              productBody: product,
              productId: productId,
              sellerList: sellerList,
            });
          }

          var insurancePromise = [];
          if (otherItems.insurance) {
            _this6.prepareInsurancePromise({
              otherItems: otherItems,
              renewalTypes: renewalTypes,
              insurancePromise: insurancePromise,
              productBody: product,
              sellerList: sellerList,
            });
          }

          var amcPromise = [];
          if (otherItems.amc) {
            _this6.prepareAMCPromise({
              renewalTypes: renewalTypes,
              otherItems: otherItems,
              amcPromise: amcPromise,
              productBody: product,
              productId: productId,
              isProductAMCSellerSame: isProductAMCSellerSame,
              sellerList: sellerList,
            });
          }

          var repairPromise = [];
          if (otherItems.repair) {
            _this6.prepareRepairPromise({
              otherItems: otherItems,
              isProductRepairSellerSame: isProductRepairSellerSame,
              sellerList: sellerList,
              isAMCRepairSellerSame: isAMCRepairSellerSame,
              repairPromise: repairPromise,
              productBody: product,
              productId: productId,
            });
          }
          var metadataPromise = metadata.map(function (mdItem) {
            mdItem.status_type = 11;
            if (mdItem.id) {
              return _this6.updateProductMetaData(mdItem.id, mdItem);
            }
            mdItem.product_id = productId;
            return _this6.modals.metaData.create(mdItem);
          });

          var pucPromise = [];
          if (otherItems.puc) {
            _this6.preparePUCPromise({
              renewalTypes: renewalTypes,
              otherItems: otherItems,
              pucPromise: pucPromise,
              productBody: product,
              isProductPUCSellerSame: isProductPUCSellerSame,
              sellerList: sellerList,
              productId: productId,
            });
          }

          return Promise.all([
            Promise.all(metadataPromise),
            Promise.all(insurancePromise),
            Promise.all(warrantyItemPromise),
            Promise.all(amcPromise),
            Promise.all(repairPromise),
            Promise.all(pucPromise),
            serviceSchedule,
            _this6.modals.serviceCenters.count({
              include: [
                {
                  model: _this6.modals.brands,
                  as: 'brands',
                  where: {
                    brand_id: product.brand_id,
                  },
                  attributes: [],
                  required: true,
                }, {
                  model: _this6.modals.centerDetails,
                  where: {
                    category_id: product.category_id,
                  },
                  attributes: [],
                  required: true,
                  as: 'centerDetails',
                }],
            })]);
        }

        return undefined;
      }).then(function (productItemsResult) {
        if (productItemsResult) {
          product.metaData = productItemsResult[0].map(function (mdItem) {
            return mdItem.toJSON();
          });
          product.insurances = productItemsResult[1];
          product.warranties = productItemsResult[2];
          product.amcs = productItemsResult[3];
          product.repairs = productItemsResult[4];
          product.pucDetail = productItemsResult[5];
          if (productItemsResult[6] && productItemsResult[6].length > 0) {
            return _this6.updateProduct(product.id, {
              service_schedule_id: productItemsResult[6][0].id,
            });
          } else if (product.service_schedule_id && !product.model) {
            return _this6.updateProduct(product.id, {
              service_schedule_id: null,
            });
          }
          product.serviceCenterUrl = productItemsResult[7] &&
          productItemsResult[7] > 0 ?
              '/consumer/servicecenters?brandid=' + product.brand_id +
              '&categoryid=' + product.category_id :
              '';
          return product;
        }

        return undefined;
      }).then(function(finalResult) {
        if (finalResult) {
          finalResult.metaData = product.metaData;
          finalResult.insurances = product.insurances;
          finalResult.warranties = product.warranties;
          finalResult.amcs = product.amcs;
          finalResult.repairs = product.repairs;
          finalResult.pucDetails = product.pucDetails;
        }

        return finalResult;
      });
    }
  }, {
    key: 'preparePUCPromise',
    value: function preparePUCPromise(parameters) {
      var otherItems = parameters.otherItems,
          pucPromise = parameters.pucPromise,
          productBody = parameters.productBody,
          isProductPUCSellerSame = parameters.isProductPUCSellerSame,
          sellerList = parameters.sellerList,
          productId = parameters.productId;

      var effective_date = otherItems.puc.effective_date ||
          productBody.document_date;
      effective_date = _moment2.default.utc(effective_date,
          _moment2.default.ISO_8601).isValid() ?
          _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
              startOf('day') :
          _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
      var expiry_date = _moment2.default.utc(effective_date,
          _moment2.default.ISO_8601).
          add(otherItems.puc.expiry_period || 6, 'months').
          subtract(1, 'day').
          endOf('days').
          format('YYYY-MM-DD');
      var values = {
        renewal_type: otherItems.puc.expiry_period || 6,
        updated_by: productBody.user_id,
        status_type: 11,
        renewal_cost: otherItems.puc.value,
        seller_id: isProductPUCSellerSame ? sellerList[0].sid : otherItems.puc.seller_name || otherItems.puc.seller_contact ? sellerList[3].sid : undefined,
        product_id: productId,
        job_id: productBody.job_id,
        expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
        effective_date: _moment2.default.utc(effective_date).
            format('YYYY-MM-DD'),
        document_date: _moment2.default.utc(effective_date).
            format('YYYY-MM-DD'),
        user_id: productBody.user_id
      };
      pucPromise.push(otherItems.puc.id ?
          this.pucAdaptor.updatePUCs(otherItems.puc.id, values) :
          this.pucAdaptor.createPUCs(values));
    }
  }, {
    key: 'prepareRepairPromise',
    value: function prepareRepairPromise(parameters) {
      var otherItems = parameters.otherItems,
          isProductRepairSellerSame = parameters.isProductRepairSellerSame,
          sellerList = parameters.sellerList,
          isAMCRepairSellerSame = parameters.isAMCRepairSellerSame,
          repairPromise = parameters.repairPromise,
          productBody = parameters.productBody,
          productId = parameters.productId;

      var document_date = otherItems.repair.document_date ||
          productBody.document_date;
      document_date = _moment2.default.utc(document_date,
          _moment2.default.ISO_8601).isValid() ?
          _moment2.default.utc(document_date, _moment2.default.ISO_8601).
              startOf('day') :
          _moment2.default.utc(document_date, 'DD MMM YY').startOf('day');

      var repairSellerId = isProductRepairSellerSame ?
          sellerList[0].sid :
          isAMCRepairSellerSame ?
              sellerList[1].sid :
              otherItems.repair.seller_name ||
              otherItems.repair.seller_contact ?
                  sellerList[2].sid :
                  undefined;
      var values = {
        updated_by: productBody.user_id,
        status_type: 11,
        product_id: productId,
        seller_id: repairSellerId,
        document_date: _moment2.default.utc(document_date).format('YYYY-MM-DD'),
        repair_for: otherItems.repair.repair_for,
        job_id: productBody.job_id,
        repair_cost: otherItems.repair.value,
        warranty_upto: otherItems.repair.warranty_upto,
        user_id: productBody.user_id
      };
      repairPromise.push(otherItems.repair.id ?
          this.repairAdaptor.updateRepairs(otherItems.repair.id, values) :
          this.repairAdaptor.createRepairs(values));
    }
  }, {
    key: 'prepareAMCPromise',
    value: function prepareAMCPromise(parameters) {
      var renewalTypes = parameters.renewalTypes,
          otherItems = parameters.otherItems,
          amcPromise = parameters.amcPromise,
          productBody = parameters.productBody,
          productId = parameters.productId,
          isProductAMCSellerSame = parameters.isProductAMCSellerSame,
          sellerList = parameters.sellerList;

      var effective_date = otherItems.amc.effective_date ||
          productBody.document_date;
      effective_date = _moment2.default.utc(effective_date,
          _moment2.default.ISO_8601).isValid() ?
          _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
              startOf('day') :
          _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
      var expiry_date = _moment2.default.utc(effective_date,
          _moment2.default.ISO_8601).
          add(12, 'months').
          subtract(1, 'day').
          endOf('days').
          format('YYYY-MM-DD');
      var values = {
        renewal_type: 8,
        updated_by: productBody.user_id,
        status_type: 11,
        product_id: productId,
        job_id: productBody.job_id,
        renewal_cost: otherItems.amc.value,
        seller_id: isProductAMCSellerSame ? sellerList[0].sid : otherItems.amc.seller_name || otherItems.amc.seller_contact ? sellerList[1].sid : undefined,
        expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
        effective_date: _moment2.default.utc(effective_date).
            format('YYYY-MM-DD'),
        document_date: _moment2.default.utc(effective_date).
            format('YYYY-MM-DD'),
        user_id: productBody.user_id
      };
      amcPromise.push(otherItems.amc.id ?
          this.amcAdaptor.updateAMCs(otherItems.amc.id, values) :
          this.amcAdaptor.createAMCs(values));
    }
  }, {
    key: 'prepareInsurancePromise',
    value: function prepareInsurancePromise(parameters) {
      var otherItems = parameters.otherItems,
          insurancePromise = parameters.insurancePromise,
          productBody = parameters.productBody,
          sellerList = parameters.sellerList,
          renewalTypes = parameters.renewalTypes;

      var product_id = productBody.id;
      var insuranceRenewalType = renewalTypes.find(function(item) {
        return item.type === 8;
      });
      if (otherItems.insurance.renewal_type) {
        insuranceRenewalType = renewalTypes.find(function(item) {
          return item.type === otherItems.insurance.renewal_type;
        });
      }

      var effective_date = otherItems.insurance.effective_date ||
          productBody.document_date;
      effective_date = _moment2.default.utc(effective_date,
          _moment2.default.ISO_8601).isValid() ?
          _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
              startOf('day') :
          _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
      var expiry_date = _moment2.default.utc(effective_date,
          _moment2.default.ISO_8601).
          add(insuranceRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      var values = {
        renewal_type: otherItems.insurance.renewal_type || 8,
        updated_by: productBody.user_id,
        job_id: productBody.job_id,
        status_type: 11,
        product_id: product_id,
        expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
        effective_date: _moment2.default.utc(effective_date).
            format('YYYY-MM-DD'),
        document_date: _moment2.default.utc(effective_date).
            format('YYYY-MM-DD'),
        document_number: otherItems.insurance.policy_no,
        provider_id: otherItems.insurance.provider_name && sellerList[4] ?
            sellerList[4].id :
            otherItems.insurance.provider_id,
        amount_insured: otherItems.insurance.amount_insured,
        renewal_cost: otherItems.insurance.value,
        user_id: productBody.user_id
      };
      insurancePromise.push(otherItems.insurance.id ?
          this.insuranceAdaptor.updateInsurances(otherItems.insurance.id,
              values) :
          this.insuranceAdaptor.createInsurances(values));
    }
  }, {
    key: 'prepareWarrantyPromise',
    value: function prepareWarrantyPromise(parameters) {
      var otherItems = parameters.otherItems,
          renewalTypes = parameters.renewalTypes,
          warrantyItemPromise = parameters.warrantyItemPromise,
          productBody = parameters.productBody,
          productId = parameters.productId,
          sellerList = parameters.sellerList;

      var warrantyRenewalType = void 0;
      var expiry_date = void 0;
      if (otherItems.warranty.id) {
        this.warrantyAdaptor.updateWarranties(otherItems.warranty.id,
            {status_type: 11});
      }

      if (otherItems.warranty.extended_id) {
        this.warrantyAdaptor.updateWarranties(otherItems.warranty.extended_id,
            {status_type: 11});
      }

      if (otherItems.warranty.dual_id) {
        this.warrantyAdaptor.updateWarranties(otherItems.warranty.dual_id,
            {status_type: 11});
      }

      if (otherItems.warranty.renewal_type) {
        warrantyRenewalType = renewalTypes.find(function (item) {
          return item.type === otherItems.warranty.renewal_type;
        });
        var effective_date = otherItems.warranty.effective_date ||
            productBody.document_date;
        effective_date = _moment2.default.utc(effective_date,
            _moment2.default.ISO_8601).isValid() ?
            _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
                startOf('day') :
            _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
        expiry_date = _moment2.default.utc(effective_date,
            _moment2.default.ISO_8601).
            add(warrantyRenewalType.effective_months, 'months').
            subtract(1, 'day').
            endOf('days');
        warrantyItemPromise.push(otherItems.warranty.id ? this.warrantyAdaptor.updateWarranties(otherItems.warranty.id, {
          renewal_type: otherItems.warranty.renewal_type,
          updated_by: productBody.user_id,
          status_type: 11,
          job_id: productBody.job_id,
          product_id: productId,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
          effective_date: _moment2.default.utc(effective_date).
              format('YYYY-MM-DD'),
          document_date: _moment2.default.utc(effective_date).
              format('YYYY-MM-DD'),
          warranty_type: 1,
          user_id: productBody.user_id
        }) : this.warrantyAdaptor.createWarranties({
          renewal_type: otherItems.warranty.renewal_type,
          updated_by: productBody.user_id,
          status_type: 11,
          job_id: productBody.job_id,
          product_id: productId,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
          effective_date: _moment2.default.utc(effective_date).
              format('YYYY-MM-DD'),
          document_date: _moment2.default.utc(effective_date).
              format('YYYY-MM-DD'),
          warranty_type: 1,
          user_id: productBody.user_id
        }));
      }

      if (otherItems.warranty.extended_renewal_type) {
        warrantyRenewalType = renewalTypes.find(function (item) {
          return item.type === otherItems.warranty.extended_renewal_type;
        });
        var _effective_date7 = otherItems.warranty.extended_effective_date ||
            expiry_date || productBody.document_date;
        _effective_date7 = _moment2.default.utc(_effective_date7,
            _moment2.default.ISO_8601).isValid() ?
            _moment2.default.utc(_effective_date7, _moment2.default.ISO_8601).
                startOf('day') :
            _moment2.default.utc(_effective_date7, 'DD MMM YY').startOf('day');
        expiry_date = _moment2.default.utc(_effective_date7).
            add(warrantyRenewalType.effective_months, 'months').
            subtract(1, 'day').
            endOf('days');
        warrantyItemPromise.push(otherItems.warranty.extended_id ?
            this.warrantyAdaptor.updateWarranties(
                otherItems.warranty.extended_id, {
          renewal_type: otherItems.warranty.extended_renewal_type,
                  provider_id: otherItems.warranty.extended_provider_name &&
                  sellerList[4] ?
                      sellerList[6].id :
                      otherItems.warranty.extended_provider_id,
          updated_by: productBody.user_id,
          status_type: 11,
          job_id: productBody.job_id,
          product_id: productId,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
                  effective_date: _moment2.default.utc(_effective_date7).
                      format('YYYY-MM-DD'),
                  document_date: _moment2.default.utc(_effective_date7).
                      format('YYYY-MM-DD'),
          warranty_type: 2,
          user_id: productBody.user_id
        }) : this.warrantyAdaptor.createWarranties({
          renewal_type: otherItems.warranty.extended_renewal_type,
              provider_id: otherItems.warranty.extended_provider_name &&
              sellerList[4] ?
                  sellerList[6].id :
                  otherItems.warranty.extended_provider_id,
          updated_by: productBody.user_id,
          status_type: 11,
          job_id: productBody.job_id,
          product_id: productId,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
              effective_date: _moment2.default.utc(_effective_date7).
                  format('YYYY-MM-DD'),
              document_date: _moment2.default.utc(_effective_date7).
                  format('YYYY-MM-DD'),
          warranty_type: 2,
          user_id: productBody.user_id
        }));
      }

      if (otherItems.warranty.dual_renewal_type) {
        warrantyRenewalType = renewalTypes.find(function (item) {
          return item.type === otherItems.warranty.dual_renewal_type;
        });
        var _effective_date8 = otherItems.warranty.effective_date ||
            productBody.document_date;
        _effective_date8 = _moment2.default.utc(_effective_date8,
            _moment2.default.ISO_8601).isValid() ?
            _moment2.default.utc(_effective_date8, _moment2.default.ISO_8601).
                startOf('day') :
            _moment2.default.utc(_effective_date8, 'DD MMM YY').startOf('day');
        expiry_date = _moment2.default.utc(_effective_date8,
            _moment2.default.ISO_8601).
            add(warrantyRenewalType.effective_months, 'months').
            subtract(1, 'day').
            endOf('days');
        warrantyItemPromise.push(otherItems.warranty.dual_id ? this.warrantyAdaptor.updateWarranties(otherItems.warranty.dual_id, {
          renewal_type: otherItems.warranty.dual_renewal_type,
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          job_id: productBody.job_id,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
          effective_date: _moment2.default.utc(_effective_date8).
              format('YYYY-MM-DD'),
          document_date: _moment2.default.utc(_effective_date8).
              format('YYYY-MM-DD'),
          warranty_type: 3,
          user_id: productBody.user_id
        }) : this.warrantyAdaptor.createWarranties({
          renewal_type: otherItems.warranty.dual_renewal_type,
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          job_id: productBody.job_id,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
          effective_date: _moment2.default.utc(_effective_date8).
              format('YYYY-MM-DD'),
          document_date: _moment2.default.utc(_effective_date8).
              format('YYYY-MM-DD'),
          warranty_type: 3,
          user_id: productBody.user_id
        }));
      }

      if (otherItems.warranty.accessory_renewal_type) {
        warrantyRenewalType = renewalTypes.find(function (item) {
          return item.type === otherItems.warranty.accessory_renewal_type;
        });
        var _effective_date9 = otherItems.warranty.effective_date ||
            productBody.document_date;
        _effective_date9 = _moment2.default.utc(_effective_date9,
            _moment2.default.ISO_8601).isValid() ?
            _moment2.default.utc(_effective_date9, _moment2.default.ISO_8601).
                startOf('day') :
            _moment2.default.utc(_effective_date9, 'DD MMM YY').startOf('day');
        expiry_date = _moment2.default.utc(_effective_date9).
            add(warrantyRenewalType.effective_months, 'months').
            subtract(1, 'day').
            endOf('days');
        warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
          renewal_type: otherItems.warranty.accessory_renewal_type,
          updated_by: productBody.user_id,
          status_type: 11,
          job_id: productBody.job_id,
          product_id: productId,
          expiry_date: _moment2.default.utc(expiry_date).format('YYYY-MM-DD'),
          effective_date: _moment2.default.utc(_effective_date9).
              format('YYYY-MM-DD'),
          document_date: _moment2.default.utc(_effective_date9).
              format('YYYY-MM-DD'),
          warranty_type: 4,
          user_id: productBody.user_id
        }));
      }
    }
  }, {
    key: 'prepareSellerPromise',
    value: function prepareSellerPromise(parameters) {
      var sellerPromise = parameters.sellerPromise,
          productBody = parameters.productBody,
          otherItems = parameters.otherItems,
          isProductAMCSellerSame = parameters.isProductAMCSellerSame,
          isProductRepairSellerSame = parameters.isProductRepairSellerSame,
          isProductPUCSellerSame = parameters.isProductPUCSellerSame,
          isAMCRepairSellerSame = parameters.isAMCRepairSellerSame;

      sellerPromise.push(
          productBody.seller_contact || productBody.seller_name ||
          productBody.seller_email || productBody.seller_address ?
              this.sellerAdaptor.retrieveOrCreateOfflineSellers({
                seller_name: productBody.seller_name ||
                productBody.product_name,
                contact_no: productBody.seller_contact,
              }, {
                seller_name: productBody.seller_name ||
                productBody.product_name,
        contact_no: productBody.seller_contact,
                email: productBody.seller_email,
                address: productBody.seller_address,
        updated_by: productBody.user_id,
        created_by: productBody.user_id,
        status_type: 11
      }) : '');
      sellerPromise.push(otherItems.amc && !isProductAMCSellerSame &&
      (otherItems.amc.seller_contact || otherItems.amc.seller_name) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers({
            seller_name: otherItems.amc.seller_name,
            contact_no: otherItems.amc.seller_contact,
          }, {
        seller_name: otherItems.amc.seller_name,
            contact_no: otherItems.amc.seller_contact,
        updated_by: productBody.user_id,
        created_by: productBody.user_id,
        status_type: 11
      }) : '');
      sellerPromise.push(
          otherItems.repair && !otherItems.repair.is_amc_seller &&
          !isProductRepairSellerSame && !isAMCRepairSellerSame &&
          (otherItems.repair.seller_contact || otherItems.repair.seller_name) ?
              this.sellerAdaptor.retrieveOrCreateOfflineSellers({
                seller_name: otherItems.repair.seller_name,
                contact_no: otherItems.repair.seller_contact,
              }, {
        seller_name: otherItems.repair.seller_name,
                contact_no: otherItems.repair.seller_contact,
        updated_by: productBody.user_id,
        created_by: productBody.user_id,
        status_type: 11
      }) : '');
      sellerPromise.push(otherItems.puc && !isProductPUCSellerSame &&
      (otherItems.puc.seller_contact || otherItems.puc.seller_name) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers({
            seller_name: otherItems.puc.seller_name,
            contact_no: otherItems.puc.seller_contact,
          }, {
        seller_name: otherItems.puc.seller_name,
            contact_no: otherItems.puc.seller_contact,
        updated_by: productBody.user_id,
        created_by: productBody.user_id,
        status_type: 11
      }) : '');
    }
  }, {
    key: 'retrieveProductMetadata',
    value: function retrieveProductMetadata(options) {
      var _this7 = this;

      return this.modals.metaData.findAll({
        where: options,
        include: [{
          model: this.modals.categoryForms,
          as: 'categoryForm',
          attributes: []
        }],

        attributes: [
          'id',
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
      }).then(function (metaDataResult) {
        var metaData = metaDataResult.map(function (item) {
          return item.toJSON();
        });
        var categoryFormIds = metaData.map(function (item) {
          return item.categoryFormId;
        });

        console.log({
          metaData: metaData, categoryFormIds: categoryFormIds,
        });
        return Promise.all([
          metaData, _this7.modals.dropDowns.findAll({
          where: {
            category_form_id: categoryFormIds
          },
          attributes: ['id', 'title']
        })]);
      }).then(function (result) {
        var unOrderedMetaData = result[0].map(function (item) {
          var metaDataItem = item;

          console.log({
            metaDataItem: metaDataItem,
          });
          if (metaDataItem.formType === 2 && metaDataItem.value) {
            var dropDown = result[1].find(function (item) {
              return item.id === parseInt(metaDataItem.value);
            });
            metaDataItem.value = dropDown ? dropDown.title : metaDataItem.value;
          }

          return metaDataItem;
        }).filter(function(item) {
          return item.value;
        });

        console.log({
          unOrderedMetaData: unOrderedMetaData,
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
          user_id: user.id || user.ID,
          brand_id: brandId,
          status_id: 1
        },
        defaults: {
          user_id: user.id || user.ID,
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
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
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
        user_id: user.id || user.ID,
        seller_id: sellerId,
        status_id: 1
      } : {
        user_id: user.id || user.ID,
        offline_seller_id: sellerId,
        status_id: 1
      };

      var defaultClause = isOnlineSeller ? {
        user_id: user.id || user.ID,
        seller_id: sellerId,
        status_id: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      } : {
        user_id: user.id || user.ID,
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
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
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
        user_id: user.id || user.ID,
        bill_product_id: productId,
        status_id: 1
      };

      return this.modals.productReviews.findCreateFind({
        where: whereClause,
        defaults: {
          user_id: user.id || user.ID,
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
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
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
      var _this8 = this;

      if (!options.status_type) {
        options.status_type = [5, 11];
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
          'copies',
          'user_id'],
      }).then(function (productResult) {
        console.log(productResult.map(function(item) {
          return item.toJSON();
        }));
        var products = productResult.map(function(item) {
          var productItem = item.toJSON();
          if (productItem.copies) {
            productItem.copies = productItem.copies.map(function(copyItem) {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }

          return productItem;
        });
        var product_id = products.map(function(item) {
          return item.id;
        });
        console.log('\n\n\n\n\n\n\n\n');
        console.log({
          product_id: product_id,
        });
        return Promise.all([
          _this8.retrieveProductMetadata({
            product_id: product_id,
          }), products]);
      });
    }
  }, {
    key: 'retrieveMissingDocProducts',
    value: function retrieveMissingDocProducts(options) {
      var _this9 = this;

      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9]
        };
      }

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        attributes: ['id', ['product_name', 'productName'], ['purchase_cost', 'value'], ['main_category_id', 'masterCategoryId'], 'taxes', ['document_date', 'purchaseDate'], ['document_number', 'documentNo'], ['updated_at', 'updatedDate'], ['bill_id', 'billId'], ['job_id', 'jobId'], 'copies', 'user_id']
      }).then(function (productResult) {
        products = productResult.map(function (item) {
          var product = item.toJSON();
          product.hasDocs = product.copies.length > 0;
          return product;
        });
        return Promise.all([
          _this9.insuranceAdaptor.retrieveInsurances({
          product_id: {
            $in: products.filter(function (item) {
              return item.masterCategoryId === 2 || item.masterCategoryId === 3;
            }).map(function (item) {
              return item.id;
            })
          }
          }), _this9.warrantyAdaptor.retrieveWarranties({
          product_id: {
            $in: products.filter(function (item) {
              return item.masterCategoryId === 2 || item.masterCategoryId === 3;
            }).map(function (item) {
              return item.id;
            })
          }
        })]);
      }).then(function (results) {
        var insurances = results[0];
        var warranties = results[1];

        products = products.map(function (productItem) {
          if (productItem.masterCategoryId === 2 || productItem.masterCategoryId === 3) {
            productItem.hasInsurance = insurances.filter(function (item) {
              return item.productId === productItem.id;
            }).length > 0;

            productItem.hasWarranty = warranties.filter(function (item) {
              return item.productId === productItem.id;
            }).length > 0;
          }

          return productItem;
        });

        return products.filter(function (pItem) {
          return !pItem.hasDocs || pItem.hasInsurance && pItem.hasInsurance === false || pItem.hasWarranty && pItem.hasWarranty === false;
        });
      });
    }
  }, {
    key: 'retrieveProductExpenses',
    value: function retrieveProductExpenses(options) {
      if (!options.status_type) {
        options.status_type = {
          $notIn: [3, 9]
        };
      }

      return this.modals.products.findAll({
        where: options,
        attributes: ['id', ['product_name', 'productName'], ['purchase_cost', 'value'], ['main_category_id', 'masterCategoryId'], 'taxes', ['document_date', 'purchaseDate'], ['document_number', 'documentNo'], ['updated_at', 'updatedDate'], ['bill_id', 'billId'], ['job_id', 'jobId'], 'copies', 'user_id']
      }).then(function (productResult) {
        return productResult.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'prepareProductDetail',
    value: function prepareProductDetail(parameters) {
      var user = parameters.user,
          request = parameters.request;

      var productId = request.params.id;
      return this.retrieveProductById(productId, {
        user_id: user.id || user.ID,
        status_type: [5, 8, 11]
      }).then(function (result) {
        if (result) {
          return {
            status: true,
            message: 'Successful',
            product: result,
            forceUpdate: request.pre.forceUpdate
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
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return {
          status: false,
          message: 'Unable to retrieve data',
          product: {},
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'createEmptyProduct',
    value: function createEmptyProduct(productDetail) {
      return this.modals.products.create(productDetail).then(function (productResult) {
        var productData = productResult.toJSON();
        return {
          id: productData.id,
          job_id: productData.job_id
        };
      });
    }
  }, {
    key: 'updateProduct',
    value: function updateProduct(id, productDetail) {
      var _this10 = this;

      return this.modals.products.findOne({
        where: {
          id: id
        }
      }).then(function (productResult) {
        var itemDetail = productResult.toJSON();
        var currentPurchaseDate = itemDetail.document_date;
        if (productDetail.copies && productDetail.copies.length > 0 &&
            itemDetail.copies && itemDetail.copies.length > 0) {
          var _productDetail$copies;

          var newCopies = productDetail.copies;
          productDetail.copies = itemDetail.copies;
          (_productDetail$copies = productDetail.copies).push.apply(
              _productDetail$copies, _toConsumableArray(newCopies));
        }

        productDetail.status_type = itemDetail.status_type !== 8 ?
            11 :
            productDetail.status_type || itemDetail.status_type;
        productResult.updateAttributes(productDetail);
        productDetail = productResult.toJSON();
        if (productDetail.document_date &&
            _moment2.default.utc(currentPurchaseDate,
                _moment2.default.ISO_8601).valueOf() !==
            _moment2.default.utc(productDetail.document_date,
                _moment2.default.ISO_8601).valueOf()) {
          return Promise.all([
            _this10.warrantyAdaptor.updateWarrantyPeriod(
                {product_id: id, user_id: productDetail.user_id},
                currentPurchaseDate, productDetail.document_date),
            _this10.insuranceAdaptor.updateInsurancePeriod(
                {product_id: id, user_id: productDetail.user_id},
                currentPurchaseDate, productDetail.document_date),
            _this10.pucAdaptor.updatePUCPeriod(
                {product_id: id, user_id: productDetail.user_id},
                currentPurchaseDate, productDetail.document_date),
            _this10.amcAdaptor.updateAMCPeriod(
                {product_id: id, user_id: productDetail.user_id},
                currentPurchaseDate, productDetail.document_date)]).
              catch(function(err) {
                return console.log('Error on ' + new Date() + ' for user ' +
                    productDetail.user_id + ' is as follow: \n \n ' + err);
              });
        }

        return undefined;
      }).then(function() {
        return productDetail;
      });
    }
  }, {
    key: 'updateProductMetaData',
    value: function updateProductMetaData(id, values) {
      return this.modals.metaData.findOne({
        where: {
          id: id
        }
      }).then(function(result) {
        result.updateAttributes(values);
        return result;
      });
    }
  }, {
    key: 'deleteProduct',
    value: function deleteProduct(id, userId) {
      var _this11 = this;

      return this.modals.products.findById(id).then(function(result) {
        if (result) {
          var jobPromise = result.job_id ? [
            _this11.modals.jobs.update({
              user_status: 3,
              admin_status: 3,
              ce_status: null,
              qe_status: null,
              updated_by: userId,
            }, {
              where: {
                id: result.job_id,
              },
            }), _this11.modals.jobCopies.update({
              status_type: 3,
              updated_by: userId,
            }, {
              where: {
                job_id: result.job_id,
              },
            })] : [undefined, undefined];
          return Promise.all([
            _this11.modals.products.destroy({
              where: {
                id: id,
                user_id: userId,
              },
            })].concat(jobPromise)).then(function() {
            return true;
          });
        }

        return true;
      });
    }
  }, {
    key: 'removeProducts',
    value: function removeProducts(id, copyId, values) {
      var _this12 = this;

      return this.modals.products.findOne({
        where: {
          id: id,
        }
      }).then(function(result) {
        var itemDetail = result.toJSON();
        if (copyId && itemDetail.copies.length > 0) {
          values.copies = itemDetail.copies.filter(function(item) {
            return item.copyId !== parseInt(copyId);
          });
          result.updateAttributes(values);

          return result.toJSON();
        }

        return _this12.modals.products.destroy({
          where: {
            id: id,
          }
        }).then(function() {
          return true;
        });
      });
    }
  }]);

  return ProductAdaptor;
}();

exports.default = ProductAdaptor;