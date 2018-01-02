/*jshint esversion: 6 */
'use strict';

import BrandAdaptor from './brands';
import InsuranceAdaptor from './insurances';
import WarrantyAdaptor from './warranties';
import PUCAdaptor from './pucs';
import AMCAdaptor from './amcs';
import RepairAdaptor from './repairs';
import CategoryAdaptor from './category';
import SellerAdaptor from './sellers';
import _ from 'lodash';
import moment from 'moment/moment';

class ProductAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.brandAdaptor = new BrandAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.pucAdaptor = new PUCAdaptor(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.sellerAdaptor = new SellerAdaptor(modals);
  }

  retrieveProducts(options) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }

    let billOption = {};
    if (options.status_type === 8) {
      billOption.status_type = 5;
    }

    if (options.online_seller_id) {
      billOption.seller_id = options.online_seller_id;
    }
    options = _.omit(options, 'online_seller_id');

    let inProgressProductOption = {};
    _.assignIn(inProgressProductOption, options);
    options = _.omit(options, 'product_status_type');
    if (!inProgressProductOption.product_name) {
      inProgressProductOption = _.omit(options, 'product_name');
    }
    if (!inProgressProductOption.brand_id) {
      inProgressProductOption = _.omit(options, 'brand_id');
    }
    if (!inProgressProductOption.seller_id) {
      inProgressProductOption = _.omit(options, 'seller_id');
    }
    if (!inProgressProductOption.online_seller_id) {
      inProgressProductOption = _.omit(options, 'online_seller_id');
    }

    let products;
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
                  this.modals.sequelize.col('"brand"."brand_id"'), '/reviews'),
              'reviewUrl']],
          required: false,
        },
        {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false,
        },
        {
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
                      this.modals.sequelize.literal('"bill->sellers"."sid"'),
                      '/reviews?isonlineseller=true'), 'reviewUrl']],
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
                },
              ],
              required: false,
            }],
          required: options.status_type === 8,
        },
        {
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
            ['contact_no', 'contact'],
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
                  '/reviews?isonlineseller=false'), 'reviewUrl']],
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
            },
          ],
          required: false,
        },
        {
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
        },
        {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false,
        },
      ],
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
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
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
        'status_type',
      ],
      order: [['document_date', 'DESC']],
    }).then((productResult) => {
      products = productResult.map((item) => item.toJSON());
      if (billOption.seller_id && billOption.seller_id.length > 0) {
        products = products.filter(
            (item) => item.bill && billOption.seller_id.find(
                sItem => parseInt(item.bill.seller_id) === parseInt(sItem)));
      }
      inProgressProductOption = _.omit(inProgressProductOption, 'product_name');
      inProgressProductOption.status_type = [5, 12];
      inProgressProductOption.product_status_type = options.status_type;
      let warrantyOptions = {};
      _.assignIn(warrantyOptions, inProgressProductOption);
      warrantyOptions.warranty_type = [1, 2];
      if (products.length > 0) {
        inProgressProductOption.product_id = products.map((item) => item.id);
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: {
              $in: products.map((item) => item.id),
            },
          }),
          this.insuranceAdaptor.retrieveInsurances(inProgressProductOption),
          this.warrantyAdaptor.retrieveWarranties(warrantyOptions),
          this.amcAdaptor.retrieveAMCs(inProgressProductOption),
          this.repairAdaptor.retrieveRepairs(inProgressProductOption),
          this.pucAdaptor.retrievePUCs(inProgressProductOption)]);
      }
      return undefined;
    }).then((results) => {
      if (results) {
        const metaData = results[0];
        products = products.map((productItem) => {
          const pucItem = metaData.find(
              (item) => item.name.toLowerCase().includes('puc'));
          if (pucItem) {
            productItem.pucDetail = {
              expiry_date: pucItem.value,
            };
          }
          productItem.productMetaData = metaData.filter(
              (item) => item.productId === productItem.id &&
                  !item.name.toLowerCase().includes('puc'));
          productItem.insuranceDetails = results[1].filter(
              (item) => item.productId === productItem.id);
          productItem.warrantyDetails = results[2].filter(
              (item) => item.productId === productItem.id);
          productItem.amcDetails = results[3].filter(
              (item) => item.productId === productItem.id);
          productItem.repairBills = results[4].filter(
              (item) => item.productId === productItem.id);
          productItem.pucDetails = results[5].filter(
              (item) => item.productId === productItem.id);

          productItem.requiredCount = productItem.insuranceDetails.length +
              productItem.warrantyDetails.length +
              productItem.amcDetails.length +
              productItem.repairBills.length + productItem.pucDetails.length;

          return productItem;
        });
      }

      return products;
    });
  }

  retrieveUsersLastProduct(options) {
    let billOption = {};

    if (options.online_seller_id) {
      billOption.seller_id = options.online_seller_id;
    } else {
      billOption = undefined;
    }
    options = _.omit(options, 'online_seller_id');

    options = _.omit(options, 'product_status_type');

    let product;
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
                  this.modals.sequelize.col('"brand"."brand_id"'), '/reviews'),
              'reviewUrl']],
          required: false,
        },
        {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false,
        },
        {
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
            ['status_type', 'billStatus']],
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
                      '/reviews?isonlineseller=true'), 'reviewUrl']],
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
                },
              ],
              required: false,
            }],
          required: false,
        },
        {
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
            ['contact_no', 'contact'],
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
                  '/reviews?isonlineseller=false'), 'reviewUrl']],
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
            },
          ],
          required: false,
        },
        {
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
        },
      ],
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
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
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
        'status_type',
      ],
      order: [['updated_at', 'DESC']],
    }).then((productResult) => {
      const products = productResult.map(item => item.toJSON()).
          filter(
              (producItem) => producItem.status_type !== 8 ||
                  (producItem.status_type === 8 && producItem.bill &&
                      producItem.bill.billStatus ===
                      5));
      product = products.length > 0 ?
          products[0] :
          undefined;

      if (product) {
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: product.id,
          }),
          this.insuranceAdaptor.retrieveInsurances({
            product_id: product.id,
          }),
          this.warrantyAdaptor.retrieveWarranties({
            product_id: product.id,
            warranty_type: [1, 2],
          }),
          this.amcAdaptor.retrieveAMCs({
            product_id: product.id,
          }),
          this.repairAdaptor.retrieveRepairs({
            product_id: product.id,
          }),
          this.pucAdaptor.retrievePUCs({
            product_id: product.id,
          })]);
      }

      return undefined;
    }).then((results) => {
      if (results) {
        const metaData = results[0];
        const pucItem = metaData.find(
            (item) => item.name.toLowerCase().includes('puc'));
        if (pucItem) {
          product.pucDetail = {
            expiry_date: pucItem.value,
          };
        }
        product.metaData = metaData.filter(
            (item) => !item.name.toLowerCase().includes('puc'));
        product.insuranceDetails = results[1];
        product.warrantyDetails = results[2];
        product.amcDetails = results[3];
        product.repairBills = results[4];
        product.pucDetails = results[5];

        product.requiredCount = product.insuranceDetails.length +
            product.warrantyDetails.length +
            product.amcDetails.length +
            product.repairBills.length + product.pucDetails.length;
      }

      return product;
    });
  }

  retrieveProductIds(options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }

    const billOption = {
      status_type: 5,
    };

    if (options.online_seller_id) {
      billOption.seller_id = options.online_seller_id;
    }

    options = _.omit(options, 'online_seller_id');
    options = _.omit(options, 'product_status_type');

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
        },
      ],
      attributes: ['id'],
    }).then((productResult) => productResult.map((item) => item.toJSON()));
  }

  retrieveProductCounts(options) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }

    let billOption = {};
    if (options.status_type === 8) {
      billOption.status_type = 5;
    }

    const inProgressProductOption = {};
    _.assignIn(inProgressProductOption, options);
    let productResult;
    options = _.omit(options, 'product_status_type');
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
        [this.modals.sequelize.literal('COUNT(*)'), 'productCounts'],
        [
          'main_category_id',
          'masterCategoryId'],
        [
          this.modals.sequelize.literal('max("products"."updated_at")'),
          'lastUpdatedAt'],
      ],
      group: 'main_category_id',
    }).then((productItems) => {
      productResult = productItems.map((item) => item.toJSON());
      inProgressProductOption.status_type = 5;
      inProgressProductOption.product_status_type = options.status_type;
      return Promise.all([
        this.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
        this.insuranceAdaptor.retrieveInsuranceCount(inProgressProductOption),
        this.warrantyAdaptor.retrieveWarrantyCount(inProgressProductOption),
        this.repairAdaptor.retrieveRepairCount(inProgressProductOption)]);
    }).then((results) => {
      if (options.status_type !== 8) {
        return productResult;
      }
      const availableResult = [
        ...results[0],
        ...results[1],
        ...results[2],
        ...results[3]];

      return productResult.filter((item) => availableResult.filter(
          (availResult) => availResult.masterCategoryId ===
              item.masterCategoryId).length > 0);

    });
  }

  retrieveProductById(id, options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }

    options.id = id;
    let products;
    return this.modals.products.findOne({
      where: options,
      include: [
        {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false,
        },
        {
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
                      '/reviews?isonlineseller=true'), 'reviewUrl']],
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
                },
              ],
              required: false,
            }],
          required: false,
        },
        {
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
            ['contact_no', 'contact'],
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
                  '/reviews?isonlineseller=false'), 'reviewUrl']],
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
            },
          ],
          required: false,
        },
        {
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
        },
        {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false,
        },
        {
          model: this.modals.categories,
          as: 'mainCategory',
          attributes: [],
          required: false,
        },
      ],
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
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
        [
          'bill_id',
          'billId'],
        [
          'job_id',
          'jobId'],
        [
          'seller_id',
          'sellerId'],
        ['updated_at', 'updatedDate'],
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
          'serviceCenterUrl'],
      ],
    }).then((productResult) => {
      products = productResult ? productResult.toJSON() : productResult;
      if (products) {
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: products.id,
          }), this.brandAdaptor.retrieveBrandById(products.brandId, {
            category_id: products.categoryId,
          }), this.insuranceAdaptor.retrieveInsurances({
            product_id: products.id,
          }), this.warrantyAdaptor.retrieveWarranties({
            product_id: products.id,
          }), this.amcAdaptor.retrieveAMCs({
            product_id: products.id,
          }), this.repairAdaptor.retrieveRepairs({
            product_id: products.id,
          }),
          this.pucAdaptor.retrievePUCs({
            product_id: products.id,
          })]);
      }
    }).then((results) => {
      if (products) {
        const metaData = results[0];
        const pucItem = metaData.find(
            (item) => item.name.toLowerCase().includes('puc'));
        if (pucItem) {
          products.pucDetail = {
            expiry_date: pucItem.value,
          };
        }
        products.metaData = metaData.filter(
            (item) => !item.name.toLowerCase().includes('puc'));
        products.brand = results[1];
        products.insuranceDetails = results[2];
        products.warrantyDetails = results[3];
        products.amcDetails = results[4];
        products.repairBills = results[5];
        products.pucDetails = results[6];
      }

      return products;
    });
  }

  createProduct(productBody, metadataBody, otherItems) {
    const brandBody = {
      brand_name: productBody.brand_name,
      updated_by: productBody.user_id,
      created_by: productBody.user_id,
      status_type: 11,
    };

    const brandPromise = productBody.brand_name ?
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
    let renewalTypes;
    let product = productBody;
    let metadata;
    return brandPromise.
        then((newItemResult) => {
          const newBrand = productBody.brand_name ?
              newItemResult[0].toJSON() : undefined;
          product = _.omit(product, 'brand_name');
          product.brand_id = newBrand ?
              newBrand.brand_id :
              product.brand_id;

          const dropDownPromise = metadataBody.map((item) => {
            if (item.new_drop_down) {
              return this.modals.brandDropDown.findCreateFind({
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
          metadata = metadataBody.map((mdItem) => {
            mdItem = _.omit(mdItem, 'new_drop_down');
            return mdItem;
          });
          return Promise.all(dropDownPromise);
        }).then(() => {
          product = !product.colour_id ? _.omit(product, 'colour_id') : product;
          product = !product.purchase_cost ?
              _.omit(product, 'purchase_cost') :
              product;
          product = !product.taxes ? _.omit(product, 'taxes') : product;
          product = !product.document_number ?
              _.omit(product, 'document_number') :
              product;
          product = !product.document_date ?
              _.omit(product, 'document_date') :
              product;
          product = !product.seller_id ? _.omit(product, 'seller_id') : product;

          return Promise.all([
            this.modals.products.count({
              where: product,
              include: [
                {
                  model: this.modals.metaData, where: {
                    $and: metadata,
                  }, required: true, as: 'metaData',
                },
              ],
            }), this.categoryAdaptor.retrieveRenewalTypes({
              id: {
                $gte: 7,
              },
            })]);
        }).then((countRenewalTypeResult) => {
          renewalTypes = countRenewalTypeResult[1];
          if (countRenewalTypeResult[0] === 0) {
            return this.modals.products.create(product);
          }

          return undefined;
        }).then((productResult) => {
          if (productResult) {
            product = productResult.toJSON();
            const warrantyItemPromise = [];
            if (otherItems.warranty) {
              let warrantyRenewalType;
              let expiry_date;
              if (otherItems.warranty.renewal_type) {
                warrantyRenewalType = renewalTypes.find(
                    item => item.type === otherItems.warranty.renewal_type);
                const effective_date = moment(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment(effective_date, moment.ISO_8601).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment(effective_date).format('YYYY-MM-DD'),
                  document_date: moment(effective_date).format('YYYY-MM-DD'),
                  warranty_type: 1,
                  user_id: productBody.user_id,
                }));
              }

              if (otherItems.warranty.dual_renewal_type) {
                warrantyRenewalType = renewalTypes.find(item => item.type ===
                    otherItems.warranty.dual_renewal_type);
                const effective_date = moment(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment(effective_date, moment.ISO_8601).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.dual_renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment(effective_date).format('YYYY-MM-DD'),
                  document_date: moment(effective_date).format('YYYY-MM-DD'),
                  warranty_type: 3,
                  user_id: productBody.user_id,
                }));
              }

              if (otherItems.warranty.extended_renewal_type) {
                warrantyRenewalType = renewalTypes.find(item => item.type ===
                    otherItems.warranty.extended_renewal_type);
                const effective_date = moment(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment(effective_date).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.extended_renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment(effective_date).format('YYYY-MM-DD'),
                  document_date: moment(effective_date).format('YYYY-MM-DD'),
                  warranty_type: 2,
                  user_id: productBody.user_id,
                }));
              }

              if (otherItems.warranty.accessory_renewal_type) {
                warrantyRenewalType = renewalTypes.find(item => item.type ===
                    otherItems.warranty.accessory_renewal_type);
                const effective_date = moment(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment(effective_date).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.accessory_renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment(effective_date).format('YYYY-MM-DD'),
                  document_date: moment(effective_date).format('YYYY-MM-DD'),
                  warranty_type: 4,
                  user_id: productBody.user_id,
                }));
              }
            }

            const insurancePromise = [];
            if (otherItems.insurance) {
              const effective_date = moment(
                  otherItems.insurance.effective_date, moment.ISO_8601).
                  isValid() ?
                  moment(otherItems.insurance.effective_date,
                      moment.ISO_8601).startOf('day') :
                  moment(otherItems.insurance.effective_date, 'DD MMM YY').
                      startOf('day');
              const expiry_date = moment(effective_date,
                  moment.ISO_8601).
                  add(8759, 'hours').
                  endOf('days');
              insurancePromise.push(this.insuranceAdaptor.createInsurances({
                renewal_type: 8,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment(effective_date).format('YYYY-MM-DD'),
                document_date: moment(effective_date).format('YYYY-MM-DD'),
                document_number: otherItems.insurance.policy_no,
                provider_id: otherItems.insurance.provider_id,
                amount_insured: otherItems.insurance.amount_insured,
                renewal_cost: otherItems.insurance.renewal_cost,
                user_id: productBody.user_id,
              }));
            }

            const amcPromise = [];
            if (otherItems.amc) {
              const amcRenewalType = renewalTypes.find(
                  item => item.type === 8);
              const effective_date = moment(otherItems.amc.effective_date,
                  moment.ISO_8601).isValid() ?
                  moment(otherItems.amc.effective_date, moment.ISO_8601).
                      startOf('day') :
                  moment(otherItems.amc.effective_date, 'DD MMM YY').
                      startOf('day');
              const expiry_date = moment(effective_date,
                  moment.ISO_8601).
                  add(amcRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days').
                  format('YYYY-MM-DD');
              amcPromise.push(this.amcAdaptor.createAMCs({
                renewal_type: 8,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment(effective_date).format('YYYY-MM-DD'),
                document_date: moment(effective_date).format('YYYY-MM-DD'),
                user_id: productBody.user_id,
              }));
            }
            const metadataPromise = metadata.map((mdItem) => {
              mdItem.product_id = product.id;
              mdItem.status_type = 8;

              return this.modals.metaData.create(mdItem);
            });

            const pucPromise = [];
            if (otherItems.puc) {
              const pucRenewalType = renewalTypes.find(
                  item => item.type === otherItems.puc.expiry_period || 7);
              const effective_date = moment(otherItems.puc.effective_date,
                  moment.ISO_8601).isValid() ?
                  moment(otherItems.puc.effective_date, moment.ISO_8601).
                      startOf('day') :
                  moment(otherItems.puc.effective_date, 'DD MMM YY').
                      startOf('day');
              const expiry_date = moment(effective_date,
                  moment.ISO_8601).
                  add(pucRenewalType.effective_months, 'months').
                  subtract(1, 'day').
                  endOf('days').format('YYYY-MM-DD');
              pucPromise.push(otherItems.puc.id ?
                  this.pucAdaptor.updatePUCs(otherItems.puc.id, {
                    renewal_type: otherItems.puc.expiry_period || 7,
                    updated_by: productBody.user_id,
                    status_type: 11,
                    seller_id: isProductPUCSellerSame ?
                        sellerList[0].sid :
                        otherItems.puc.seller_name ||
                        otherItems.puc.seller_contact ?
                            sellerList[3].sid :
                            undefined,
                    product_id: productId,
                    expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                    effective_date: moment(effective_date).format('YYYY-MM-DD'),
                    document_date: moment(effective_date).format('YYYY-MM-DD'),
                    user_id: productBody.user_id,
                  }) :
                  this.pucAdaptor.createPUCs({
                    renewal_type: otherItems.puc.expiry_period || 7,
                    updated_by: productBody.user_id,
                    status_type: 11,
                    renewal_cost: otherItems.puc.renewal_cost,
                    product_id: productId,
                    seller_id: isProductPUCSellerSame ?
                        sellerList[0].sid :
                        otherItems.puc.seller_name ||
                        otherItems.puc.seller_contact ?
                            sellerList[3].sid :
                            undefined,
                    expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                    effective_date: moment(effective_date).format('YYYY-MM-DD'),
                    document_date: moment(effective_date).format('YYYY-MM-DD'),
                    user_id: productBody.user_id,
                  }));
            }

            return Promise.all([
              metadataPromise,
              insurancePromise,
              warrantyItemPromise,
              amcPromise,
              pucPromise,
            ]);
          }

          return undefined;
        }).then((productItemsResult) => {
          if (productItemsResult) {
            product.metaData = productItemsResult[0].map(
                (mdItem) => mdItem.toJSON());
            product.insurances = productItemsResult[1];
            product.warranties = productItemsResult[2];
            product.amcs = productItemsResult[3];
            product.pucDetail = productItemsResult[4];
            return product;
          }

          return undefined;
        });
  }

  updateProductDetails(productBody, metadataBody, otherItems, productId) {
    const sellerPromise = [];
    const isProductAMCSellerSame = otherItems.amc.seller_contact ===
        productBody.seller_contact;
    const isProductRepairSellerSame = otherItems.repair.seller_contact ===
        productBody.seller_contact;
    const isAMCRepairSellerSame = otherItems.repair.seller_contact ===
        otherItems.amc.seller_contact;
    const isProductPUCSellerSame = otherItems.puc.seller_contact ===
        productBody.seller_contact;
    this.prepareSellerPromise(sellerPromise, productBody, otherItems,
        isProductAMCSellerSame, isProductRepairSellerSame,
        isProductPUCSellerSame);
    let renewalTypes;
    let product = productBody;
    let metadata;
    let sellerList;
    return Promise.all(sellerPromise).
        then((newItemResults) => {
          sellerList = newItemResults;
          const newSeller = productBody.seller_contact ||
          productBody.seller_name ?
              sellerList[0] : undefined;
          product = _.omit(product, 'seller_name');
          product = _.omit(product, 'seller_contact');
          product = _.omit(product, 'brand_name');
          product.seller_id = newSeller ?
              newSeller.sid :
              product.seller_id;

          const dropDownPromise = metadataBody.map((item) => {
            if (item.new_drop_down) {
              return this.modals.brandDropDown.findCreateFind({
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
          metadata = metadataBody.map((mdItem) => {
            mdItem = _.omit(mdItem, 'new_drop_down');
            return mdItem;
          });
          return Promise.all(dropDownPromise);
        }).then(() => {
          product = !product.colour_id ? _.omit(product, 'colour_id') : product;
          product = !product.purchase_cost ?
              _.omit(product, 'purchase_cost') :
              product;
          product = !product.taxes ? _.omit(product, 'taxes') : product;
          product = !product.document_number ?
              _.omit(product, 'document_number') :
              product;
          product = !product.document_date ?
              _.omit(product, 'document_date') :
              product;
          product = !product.seller_id ? _.omit(product, 'seller_id') : product;
          product = !product.brand_id ? _.omit(product, 'brand_id') : product;
          return Promise.all([
            this.categoryAdaptor.retrieveRenewalTypes({
              id: {
                $gte: 7,
              },
            }), this.updateProduct(productId, product)]);
        }).then((updateProductResult) => {
          renewalTypes = updateProductResult[0];
          const productResult = updateProductResult[1];
          if (productResult) {
            product = productResult.toJSON();
            const warrantyItemPromise = [];
            if (otherItems.warranty) {
              this.prepareWarrantyPromise(otherItems, renewalTypes,
                  warrantyItemPromise, productBody, productId);
            }

            const insurancePromise = [];
            if (otherItems.insurance) {
              this.prepareInsurancePromise(otherItems, insurancePromise,
                  productBody, productId);
            }

            const amcPromise = [];
            if (otherItems.amc) {
              this.prepareAMCPromise(renewalTypes, otherItems, amcPromise,
                  productBody, productId, isProductAMCSellerSame, sellerList);
            }

            const repairPromise = [];
            if (otherItems.repair) {
              this.prepareRepairPromise(otherItems, isProductRepairSellerSame,
                  sellerList, isAMCRepairSellerSame, repairPromise, productBody,
                  productId);
            }
            const metadataPromise = metadata.map((mdItem) => {
              if (mdItem.id) {
                mdItem.status_type = 11;
                return this.updateProductMetaData(mdItem.id, mdItem);
              }
              mdItem.product_id = productId;
              return this.modals.metaData.create(mdItem);
            });

            const pucPromise = [];
            if (otherItems.puc) {
              this.preparePUCPromise(renewalTypes, otherItems, pucPromise,
                  productBody, isProductPUCSellerSame, sellerList, productId);
            }

            return Promise.all([
              Promise.all(metadataPromise),
              Promise.all(insurancePromise),
              Promise.all(warrantyItemPromise),
              Promise.all(amcPromise),
              Promise.all(repairPromise),
              Promise.all(pucPromise)]);
          }

          return undefined;
        }).then((productItemsResult) => {
          if (productItemsResult) {
            product.metaData = productItemsResult[0].map(
                (mdItem) => mdItem.toJSON());
            product.insurances = productItemsResult[1];
            product.warranties = productItemsResult[2];
            product.amcs = productItemsResult[3];
            product.repairs = productItemsResult[4];
            product.pucDetail = productItemsResult[5];
            return product;
          }

          return undefined;
        });
  }

  preparePUCPromise(
      renewalTypes, otherItems, pucPromise, productBody, isProductPUCSellerSame,
      sellerList, productId) {
    const pucRenewalType = renewalTypes.find(
        item => item.type === otherItems.puc.expiry_period || 7);
    const effective_date = moment(otherItems.puc.effective_date,
        moment.ISO_8601).isValid() ?
        moment(otherItems.puc.effective_date, moment.ISO_8601).
            startOf('day') :
        moment(otherItems.puc.effective_date, 'DD MMM YY').
            startOf('day');
    const expiry_date = moment(effective_date,
        moment.ISO_8601).
        add(pucRenewalType.effective_months, 'months').
        subtract(1, 'day').
        endOf('days').format('YYYY-MM-DD');
    pucPromise.push(otherItems.puc.id ?
        this.pucAdaptor.updatePUCs(otherItems.puc.id, {
          renewal_type: otherItems.puc.expiry_period || 7,
          updated_by: productBody.user_id,
          status_type: 11,
          seller_id: isProductPUCSellerSame ?
              sellerList[0].sid :
              otherItems.puc.seller_name ||
              otherItems.puc.seller_contact ?
                  sellerList[3].sid :
                  undefined,
          product_id: productId,
          expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
          effective_date: moment(effective_date).format('YYYY-MM-DD'),
          document_date: moment(effective_date).format('YYYY-MM-DD'),
          user_id: productBody.user_id,
        }) :
        this.pucAdaptor.createPUCs({
          renewal_type: otherItems.puc.expiry_period || 7,
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          seller_id: isProductPUCSellerSame ?
              sellerList[0].sid :
              otherItems.puc.seller_name ||
              otherItems.puc.seller_contact ?
                  sellerList[3].sid :
                  undefined,
          expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
          effective_date: moment(effective_date).format('YYYY-MM-DD'),
          document_date: moment(effective_date).format('YYYY-MM-DD'),
          user_id: productBody.user_id,
        }));
  }

  prepareRepairPromise(
      otherItems, isProductRepairSellerSame, sellerList, isAMCRepairSellerSame,
      repairPromise, productBody, productId) {
    const document_date = moment(otherItems.repair.document_date,
        moment.ISO_8601).isValid() ?
        moment(otherItems.repair.document_date, moment.ISO_8601).
            startOf('day') :
        moment(otherItems.repair.document_date, 'DD MMM YY').
            startOf('day');

    const repairSellerId = isProductRepairSellerSame ?
        sellerList[0].sid :
        otherItems.repair.is_amc_seller ||
        isAMCRepairSellerSame ?
            sellerList[1].sid :
            otherItems.repair.seller_name ||
            otherItems.repair.seller_contact ?
                sellerList[2].sid :
                undefined;
    repairPromise.push(otherItems.repair.id ?
        this.repairAdaptor.updateRepairs(otherItems.repair.id, {
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          seller_id: repairSellerId,
          document_date: moment(document_date).format('YYYY-MM-DD'),
          repair_for: otherItems.repair.repair_for,
          repair_cost: otherItems.repair.repair_cost,
          warranty_upto: otherItems.repair.warranty_upto,
          user_id: productBody.user_id,
        }) :
        this.repairAdaptor.createRepairs({
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          document_date: moment(document_date).format('YYYY-MM-DD'),
          seller_id: repairSellerId,
          repair_for: otherItems.repair.repair_for,
          repair_cost: otherItems.repair.repair_cost,
          warranty_upto: otherItems.repair.warranty_upto,
          user_id: productBody.user_id,
        }));
  }

  prepareAMCPromise(
      renewalTypes, otherItems, amcPromise, productBody, productId,
      isProductAMCSellerSame, sellerList) {
    const amcRenewalType = renewalTypes.find(
        item => item.type === 8);
    const effective_date = moment(otherItems.amc.effective_date,
        moment.ISO_8601).isValid() ?
        moment(otherItems.amc.effective_date, moment.ISO_8601).
            startOf('day') :
        moment(otherItems.amc.effective_date, 'DD MMM YY').
            startOf('day');
    const expiry_date = moment(effective_date,
        moment.ISO_8601).
        add(amcRenewalType.effective_months, 'months').
        subtract(1, 'day').
        endOf('days').
        format('YYYY-MM-DD');
    amcPromise.push(otherItems.amc.id ?
        this.amcAdaptor.updateAMCs(otherItems.amc.id, {
          renewal_type: 8,
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          renewal_cost: otherItems.amc.renewal_cost,
          seller_id: isProductAMCSellerSame ?
              sellerList[0].sid :
              otherItems.amc.seller_name ||
              otherItems.amc.seller_contact ?
                  sellerList[1].sid :
                  undefined,
          expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
          effective_date: moment(effective_date).format('YYYY-MM-DD'),
          document_date: moment(effective_date).format('YYYY-MM-DD'),
          user_id: productBody.user_id,
        }) :
        this.amcAdaptor.createAMCs({
          renewal_type: 8,
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          seller_id: isProductAMCSellerSame ?
              sellerList[0].sid :
              otherItems.amc.seller_name ||
              otherItems.amc.seller_contact ?
                  sellerList[1].sid :
                  undefined,
          expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
          effective_date: moment(effective_date).format('YYYY-MM-DD'),
          document_date: moment(effective_date).format('YYYY-MM-DD'),
          user_id: productBody.user_id,
        }));
  }

  prepareInsurancePromise(
      otherItems, insurancePromise, productBody, productId) {
    const effective_date = moment(
        otherItems.insurance.effective_date, moment.ISO_8601).
        isValid() ?
        moment(otherItems.insurance.effective_date,
            moment.ISO_8601).startOf('day') :
        moment(otherItems.insurance.effective_date, 'DD MMM YY').
            startOf('day');
    const expiry_date = moment(effective_date,
        moment.ISO_8601).
        add(8759, 'hours').
        endOf('days');
    insurancePromise.push(otherItems.insurance.id ?
        this.insuranceAdaptor.updateInsurances(
            otherItems.insurance.id, {
              renewal_type: 8,
              updated_by: productBody.user_id,
              status_type: 11,
              product_id: productId,
              expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
              effective_date: moment(effective_date).
                  format('YYYY-MM-DD'),
              document_date: moment(effective_date).
                  format('YYYY-MM-DD'),
              document_number: otherItems.insurance.policy_no,
              provider_id: otherItems.insurance.provider_id,
              amount_insured: otherItems.insurance.amount_insured,
              renewal_cost: otherItems.insurance.renewal_cost,
              user_id: productBody.user_id,
            }) :
        this.insuranceAdaptor.createInsurances({
          renewal_type: 8,
          updated_by: productBody.user_id,
          status_type: 11,
          product_id: productId,
          expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
          effective_date: moment(effective_date).format('YYYY-MM-DD'),
          document_date: moment(effective_date).format('YYYY-MM-DD'),
          document_number: otherItems.insurance.policy_no,
          provider_id: otherItems.insurance.provider_id,
          amount_insured: otherItems.insurance.amount_insured,
          renewal_cost: otherItems.insurance.renewal_cost,
          user_id: productBody.user_id,
        }));
  }

  prepareWarrantyPromise(
      otherItems, renewalTypes, warrantyItemPromise, productBody, productId) {
    let warrantyRenewalType;
    let expiry_date;
    if (otherItems.warranty.renewal_type) {
      warrantyRenewalType = renewalTypes.find(
          item => item.type === otherItems.warranty.renewal_type);
      const effective_date = moment(
          otherItems.warranty.effective_date, moment.ISO_8601).
          isValid() ?
          moment(otherItems.warranty.effective_date,
              moment.ISO_8601).startOf('day') :
          moment(otherItems.warranty.effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment(effective_date, moment.ISO_8601).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(otherItems.warranty.id ?
          this.warrantyAdaptor.updateWarranties(
              otherItems.warranty.id, {
                renewal_type: otherItems.warranty.renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: productId,
                expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment(effective_date).
                    format('YYYY-MM-DD'),
                document_date: moment(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 1,
                user_id: productBody.user_id,
              })
          :
          this.warrantyAdaptor.createWarranties({
            renewal_type: otherItems.warranty.renewal_type,
            updated_by: productBody.user_id,
            status_type: 11,
            product_id: productId,
            expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
            effective_date: moment(effective_date).
                format('YYYY-MM-DD'),
            document_date: moment(effective_date).
                format('YYYY-MM-DD'),
            warranty_type: 1,
            user_id: productBody.user_id,
          }));
    }

    if (otherItems.warranty.extended_renewal_type) {
      warrantyRenewalType = renewalTypes.find(item => item.type ===
          otherItems.warranty.extended_renewal_type);
      const effective_date = otherItems.warranty.extended_effective_date ?
          moment(
              otherItems.warranty.extended_effective_date,
              moment.ISO_8601).
              isValid() ?
              moment(otherItems.warranty.extended_effective_date,
                  moment.ISO_8601).startOf('day') :
              moment(otherItems.warranty.extended_effective_date,
                  'DD MMM YY').
                  startOf('day') :
          expiry_date;
      expiry_date = moment(effective_date).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(otherItems.warranty.id ?
          this.warrantyAdaptor.updateWarranties(
              otherItems.warranty.extended_id, {
                renewal_type: otherItems.warranty.extended_renewal_type,
                provider_id: otherItems.warranty.extended_provider_id,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: productId,
                expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment(effective_date).
                    format('YYYY-MM-DD'),
                document_date: moment(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 2,
                user_id: productBody.user_id,
              })
          : this.warrantyAdaptor.createWarranties({
            renewal_type: otherItems.warranty.extended_renewal_type,
            provider_id: otherItems.warranty.extended_provider_id,
            updated_by: productBody.user_id,
            status_type: 11,
            product_id: productId,
            expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
            effective_date: moment(effective_date).
                format('YYYY-MM-DD'),
            document_date: moment(effective_date).
                format('YYYY-MM-DD'),
            warranty_type: 2,
            user_id: productBody.user_id,
          }));
    }

    if (otherItems.warranty.dual_renewal_type) {
      warrantyRenewalType = renewalTypes.find(item => item.type ===
          otherItems.warranty.dual_renewal_type);
      const effective_date = moment(
          otherItems.warranty.effective_date, moment.ISO_8601).
          isValid() ?
          moment(otherItems.warranty.effective_date,
              moment.ISO_8601).startOf('day') :
          moment(otherItems.warranty.effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment(effective_date, moment.ISO_8601).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(otherItems.warranty.dual_id ?
          this.warrantyAdaptor.updateWarranties(
              otherItems.warranty.dual_id, {
                renewal_type: otherItems.warranty.dual_renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: productId,
                expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment(effective_date).
                    format('YYYY-MM-DD'),
                document_date: moment(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 3,
                user_id: productBody.user_id,
              }) :
          this.warrantyAdaptor.createWarranties({
            renewal_type: otherItems.warranty.dual_renewal_type,
            updated_by: productBody.user_id,
            status_type: 11,
            product_id: productId,
            expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
            effective_date: moment(effective_date).
                format('YYYY-MM-DD'),
            document_date: moment(effective_date).
                format('YYYY-MM-DD'),
            warranty_type: 3,
            user_id: productBody.user_id,
          }));
    }

    if (otherItems.warranty.accessory_renewal_type) {
      warrantyRenewalType = renewalTypes.find(item => item.type ===
          otherItems.warranty.accessory_renewal_type);
      const effective_date = moment(
          otherItems.warranty.effective_date, moment.ISO_8601).
          isValid() ?
          moment(otherItems.warranty.effective_date,
              moment.ISO_8601).startOf('day') :
          moment(otherItems.warranty.effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment(effective_date).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
        renewal_type: otherItems.warranty.accessory_renewal_type,
        updated_by: productBody.user_id,
        status_type: 11,
        product_id: productId,
        expiry_date: moment(expiry_date).format('YYYY-MM-DD'),
        effective_date: moment(effective_date).format('YYYY-MM-DD'),
        document_date: moment(effective_date).format('YYYY-MM-DD'),
        warranty_type: 4,
        user_id: productBody.user_id,
      }));
    }
  }

  prepareSellerPromise(
      sellerPromise, productBody, otherItems, isProductAMCSellerSame,
      isProductRepairSellerSame, isProductPUCSellerSame,
      isAMCRepairSellerSame) {
    sellerPromise.push(productBody.seller_contact ||
    productBody.seller_name ?
        this.sellerAdaptor.retrieveOrCreateOfflineSellers({
              contact_no: productBody.seller_contact,
            },
            {
              seller_name: productBody.seller_name,
              contact_no: productBody.seller_contact,
              updated_by: productBody.user_id,
              created_by: productBody.user_id,
              status_type: 11,
            }) :
        '');
    sellerPromise.push(otherItems.amc && isProductAMCSellerSame &&
    (otherItems.amc.seller_contact ||
        otherItems.amc.seller_name) ?
        this.sellerAdaptor.retrieveOrCreateOfflineSellers({
              contact_no: otherItems.amc.seller_contact,
            },
            {
              seller_name: otherItems.amc.seller_name,
              contact_no: otherItems.amc.contact_no,
              updated_by: productBody.user_id,
              created_by: productBody.user_id,
              status_type: 11,
            }) :
        '');
    sellerPromise.push(otherItems.repair && !otherItems.repair.is_amc_seller &&
    isProductRepairSellerSame && isAMCRepairSellerSame &&
    (otherItems.repair.seller_contact ||
        otherItems.repair.seller_name) ?
        this.sellerAdaptor.retrieveOrCreateOfflineSellers({
              contact_no: otherItems.repair.seller_contact,
            },
            {
              seller_name: otherItems.repair.seller_name,
              contact_no: otherItems.repair.contact_no,
              updated_by: productBody.user_id,
              created_by: productBody.user_id,
              status_type: 11,
            }) :
        '');
    sellerPromise.push(otherItems.puc && isProductPUCSellerSame &&
    (otherItems.puc.seller_contact ||
        otherItems.puc.seller_name) ?
        this.sellerAdaptor.retrieveOrCreateOfflineSellers({
              contact_no: otherItems.puc.seller_contact,
            },
            {
              seller_name: otherItems.puc.seller_name,
              contact_no: otherItems.puc.contact_no,
              updated_by: productBody.user_id,
              created_by: productBody.user_id,
              status_type: 11,
            }) :
        '');
  }

  retrieveProductMetadata(options) {
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
    }).then((metaDataResult) => {
      const metaData = metaDataResult.map((item) => item.toJSON());
      const categoryFormIds = metaData.map((item) => item.categoryFormId);

      return Promise.all([
        metaData, this.modals.dropDowns.findAll({
          where: {
            category_form_id: categoryFormIds,
          },
          attributes: ['id', 'title'],
        })]);
    }).then((result) => {
      const unOrderedMetaData = result[0].map((item) => {
        const metaDataItem = item;
        if (metaDataItem.formType === 2 && metaDataItem.value) {
          const dropDown = result[1].find(
              (item) => item.id === parseInt(metaDataItem.value));
          metaDataItem.value = dropDown ? dropDown.title : metaDataItem.value;
        }

        return metaDataItem;
      });

      unOrderedMetaData.sort(
          (itemA, itemB) => itemA.displayIndex - itemB.displayIndex);

      return unOrderedMetaData;
    });
  }

  updateBrandReview(user, brandId, request) {
    const payload = request.payload;
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
    }).then((result) => {
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
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return {
        status: true,
        message: 'Review Update Failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  updateSellerReview(user, sellerId, isOnlineSeller, request) {
    const payload = request.payload;
    const whereClause = isOnlineSeller ? {
      user_id: user.id || user.ID,
      seller_id: sellerId,
      status_id: 1,
    } : {
      user_id: user.id || user.ID,
      offline_seller_id: sellerId,
      status_id: 1,
    };

    const defaultClause = isOnlineSeller ? {
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
    }).then((result) => {
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
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return {
        status: true,
        message: 'Review Update Failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  updateProductReview(user, productId, request) {
    const payload = request.payload;
    const whereClause = {
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
    }).then((result) => {
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
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return {
        status: true,
        message: 'Review Update Failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  retrieveNotificationProducts(options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }

    const billOption = {
      status_type: 5,
    };

    let products;
    return this.modals.products.findAll({
      where: options,
      include: [
        {
          model: this.modals.bills,
          where: billOption,
          required: true,
        },
      ],
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
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
        [
          'bill_id',
          'billId'],
        [
          'job_id',
          'jobId'],
        'copies', 'user_id',
      ],
    }).then((productResult) => {
      products = productResult.map((item) => item.toJSON());
      return this.retrieveProductMetadata({
        product_id: {
          $in: products.map((item) => item.id),
        },
      });
    }).then((results) => {
      const metaData = results;

      products = products.map((productItem) => {
        productItem.productMetaData = metaData.filter(
            (item) => item.productId === productItem.id);

        return productItem;
      });

      return products;
    });
  }

  retrieveMissingDocProducts(options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }

    let products;
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
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
        [
          'bill_id',
          'billId'],
        [
          'job_id',
          'jobId'],
        'copies', 'user_id',
      ],
    }).then((productResult) => {
      products = productResult.map((item) => {
        const product = item.toJSON();
        product.hasDocs = product.copies.length > 0;
        return product;
      });
      return Promise.all([
        this.insuranceAdaptor.retrieveInsurances({
          product_id: {
            $in: products.filter((item) => item.masterCategoryId === 2 ||
                item.masterCategoryId === 3).map((item) => item.id),
          },
        }), this.warrantyAdaptor.retrieveWarranties({
          product_id: {
            $in: products.filter((item) => item.masterCategoryId === 2 ||
                item.masterCategoryId === 3).map((item) => item.id),
          },
        })]);
    }).then((results) => {
      const insurances = results[0];
      const warranties = results[1];

      products = products.map((productItem) => {
        if (productItem.masterCategoryId === 2 ||
            productItem.masterCategoryId === 3) {
          productItem.hasInsurance = insurances.filter(
              (item) => item.productId === productItem.id).length > 0;

          productItem.hasWarranty = warranties.filter(
              (item) => item.productId === productItem.id).length > 0;
        }

        return productItem;
      });

      return products.filter((pItem) => !pItem.hasDocs ||
          (pItem.hasInsurance && pItem.hasInsurance === false) ||
          (pItem.hasWarranty && pItem.hasWarranty === false));
    });
  }

  retrieveProductExpenses(options) {
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
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
        [
          'bill_id',
          'billId'],
        [
          'job_id',
          'jobId'],
        'copies', 'user_id',
      ],
    }).then((productResult) => {
      return productResult.map((item) => item.toJSON());
    });
  }

  prepareProductDetail(user, request) {
    const productId = request.params.id;
    return this.retrieveProductById(productId, {
      user_id: user.id || user.ID,
      status_type: [5, 8, 11],
    }).then((result) => {
      if (result) {
        return ({
          status: true,
          message: 'Successful',
          product: result,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return ({
          status: false,
          product: {},
          message: 'No Data Found',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return {
        status: false,
        message: 'Unable to retrieve data',
        product: {},
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  createEmptyProduct(productDetail) {
    return this.modals.products.create(productDetail).then((productResult) => {
      const productData = productResult.toJSON();
      return {
        id: productData.id,
        job_id: productData.job_id,
      };
    });
  }

  updateProduct(id, productDetail) {
    return this.modals.products.findOne({
      where: {
        id,
      },
    }).then((productResult) => {
      productResult.updateAttributes(productDetail);
      return productResult;
    });
  }

  updateProductMetaData(id, values) {
    return this.modals.metaData.findOne({
      where: {
        id,
      },
    }).
        then(result => {
          result.updateAttributes(values);
          return result.toJSON();
        });
  }
}

export default ProductAdaptor;
