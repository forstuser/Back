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
import ServiceScheduleAdaptor from './serviceSchedules';
import _ from 'lodash';
import moment from 'moment/moment';
import Promise from 'bluebird';
import notificationAdaptor from './notification';

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
    this.serviceScheduleAdaptor = new ServiceScheduleAdaptor(modals);
  }

  retrieveProducts(options, language) {
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

    if (!options.main_category_id) {
      options = _.omit(options, 'main_category_id');
    }

    if (!options.category_id) {
      options = _.omit(options, 'category_id');
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
          model: this.modals.serviceSchedules,
          as: 'schedule',
          attributes: [
            'id', 'inclusions', 'exclusions', 'service_number', 'service_type',
            'distance',
            'due_in_months',
            'due_in_days'],
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
        {
          model: this.modals.categories,
          as: 'mainCategory',
          attributes: [],
          required: false,
        },
        {
          model: this.modals.categories,
          as: 'sub_category',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'id',
        [
          'product_name',
          'productName'],
        'file_type',
        'file_ref',
        [
          this.modals.sequelize.literal('"category"."category_id"'),
          'categoryId'],
        [
          'main_category_id',
          'masterCategoryId'],
        'sub_category_id',
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
        'model',
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
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`),
          'sub_category_name'],
        [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`),
          'categoryName'],
        [
          this.modals.sequelize.literal(`"sub_category"."category_name"`),
          'default_sub_category_name'],
        [
          this.modals.sequelize.literal(`"mainCategory"."category_name"`),
          'default_masterCategoryName'],
        [
          this.modals.sequelize.literal(`"category"."category_name"`),
          'default_categoryName'],
        [
          this.modals.sequelize.literal(`${language ?
              `"mainCategory"."category_name_${language}"` :
              `"mainCategory"."category_name"`}`),
          'masterCategoryName'],
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
      products = productResult.map((item) => {
        const productItem = item.toJSON();
        productItem.sub_category_name = productItem.sub_category_name ||
            productItem.default_sub_category_name;
        productItem.masterCategoryName = productItem.masterCategoryName ||
            productItem.default_masterCategoryName;
        productItem.categoryName = productItem.categoryName ||
            productItem.default_categoryName;
        productItem.purchaseDate = moment.utc(productItem.purchaseDate,
            moment.ISO_8601).
            startOf('days');
        productItem.cImageURL = productItem.sub_category_id ?
            `/categories/${productItem.sub_category_id}/images/1/thumbnail` :
            `${productItem.cImageURL}1/thumbnail`;
        if (productItem.schedule) {
          productItem.schedule.due_date = moment.utc(productItem.purchaseDate,
              moment.ISO_8601).
              add(productItem.schedule.due_in_months, 'months');
        }
        return productItem;
      });
      if (billOption.seller_id && billOption.seller_id.length > 0) {
        products = products.filter(
            (item) => item.bill && billOption.seller_id.find(
                sItem => parseInt(item.bill.seller_id) === parseInt(sItem)));
      }
      inProgressProductOption = _.omit(inProgressProductOption, 'product_name');
      inProgressProductOption.status_type = [5, 11, 12];
      inProgressProductOption.product_status_type = options.status_type;
      let warrantyOptions = {};
      _.assignIn(warrantyOptions, inProgressProductOption);
      warrantyOptions.warranty_type = [1, 2];
      if (products.length > 0) {
        inProgressProductOption.product_id = products.map((item) => item.id);
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: products.map((item) => item.id),
          }, language),
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
          if (productItem.copies) {
            productItem.copies = productItem.copies.map((copyItem) => {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }
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

  retrieveUpcomingProducts(options, language) {
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
            'id', 'inclusions', 'exclusions', 'service_number', 'service_type',
            'distance',
            'due_in_months',
            'due_in_days'],
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
        {
          model: this.modals.categories,
          as: 'sub_category',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'id',
        [
          'id',
          'productId'],
        [
          'product_name',
          'productName'],
        'file_type',
        'file_ref',
        [
          this.modals.sequelize.literal('"category"."category_id"'),
          'categoryId'],
        [
          'main_category_id',
          'masterCategoryId'],
        'sub_category_id',
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
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`),
          'sub_category_name'],
        [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`),
          'categoryName'],
        [
          this.modals.sequelize.literal(`${language ?
              `"mainCategory"."category_name_${language}"` :
              `"mainCategory"."category_name"`}`),
          'masterCategoryName'],
        [
          this.modals.sequelize.literal(`"sub_category"."category_name"`),
          'default_sub_category_name'],
        [
          this.modals.sequelize.literal(`"mainCategory"."category_name"`),
          'default_masterCategoryName'],
        [
          this.modals.sequelize.literal(`"category"."category_name"`),
          'default_categoryName'],
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
    }).then((productResult) => productResult.map((item) => {
      const productItem = item.toJSON();

      productItem.sub_category_name = productItem.sub_category_name ||
          productItem.default_sub_category_name;
      productItem.masterCategoryName = productItem.masterCategoryName ||
          productItem.default_masterCategoryName;
      productItem.categoryName = productItem.categoryName ||
          productItem.default_categoryName;
      if (productItem.copies) {
        productItem.copies = productItem.copies.map((copyItem) => {
          copyItem.file_type = copyItem.file_type || copyItem.fileType;
          return copyItem;
        });
      }
      productItem.cImageURL = productItem.sub_category_id ?
          `/categories/${productItem.sub_category_id}/images/1/thumbnail` :
          `${productItem.cImageURL}1/thumbnail`;
      productItem.purchaseDate = moment.utc(productItem.purchaseDate,
          moment.ISO_8601).
          startOf('days');
      if (productItem.schedule) {
        productItem.schedule.due_date = moment.utc(productItem.purchaseDate,
            moment.ISO_8601).
            add(productItem.schedule.due_in_months, 'months');
      }
      return productItem;
    }));
  }

  retrieveUsersLastProduct(options, language) {
    let billOption = {};
    let products;

    if (options.online_seller_id) {
      billOption.seller_id = options.online_seller_id;
    } else {
      billOption = undefined;
    }
    options = _.omit(options, 'online_seller_id');

    options = _.omit(options, 'product_status_type');

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
          model: this.modals.serviceSchedules,
          as: 'schedule',
          attributes: [
            'id', 'inclusions', 'exclusions', 'service_number', 'service_type',
            'distance',
            'due_in_months',
            'due_in_days'],
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
        {
          model: this.modals.categories,
          as: 'sub_category',
          attributes: [],
          required: false,
        },
        {
          model: this.modals.categories,
          as: 'mainCategory',
          attributes: [],
          required: false,
        }, {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'id',
        'file_type',
        'file_ref',
        [
          'product_name',
          'productName'],
        'model',
        [
          'category_id',
          'categoryId'],
        [
          'main_category_id',
          'masterCategoryId'],
        'sub_category_id',
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
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`),
          'sub_category_name'],
        [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`),
          'categoryName'],
        [
          this.modals.sequelize.literal(`"sub_category"."category_name"`),
          'default_sub_category_name'],
        [
          this.modals.sequelize.literal(`"mainCategory"."category_name"`),
          'default_masterCategoryName'],
        [
          this.modals.sequelize.literal(`"category"."category_name"`),
          'default_categoryName'],
        [
          this.modals.sequelize.literal(`${language ?
              `"mainCategory"."category_name_${language}"` :
              `"mainCategory"."category_name"`}`),
          'masterCategoryName'],
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
      products = productResult.map((item) => {
        const productItem = item.toJSON();
        productItem.sub_category_name = productItem.sub_category_name ||
            productItem.default_sub_category_name;
        productItem.masterCategoryName = productItem.masterCategoryName ||
            productItem.default_masterCategoryName;
        productItem.categoryName = productItem.categoryName ||
            productItem.default_categoryName;
        if (productItem.copies) {
          productItem.copies = productItem.copies.map((copyItem) => {
            copyItem.file_type = copyItem.file_type || copyItem.fileType;
            return copyItem;
          });
        }
        productItem.cImageURL = productItem.sub_category_id ?
            `/categories/${productItem.sub_category_id}/images/1/thumbnail` :
            `${productItem.cImageURL}1/thumbnail`;
        productItem.purchaseDate = moment.utc(productItem.purchaseDate,
            moment.ISO_8601).
            startOf('days');
        if (productItem.schedule) {
          productItem.schedule.due_date = moment.utc(productItem.purchaseDate,
              moment.ISO_8601).
              add(productItem.schedule.due_in_months, 'months');
        }
        return productItem;
      }).filter(
          (productItem) => productItem.status_type !== 8 ||
              (productItem.status_type === 8 && productItem.bill &&
                  productItem.bill.billStatus ===
                  5));
      if (products.length > 0) {
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: products.map((item) => item.id),
          }, language),
          this.insuranceAdaptor.retrieveInsurances(
              {product_id: products.map((item) => item.id)}),
          this.warrantyAdaptor.retrieveWarranties(
              {product_id: products.map((item) => item.id)}),
          this.amcAdaptor.retrieveAMCs(
              {product_id: products.map((item) => item.id)}),
          this.repairAdaptor.retrieveRepairs(
              {product_id: products.map((item) => item.id)}),
          this.pucAdaptor.retrievePUCs(
              {product_id: products.map((item) => item.id)})]);
      }
      return undefined;
    }).then((results) => {
      if (results) {
        const metaData = results[0];
        products = products.map((productItem) => {
          if (productItem.copies) {
            productItem.copies = productItem.copies.map((copyItem) => {
              copyItem.file_type = copyItem.file_type || copyItem.fileType;
              return copyItem;
            });
          }
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
              productItem.repairBills.length +
              productItem.pucDetails.length;

          return productItem;
        });
      }

      return products;
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
          attributes: ['status_type'],
          required: !!(billOption.seller_id),
        },
      ],
      attributes: ['id', 'status_type'],
    }).then((productResult) => productResult.
        map((item) => item.toJSON()).filter(
            (productItem) => productItem.status_type !== 8 ||
                (productItem.status_type === 8 && productItem.bill &&
                    productItem.bill.status_type === 5)));
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
        this.repairAdaptor.retrieveRepairCount(inProgressProductOption),
        this.pucAdaptor.retrievePUCs(inProgressProductOption)]);
    }).then((results) => {
      if (options.status_type !== 8) {
        return productResult;
      }
      const availableResult = [
        ...results[0],
        ...results[1],
        ...results[2],
        ...results[3],
        ...results[4]];

      return productResult.filter((item) => availableResult.filter(
          (availResult) => availResult.masterCategoryId ===
              item.masterCategoryId).length > 0);

    });
  }

  retrieveProductById(id, options, language) {
    options.id = id;
    let products;
    let productItem;
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
            ['sid', 'id'],
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
        {
          model: this.modals.categories,
          as: 'sub_category',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        'id',
        [
          'product_name',
          'productName'],
        'file_type',
        'file_ref',
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
          'brand_id',
          'brandId'],
        [
          'colour_id',
          'colorId'],
        [
          'purchase_cost',
          'value'],
        [
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`),
          'sub_category_name'],
        [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`),
          'categoryName'],
        [
          this.modals.sequelize.literal(`"sub_category"."category_name"`),
          'default_sub_category_name'],
        [
          this.modals.sequelize.literal(`"mainCategory"."category_name"`),
          'default_masterCategoryName'],
        [
          this.modals.sequelize.literal(`"category"."category_name"`),
          'default_categoryName'],
        [
          this.modals.sequelize.literal(`${language ?
              `"mainCategory"."category_name_${language}"` :
              `"mainCategory"."category_name"`}`),
          'masterCategoryName'],
        'taxes',
        [
          this.modals.sequelize.fn('CONCAT', '/categories/',
              this.modals.sequelize.col('"category"."category_id"'),
              '/images/0'),
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
        products.cImageURL = products.file_type ?
            `/consumer/products/${products.id}/images/${products.file_ref}` :
            products.sub_category_id ?
                `/categories/${products.sub_category_id}/images/0` :
                products.cImageURL;
        products.sub_category_name = products.sub_category_name ||
            products.default_sub_category_name;
        products.masterCategoryName = products.masterCategoryName ||
            products.default_masterCategoryName;
        products.categoryName = products.categoryName ||
            products.default_categoryName;
        productItem = productResult;
        if (products.copies) {
          products.copies = products.copies.map((copyItem) => {
            copyItem.file_type = copyItem.file_type || copyItem.fileType;
            return copyItem;
          });
        }
        if (products.schedule) {
          products.schedule.due_date = moment.utc(products.purchaseDate,
              moment.ISO_8601).add(products.schedule.due_in_months, 'months');
        }
        const serviceSchedulePromise = products.schedule ?
            this.serviceScheduleAdaptor.retrieveServiceSchedules({
              category_id: products.schedule.category_id,
              brand_id: products.schedule.brand_id,
              title: products.schedule.title,
              id: {
                $gte: products.schedule.id,
              },
              status_type: 1,
            }) :
            undefined;
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: products.id,
          }, language), this.brandAdaptor.retrieveBrandById(products.brandId, {
            category_id: products.categoryId,
          }), this.insuranceAdaptor.retrieveInsurances({
            product_id: products.id,
          }), this.warrantyAdaptor.retrieveWarranties({
            product_id: products.id,
          }), this.amcAdaptor.retrieveAMCs({
            product_id: products.id,
          }), this.repairAdaptor.retrieveRepairs({
            product_id: products.id,
          }), this.pucAdaptor.retrievePUCs({
            product_id: products.id,
          }), serviceSchedulePromise, this.modals.serviceCenters.count({
            include: [
              {
                model: this.modals.brands,
                as: 'brands',
                where: {
                  brand_id: products.brandId,
                },
                attributes: [],
                required: true,
              },
              {
                model: this.modals.centerDetails,
                where: {
                  category_id: products.categoryId,
                },
                attributes: [],
                required: true,
                as: 'centerDetails',
              }],
          })]);
      }
    }).then((results) => {
      if (products) {

        products.purchaseDate = moment.utc(products.purchaseDate,
            moment.ISO_8601).
            startOf('days');
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
        products.serviceSchedules = results[7] ?
            results[7].map((scheduleItem) => {
              scheduleItem.due_date = moment.utc(products.purchaseDate,
                  moment.ISO_8601).add(scheduleItem.due_in_months, 'months');

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
                  category_id: productBody.category_id,
                  brand_id: product.brand_id,
                },
                defaults: {
                  title: item.form_value,
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
              status_type: 1,
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
                const effective_date = moment.utc(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment.utc(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment.utc(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment.utc(effective_date, moment.ISO_8601).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  document_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  warranty_type: 1,
                  user_id: productBody.user_id,
                }));
              }

              if (otherItems.warranty.dual_renewal_type) {
                warrantyRenewalType = renewalTypes.find(item => item.type ===
                    otherItems.warranty.dual_renewal_type);
                const effective_date = moment.utc(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment.utc(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment.utc(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment.utc(effective_date, moment.ISO_8601).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.dual_renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  document_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  warranty_type: 3,
                  user_id: productBody.user_id,
                }));
              }

              if (otherItems.warranty.extended_renewal_type) {
                warrantyRenewalType = renewalTypes.find(item => item.type ===
                    otherItems.warranty.extended_renewal_type);
                const effective_date = moment.utc(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment.utc(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment.utc(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment.utc(effective_date).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.extended_renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  document_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  warranty_type: 2,
                  user_id: productBody.user_id,
                }));
              }

              if (otherItems.warranty.accessory_renewal_type) {
                warrantyRenewalType = renewalTypes.find(item => item.type ===
                    otherItems.warranty.accessory_renewal_type);
                const effective_date = moment.utc(
                    otherItems.warranty.effective_date, moment.ISO_8601).
                    isValid() ?
                    moment.utc(otherItems.warranty.effective_date,
                        moment.ISO_8601).startOf('day') :
                    moment.utc(otherItems.warranty.effective_date, 'DD MMM YY').
                        startOf('day');
                expiry_date = moment.utc(effective_date).
                    add(warrantyRenewalType.effective_months, 'months').
                    subtract(1, 'day').
                    endOf('days');
                warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
                  renewal_type: otherItems.warranty.accessory_renewal_type,
                  updated_by: productBody.user_id,
                  status_type: 11,
                  product_id: product.id,
                  expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                  effective_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  document_date: moment.utc(effective_date).
                      format('YYYY-MM-DD'),
                  warranty_type: 4,
                  user_id: productBody.user_id,
                }));
              }
            }

            const insurancePromise = [];
            if (otherItems.insurance) {
              const effective_date = moment.utc(
                  otherItems.insurance.effective_date, moment.ISO_8601).
                  isValid() ?
                  moment.utc(otherItems.insurance.effective_date,
                      moment.ISO_8601).startOf('day') :
                  moment.utc(otherItems.insurance.effective_date, 'DD MMM YY').
                      startOf('day');
              const expiry_date = moment.utc(effective_date,
                  moment.ISO_8601).
                  add(8759, 'hours').
                  endOf('days');
              insurancePromise.push(this.insuranceAdaptor.createInsurances({
                renewal_type: 8,
                updated_by: productBody.user_id,
                status_type: 11,
                product_id: product.id,
                expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
                document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
                document_number: otherItems.insurance.policy_no,
                provider_id: otherItems.insurance.provider_id,
                amount_insured: otherItems.insurance.amount_insured,
                renewal_cost: otherItems.insurance.value,
                user_id: productBody.user_id,
              }));
            }

            const amcPromise = [];
            if (otherItems.amc) {
              const amcRenewalType = renewalTypes.find(
                  item => item.type === 8);
              const effective_date = moment.utc(otherItems.amc.effective_date,
                  moment.ISO_8601).isValid() ?
                  moment.utc(otherItems.amc.effective_date, moment.ISO_8601).
                      startOf('day') :
                  moment.utc(otherItems.amc.effective_date, 'DD MMM YY').
                      startOf('day');
              const expiry_date = moment.utc(effective_date,
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
                expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
                document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
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
              const pucRenewalType = otherItems.puc.expiry_period;
              const effective_date = moment.utc(otherItems.puc.effective_date,
                  moment.ISO_8601).isValid() ?
                  moment.utc(otherItems.puc.effective_date, moment.ISO_8601).
                      startOf('day') :
                  moment.utc(otherItems.puc.effective_date, 'DD MMM YY').
                      startOf('day');
              const expiry_date = moment.utc(effective_date,
                  moment.ISO_8601).
                  add(pucRenewalType, 'months').
                  subtract(1, 'day').
                  endOf('days').format('YYYY-MM-DD');
              pucPromise.push(otherItems.puc.id ?
                  this.pucAdaptor.updatePUCs(otherItems.puc.id, {
                    renewal_type: otherItems.puc.expiry_period,
                    updated_by: productBody.user_id,
                    status_type: 11,
                    seller_id: isProductPUCSellerSame ?
                        sellerList[0].sid :
                        otherItems.puc.seller_name ||
                        otherItems.puc.seller_contact ?
                            sellerList[3].sid :
                            undefined,
                    product_id: productId,
                    expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                    effective_date: moment.utc(effective_date).
                        format('YYYY-MM-DD'),
                    document_date: moment.utc(effective_date).
                        format('YYYY-MM-DD'),
                    user_id: productBody.user_id,
                  }) :
                  this.pucAdaptor.createPUCs({
                    renewal_type: otherItems.puc.expiry_period || 7,
                    updated_by: productBody.user_id,
                    status_type: 11,
                    renewal_cost: otherItems.puc.value,
                    product_id: productId,
                    seller_id: isProductPUCSellerSame ?
                        sellerList[0].sid :
                        otherItems.puc.seller_name ||
                        otherItems.puc.seller_contact ?
                            sellerList[3].sid :
                            undefined,
                    expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                    effective_date: moment.utc(effective_date).
                        format('YYYY-MM-DD'),
                    document_date: moment.utc(effective_date).
                        format('YYYY-MM-DD'),
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

  updateProductDetails(user, productBody, metadataBody, otherItems, productId) {
    let dbProduct;
    let flag = false;
    return Promise.try(() => this.modals.products.findOne({
      where: {
        id: productId,
      },
    })).then((result) => {
      dbProduct = result.toJSON();
      productBody.seller_id = dbProduct.seller_id;
      productBody.brand_id = productBody.brand_id || productBody.brand_id === 0
          ? productBody.brand_id
          : dbProduct.brand_id;
      productBody.model = productBody.model || productBody.model !== ''
          ? productBody.model
          : dbProduct.model;
      productBody.category_id = productBody.category_id ||
          dbProduct.category_id;
      productBody.main_category_id = productBody.main_category_id ||
          dbProduct.main_category_id;
      productBody.sub_category_id = productBody.sub_category_id ||
          dbProduct.sub_category_id;
      return Promise.all([
        productBody.brand_id || productBody.brand_id === 0 ?
            this.modals.products.count({
              where: {
                id: productId,
                brand_id: productBody.brand_id,
                model: productBody.model,
                status_type: {
                  $notIn: [8],
                },
              },
            }) : 1,
        this.verifyCopiesExist(productId),
        this.modals.products.count({
          where: {
            id: productId,
            status_type: 8,
          },
        }),
        this.modals.products.count({
          where: {
            user_id: productBody.user_id,
            category_id: [1, 2, 3],
            status_type: [5, 11],
          },
        }),
      ]);
    }).then((result) => {
      if (result[1] && result[0] === 0 && result[2] === 0) {
        return false;
      }
      if (result[3] === 0 && (productBody.category_id.toString() === '1' ||
          productBody.category_id.toString() === '2' ||
          productBody.category_id.toString() === '3')) { // to check it it is the first product
        flag = true;

        notificationAdaptor.sendMailOnDifferentSteps(
            'Your product is our responsibility now!',
            user.email, user, 5); // 5 is for 1st product creation

      }
      const sellerPromise = [];
      const isProductAMCSellerSame = false;
      const isProductRepairSellerSame = false;
      const isAMCRepairSellerSame = otherItems.repair && otherItems.amc &&
          otherItems.repair.seller_contact ===
          otherItems.amc.seller_contact;
      const isProductPUCSellerSame = false;
      const insuranceProviderPromise = otherItems.insurance &&
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
      const warrantyProviderPromise = otherItems.warranty &&
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

      const brandPromise = !productBody.brand_id &&
      productBody.brand_id !== 0 &&
      productBody.brand_name ?
          this.brandAdaptor.findCreateBrand({
            status_type: 11,
            brand_name: productBody.brand_name,
            category_id: productBody.category_id,
            updated_by: productBody.user_id,
            created_by: productBody.user_id,
          }) :
          undefined;
      this.prepareSellerPromise({
        sellerPromise,
        productBody,
        otherItems,
        isProductAMCSellerSame,
        isProductRepairSellerSame,
        isProductPUCSellerSame,
      });
      sellerPromise.push(insuranceProviderPromise);
      sellerPromise.push(brandPromise);
      sellerPromise.push(warrantyProviderPromise);
      let renewalTypes;
      let product = productBody;
      let metadata;
      let sellerList;
      return Promise.all(sellerPromise).
          then((newItemResults) => {
            sellerList = newItemResults;
            const newSeller = productBody.seller_contact ||
            productBody.seller_name || productBody.seller_email ?
                sellerList[0] : undefined;
            product = _.omit(product, 'seller_name');
            product = _.omit(product, 'seller_contact');
            product = _.omit(product, 'brand_name');
            product.seller_id = newSeller ?
                newSeller.sid :
                product.seller_id;
            product.brand_id = sellerList[5] ?
                sellerList[5].brand_id :
                product.brand_id;
            metadata = metadataBody.map((mdItem) => {
              mdItem = _.omit(mdItem, 'new_drop_down');
              return mdItem;
            });
            if (product.new_drop_down && product.model) {
              return this.modals.brandDropDown.findCreateFind({
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
                },
              });
            }

            return '';
          }).then(() => {
            product = !product.colour_id ?
                _.omit(product, 'colour_id') :
                product;
            product = !product.purchase_cost &&
            product.purchase_cost !== 0 ?
                _.omit(product, 'purchase_cost') :
                product;
            product = _.omit(product, 'new_drop_down');
            product = !product.model && product.model !== '' ?
                _.omit(product, 'model') :
                product;
            product = !product.taxes && product.taxes !== 0 ?
                _.omit(product, 'taxes') :
                product;
            product = !product.document_number ?
                _.omit(product, 'document_number') :
                product;
            product = !product.document_date ?
                _.omit(product, 'document_date') :
                product;
            product = !product.seller_id ?
                _.omit(product, 'seller_id') :
                product;
            product = !product.brand_id && product.brand_id !== 0 ?
                _.omit(product, 'brand_id') :
                product;
            const brandModelPromise = product.model ? [
              this.modals.brandDropDown.findOne({
                where: {
                  brand_id: product.brand_id,
                  title: {
                    $iLike: `${product.model}%`,
                  },
                  category_id: product.category_id,
                },
              }), this.modals.categories.findOne({
                where: {
                  category_id: product.category_id,
                },
              })] : [
              , this.modals.categories.findOne({
                where: {
                  category_id: product.category_id,
                },
              })];
            brandModelPromise.push(this.modals.warranties.findAll({
              where: {
                product_id: productId,
                warranty_type: 1,
              },
              order: [['expiry_date', 'ASC']],
            }), this.modals.warranties.findAll({
              where: {
                product_id: productId,
                warranty_type: 3,
              },
              order: [['expiry_date', 'ASC']],
            }), this.modals.metaData.findAll({
              where: {
                product_id: productId,
              },
            }));
            return Promise.all([
              this.categoryAdaptor.retrieveRenewalTypes({
                status_type: 1,
              }),
              this.updateProduct(productId, product),
              ...brandModelPromise]);
          }).then(
              (updateProductResult) => {
                renewalTypes = updateProductResult[0];
                product = updateProductResult[1] || undefined;
                if (product) {
                  const warrantyItemPromise = [];
                  let serviceSchedule;
                  if (product.main_category_id === 3 && product.model) {
                    const diffDays = moment.utc().
                        diff(moment.utc(product.document_date), 'days', true);
                    const diffMonths = moment.utc().
                        diff(moment.utc(product.document_date), 'months', true);
                    serviceSchedule = this.serviceScheduleAdaptor.retrieveServiceSchedules(
                        {
                          category_id: product.category_id,
                          brand_id: product.brand_id,
                          title: {
                            $iLike: `${product.model}%`,
                          },
                          $or: {
                            due_in_days: {
                              $or: {
                                $gte: diffDays,
                              },
                            },
                            due_in_months: {
                              $or: {
                                $eq: null,
                                $gte: diffMonths,
                              },
                            },
                          },
                          status_type: 1,
                        });
                  }

                  const productModel = updateProductResult[2];
                  const productCategory = updateProductResult[3];
                  const normalWarranties = updateProductResult[4] ?
                      updateProductResult[4].map(
                          (item) => item.toJSON()) :
                      [];
                  const dualWarranties = updateProductResult[5] ?
                      updateProductResult[5].map(
                          (item) => item.toJSON()) :
                      [];

                  const currentMetaData = updateProductResult[6] ?
                      updateProductResult[6].map(
                          item => item.toJSON()) :
                      [];
                  if (!product.isModalSame) {
                    if (productCategory) {
                      if (productCategory.type_category_form) {
                        const typeMDExist = metadata.find(
                            (mdItem) => mdItem.category_form_id ===
                                productCategory.type_category_form);
                        if (!typeMDExist || !product.model) {
                          metadata.push({
                            category_form_id: productCategory.type_category_form,
                            form_value: productModel ?
                                productModel.product_type :
                                null,
                            updated_by: product.user_id,
                          });
                        }
                      }

                      if (productCategory.category_form_1) {
                        const typeMDExist = metadata.find(
                            (mdItem) => mdItem.category_form_id ===
                                productCategory.category_form_1);
                        if (!typeMDExist || !product.model) {
                          metadata.push({
                            category_form_id: productCategory.category_form_1,
                            form_value: productModel ?
                                productModel.category_form_1_value :
                                null,
                            updated_by: product.user_id,
                          });
                        }
                      }

                      if (productCategory.category_form_2) {
                        const typeMDExist = metadata.find(
                            (mdItem) => mdItem.category_form_id ===
                                productCategory.category_form_2);
                        if (!typeMDExist || !product.model) {
                          metadata.push({
                            category_form_id: productCategory.category_form_2,
                            form_value: productModel ?
                                productModel.category_form_2_value :
                                null,
                            updated_by: product.user_id,
                          });
                        }
                      }
                    }

                    if (!otherItems.warranty) {
                      if ((productModel || !product.model) &&
                          normalWarranties.length > 0) {
                        warrantyItemPromise.push(...normalWarranties.map(
                            (wItem) => this.warrantyAdaptor.deleteWarranties(
                                wItem.id,
                                product.user_id)));
                      }

                      if ((productModel || !product.model) &&
                          dualWarranties.length > 0) {
                        warrantyItemPromise.push(...dualWarranties.map(
                            (wItem) => this.warrantyAdaptor.deleteWarranties(
                                wItem.id,
                                product.user_id)));
                      }

                      otherItems.warranty = {
                        renewal_type: productModel ?
                            productModel.warranty_renewal_type :
                            undefined,
                        dual_renewal_type: productModel ?
                            productModel.dual_renewal_type :
                            undefined,
                      };

                    }
                  }

                  if (otherItems.warranty) {
                    this.prepareWarrantyPromise({
                      otherItems,
                      renewalTypes,
                      warrantyItemPromise,
                      productBody: product,
                      productId,
                      sellerList,
                    });
                  }

                  const insurancePromise = [];
                  if (otherItems.insurance) {
                    this.prepareInsurancePromise({
                      otherItems,
                      renewalTypes,
                      insurancePromise,
                      productBody: product,
                      sellerList,
                    });
                  }

                  const amcPromise = [];
                  if (otherItems.amc) {
                    this.prepareAMCPromise({
                      renewalTypes,
                      otherItems,
                      amcPromise,
                      productBody: product,
                      productId,
                      isProductAMCSellerSame,
                      sellerList,
                    });
                  }

                  const repairPromise = [];
                  if (otherItems.repair) {
                    this.prepareRepairPromise({
                      otherItems,
                      isProductRepairSellerSame,
                      sellerList,
                      isAMCRepairSellerSame,
                      repairPromise,
                      productBody: product,
                      productId,
                    });
                  }

                  const metadataPromise = metadata.filter(
                      (mdItem) => mdItem.category_form_id).map((mdItem) => {
                    mdItem.status_type = 11;
                    const currentMetaDataItem = currentMetaData.find(
                        (cmdItem) => cmdItem.category_form_id ===
                            mdItem.category_form_id);
                    if (currentMetaDataItem && currentMetaDataItem.id) {
                      return this.updateProductMetaData(currentMetaDataItem.id,
                          mdItem);
                    }

                    mdItem.product_id = productId;
                    return this.modals.metaData.create(mdItem);
                  });

                  const pucPromise = [];
                  if (otherItems.puc) {
                    this.preparePUCPromise({
                      renewalTypes,
                      otherItems,
                      pucPromise,
                      productBody: product,
                      isProductPUCSellerSame,
                      sellerList,
                      productId,
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
                    this.modals.serviceCenters.count({
                      include: [
                        {
                          model: this.modals.brands,
                          as: 'brands',
                          where: {
                            brand_id: product.brand_id,
                          },
                          attributes: [],
                          required: true,
                        },
                        {
                          model: this.modals.centerDetails,
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

              }).then(
              (productItemsResult) => {
                if (productItemsResult) {
                  const productPromise = [];
                  console.log('\n\n\n',
                      JSON.stringify({metadata: productItemsResult[0]}));
                  product.metaData = productItemsResult[0] &&
                  productItemsResult[0].length > 0 ?
                      productItemsResult[0].map(
                          (mdItem) => mdItem.toJSON()) :
                      [];
                  product.insurances = productItemsResult[1];
                  product.warranties = productItemsResult[2];
                  product.amcs = productItemsResult[3];
                  product.repairs = productItemsResult[4];
                  product.pucDetail = productItemsResult[5];
                  if (productItemsResult[6] &&
                      productItemsResult[6].length > 0) {
                    productPromise.push(this.updateProduct(product.id, {
                      service_schedule_id: productItemsResult[6][0].id,
                    }));
                  } else if (product.service_schedule_id && !product.model) {
                    productPromise.push(this.updateProduct(product.id, {
                      service_schedule_id: null,
                    }));
                  } else if (productItemsResult[6] &&
                      productItemsResult[6].length === 0) {
                    productPromise.push(this.updateProduct(product.id, {
                      service_schedule_id: null,
                    }));
                  }
                  product.serviceCenterUrl = productItemsResult[7] &&
                  productItemsResult[7] > 0
                      ?
                      `/consumer/servicecenters?brandid=${product.brand_id}&categoryid=${product.category_id}`
                      :
                      '';
                  return product;
                }

                return undefined;
              }).then(
              (finalResult) => {
                if (finalResult) {
                  finalResult.metaData = product.metaData;
                  finalResult.insurances = product.insurances;
                  finalResult.warranties = product.warranties;
                  finalResult.amcs = product.amcs;
                  finalResult.repairs = product.repairs;
                  finalResult.pucDetails = product.pucDetails;
                }

                finalResult.flag = flag;

                return finalResult;
              }).catch((err) => console.log(
              `Error on update product detail ${new Date()} for user ${product.user_id} is as follow: \n \n ${err}`));
    });
  }

  verifyCopiesExist(product_id, model, brand_id) {
    return Promise.all([
      this.modals.products.count({
        where: {
          id: product_id,
          status_type: 5,
        },
      }), this.modals.amcs.count({
        where: {
          product_id,
          status_type: 5,
        },
      }), this.modals.insurances.count({
        where: {
          product_id,
          status_type: 5,
        },
      }), this.modals.pucs.count({
        where: {
          product_id,
          status_type: 5,
        },
      }), this.modals.repairs.count({
        where: {
          product_id,
          status_type: 5,
        },
      }), this.modals.warranties.count({
        where: {
          product_id,
          status_type: 5,
        },
      })]).then((results) => (results.filter(item => item > 0).length > 0));
  }

  preparePUCPromise(parameters) {
    let {otherItems, pucPromise, productBody, isProductPUCSellerSame, sellerList, productId} = parameters;
    let effective_date = otherItems.puc.effective_date ||
        productBody.document_date;
    effective_date = moment.utc(effective_date, moment.ISO_8601).
        isValid() ?
        moment.utc(effective_date,
            moment.ISO_8601).startOf('day') :
        moment.utc(effective_date, 'DD MMM YY').
            startOf('day');
    const expiry_date = moment.utc(effective_date,
        moment.ISO_8601).
        add(otherItems.puc.expiry_period || 6, 'months').
        subtract(1, 'day').
        endOf('days').format('YYYY-MM-DD');
    const values = {
      renewal_type: otherItems.puc.expiry_period || 6,
      updated_by: productBody.user_id,
      status_type: 11,
      renewal_cost: otherItems.puc.value,
      seller_id: isProductPUCSellerSame ?
          sellerList[0].sid :
          otherItems.puc.seller_name ||
          otherItems.puc.seller_contact ?
              sellerList[3].sid :
              undefined,
      product_id: productId,
      job_id: productBody.job_id,
      expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
      effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      user_id: productBody.user_id,
    };
    pucPromise.push(otherItems.puc.id ?
        this.pucAdaptor.updatePUCs(otherItems.puc.id, values) :
        this.pucAdaptor.createPUCs(values));
  }

  prepareRepairPromise(parameters) {
    let {otherItems, isProductRepairSellerSame, sellerList, isAMCRepairSellerSame, repairPromise, productBody, productId} = parameters;
    let document_date = otherItems.repair.document_date ||
        productBody.document_date;
    document_date = moment.utc(document_date, moment.ISO_8601).
        isValid() ?
        moment.utc(document_date,
            moment.ISO_8601).startOf('day') :
        moment.utc(document_date, 'DD MMM YY').
            startOf('day');

    const repairSellerId = isProductRepairSellerSame ?
        sellerList[0].sid :
        isAMCRepairSellerSame ?
            sellerList[1].sid :
            otherItems.repair.seller_name ||
            otherItems.repair.seller_contact ?
                sellerList[2].sid :
                undefined;
    const values = {
      updated_by: productBody.user_id,
      status_type: 11,
      product_id: productId,
      seller_id: repairSellerId,
      document_date: moment.utc(document_date).format('YYYY-MM-DD'),
      repair_for: otherItems.repair.repair_for,
      job_id: productBody.job_id,
      repair_cost: otherItems.repair.value,
      warranty_upto: otherItems.repair.warranty_upto,
      user_id: productBody.user_id,
    };
    repairPromise.push(otherItems.repair.id ?
        this.repairAdaptor.updateRepairs(otherItems.repair.id, values) :
        this.repairAdaptor.createRepairs(values));
  }

  prepareAMCPromise(parameters) {
    let {renewalTypes, otherItems, amcPromise, productBody, productId, isProductAMCSellerSame, sellerList} = parameters;
    let effective_date = otherItems.amc.effective_date ||
        productBody.document_date;
    effective_date = moment.utc(effective_date, moment.ISO_8601).
        isValid() ?
        moment.utc(effective_date,
            moment.ISO_8601).startOf('day') :
        moment.utc(effective_date, 'DD MMM YY').
            startOf('day');
    const expiry_date = moment.utc(effective_date,
        moment.ISO_8601).
        add(12, 'months').
        subtract(1, 'day').
        endOf('days').
        format('YYYY-MM-DD');
    const values = {
      renewal_type: 8,
      updated_by: productBody.user_id,
      status_type: 11,
      product_id: productId,
      job_id: productBody.job_id,
      renewal_cost: otherItems.amc.value,
      seller_id: isProductAMCSellerSame ?
          sellerList[0].sid :
          otherItems.amc.seller_name ||
          otherItems.amc.seller_contact ?
              sellerList[1].sid :
              undefined,
      expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
      effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      user_id: productBody.user_id,
    };
    amcPromise.push(otherItems.amc.id ?
        this.amcAdaptor.updateAMCs(otherItems.amc.id, values) :
        this.amcAdaptor.createAMCs(values));
  }

  prepareInsurancePromise(parameters) {
    let {otherItems, insurancePromise, productBody, sellerList, renewalTypes} = parameters;
    const product_id = productBody.id;
    let insuranceRenewalType = renewalTypes.find(
        item => item.type === 8);
    if (otherItems.insurance.renewal_type) {
      insuranceRenewalType = renewalTypes.find(
          item => item.type === otherItems.insurance.renewal_type);
    }

    let effective_date = otherItems.insurance.effective_date ||
        productBody.document_date;
    effective_date = moment.utc(effective_date, moment.ISO_8601).
        isValid() ?
        moment.utc(effective_date,
            moment.ISO_8601).startOf('day') :
        moment.utc(effective_date, 'DD MMM YY').
            startOf('day');
    const expiry_date = moment.utc(effective_date,
        moment.ISO_8601).
        add(insuranceRenewalType.effective_months, 'months').
        subtract(1, 'day').
        endOf('days');
    const values = {
      renewal_type: otherItems.insurance.renewal_type || 8,
      updated_by: productBody.user_id,
      job_id: productBody.job_id,
      status_type: 11,
      product_id,
      expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
      effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_number: otherItems.insurance.policy_no,
      provider_id: otherItems.insurance.provider_name && sellerList[4] ?
          sellerList[4].id :
          otherItems.insurance.provider_id,
      amount_insured: otherItems.insurance.amount_insured,
      renewal_cost: otherItems.insurance.value,
      user_id: productBody.user_id,
    };
    insurancePromise.push(otherItems.insurance.id ?
        this.insuranceAdaptor.updateInsurances(
            otherItems.insurance.id, values) :
        this.insuranceAdaptor.createInsurances(values));
  }

  prepareWarrantyPromise(parameters) {
    let {otherItems, renewalTypes, warrantyItemPromise, productBody, productId, sellerList} = parameters;
    let warrantyRenewalType;
    let expiry_date;
    if (otherItems.warranty.id && !otherItems.warranty.renewal_type) {
      warrantyItemPromise.push(this.warrantyAdaptor.updateWarranties(
          otherItems.warranty.id, {status_type: 11}));
    }

    if (otherItems.warranty.extended_id &&
        !otherItems.warranty.extended_renewal_type) {
      warrantyItemPromise.push(this.warrantyAdaptor.updateWarranties(
          otherItems.warranty.extended_id, {status_type: 11}));
    }

    /* if (otherItems.warranty.dual_id && !otherItems.warranty.dual_renewal_type) {
       warrantyItemPromise.push(this.warrantyAdaptor.updateWarranties(
           otherItems.warranty.dual_id, {status_type: 11}));
     }*/

    if (otherItems.warranty.renewal_type) {
      warrantyRenewalType = renewalTypes.find(
          item => item.type === otherItems.warranty.renewal_type);
      let effective_date = otherItems.warranty.effective_date ||
          productBody.document_date;
      effective_date = moment.utc(effective_date, moment.ISO_8601).
          isValid() ?
          moment.utc(effective_date,
              moment.ISO_8601).startOf('day') :
          moment.utc(effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment.utc(effective_date, moment.ISO_8601).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(otherItems.warranty.id ?
          this.warrantyAdaptor.updateWarranties(
              otherItems.warranty.id, {
                renewal_type: otherItems.warranty.renewal_type,
                updated_by: productBody.user_id,
                status_type: 11,
                job_id: productBody.job_id,
                product_id: productId,
                expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment.utc(effective_date).
                    format('YYYY-MM-DD'),
                document_date: moment.utc(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 1,
                user_id: productBody.user_id,
              })
          :
          this.warrantyAdaptor.createWarranties({
            renewal_type: otherItems.warranty.renewal_type,
            updated_by: productBody.user_id,
            status_type: 11,
            job_id: productBody.job_id,
            product_id: productId,
            expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
            effective_date: moment.utc(effective_date).
                format('YYYY-MM-DD'),
            document_date: moment.utc(effective_date).
                format('YYYY-MM-DD'),
            warranty_type: 1,
            user_id: productBody.user_id,
          }));
    }

    if (otherItems.warranty.extended_renewal_type) {
      warrantyRenewalType = renewalTypes.find(item => item.type ===
          otherItems.warranty.extended_renewal_type);
      let effective_date = otherItems.warranty.extended_effective_date ||
          expiry_date || productBody.document_date;
      effective_date = moment.utc(effective_date, moment.ISO_8601).
          isValid() ?
          moment.utc(effective_date,
              moment.ISO_8601).startOf('day') :
          moment.utc(effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment.utc(effective_date).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(otherItems.warranty.extended_id ?
          this.warrantyAdaptor.updateWarranties(
              otherItems.warranty.extended_id, {
                renewal_type: otherItems.warranty.extended_renewal_type,
                provider_id: otherItems.warranty.extended_provider_name &&
                sellerList[4] ?
                    sellerList[6].id : otherItems.warranty.extended_provider_id,
                updated_by: productBody.user_id,
                status_type: 11,
                job_id: productBody.job_id,
                product_id: productId,
                expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment.utc(effective_date).
                    format('YYYY-MM-DD'),
                document_date: moment.utc(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 2,
                user_id: productBody.user_id,
              })
          : this.warrantyAdaptor.createWarranties({
            renewal_type: otherItems.warranty.extended_renewal_type,
            provider_id: otherItems.warranty.extended_provider_name &&
            sellerList[4] ?
                sellerList[6].id : otherItems.warranty.extended_provider_id,
            updated_by: productBody.user_id,
            status_type: 11,
            job_id: productBody.job_id,
            product_id: productId,
            expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
            effective_date: moment.utc(effective_date).
                format('YYYY-MM-DD'),
            document_date: moment.utc(effective_date).
                format('YYYY-MM-DD'),
            warranty_type: 2,
            user_id: productBody.user_id,
          }));
    }

    /*if (otherItems.warranty.dual_renewal_type) {
      warrantyRenewalType = renewalTypes.find(item => item.type ===
          otherItems.warranty.dual_renewal_type);
      let effective_date = otherItems.warranty.effective_date ||
          productBody.document_date;
      effective_date = moment.utc(effective_date, moment.ISO_8601).
          isValid() ?
          moment.utc(effective_date,
              moment.ISO_8601).startOf('day') :
          moment.utc(effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment.utc(effective_date, moment.ISO_8601).
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
                job_id: productBody.job_id,
                expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
                effective_date: moment.utc(effective_date).
                    format('YYYY-MM-DD'),
                document_date: moment.utc(effective_date).
                    format('YYYY-MM-DD'),
                warranty_type: 3,
                user_id: productBody.user_id,
              }) :
          this.warrantyAdaptor.createWarranties({
            renewal_type: otherItems.warranty.dual_renewal_type,
            updated_by: productBody.user_id,
            status_type: 11,
            product_id: productId,
            job_id: productBody.job_id,
            expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
            effective_date: moment.utc(effective_date).
                format('YYYY-MM-DD'),
            document_date: moment.utc(effective_date).
                format('YYYY-MM-DD'),
            warranty_type: 3,
            user_id: productBody.user_id,
          }));
    }*/

    if (otherItems.warranty.accessory_renewal_type) {
      warrantyRenewalType = renewalTypes.find(item => item.type ===
          otherItems.warranty.accessory_renewal_type);
      let effective_date = otherItems.warranty.effective_date ||
          productBody.document_date;
      effective_date = moment.utc(effective_date, moment.ISO_8601).
          isValid() ?
          moment.utc(effective_date,
              moment.ISO_8601).startOf('day') :
          moment.utc(effective_date, 'DD MMM YY').
              startOf('day');
      expiry_date = moment.utc(effective_date).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').
          endOf('days');
      warrantyItemPromise.push(this.warrantyAdaptor.createWarranties({
        renewal_type: otherItems.warranty.accessory_renewal_type,
        updated_by: productBody.user_id,
        status_type: 11,
        job_id: productBody.job_id,
        product_id: productId,
        expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
        effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
        document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
        warranty_type: 4,
        user_id: productBody.user_id,
      }));
    }

    warrantyItemPromise.push(this.warrantyAdaptor.updateWarrantyPeriod(
        {product_id: productId, user_id: productBody.user_id},
        productBody.document_date, productBody.document_date));
  }

  prepareSellerPromise(parameters) {
    let {sellerPromise, productBody, otherItems, isProductAMCSellerSame, isProductRepairSellerSame, isProductPUCSellerSame, isAMCRepairSellerSame} = parameters;
    let sellerOption;

    if (productBody.seller_id) {
      sellerOption = {sid: productBody.seller_id};
    } else {
      sellerOption = {
        $or: {
          $and: {
            seller_name: {
              $iLike: productBody.seller_name || '',
            },
          },
        },
      };

      if (productBody.seller_contact && productBody.seller_contact.trim()) {
        sellerOption.$or.$and.contact_no = productBody.seller_contact.trim();
      }

      if (productBody.seller_email && productBody.seller_email.trim()) {
        sellerOption.$or.$and.email = {
          $iLike: productBody.seller_email.trim(),
        };
      }
    }

    sellerPromise.push(
        (productBody.seller_contact && productBody.seller_contact.trim()) ||
        (productBody.seller_name && productBody.seller_name.trim()) ||
        (productBody.seller_email && productBody.seller_email.trim()) ||
        (productBody.seller_address && productBody.seller_address.trim()) ?
            this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
                {
                  seller_name: productBody.seller_name || '',
                  contact_no: productBody.seller_contact,
                  email: productBody.seller_email,
                  address: productBody.seller_address,
                  updated_by: productBody.user_id,
                  created_by: productBody.user_id,
                  status_type: 11,
                }) :
            '');

    if (otherItems.amc) {
      sellerOption.seller_name.$iLike = otherItems.amc.seller_name;
      if (otherItems.amc.seller_contact) {
        sellerOption.contact_no = otherItems.amc.seller_contact;
      } else {
        sellerOption = _.omit(sellerOption, 'contact_no');
      }
      sellerPromise.push(!isProductAMCSellerSame &&
      ((otherItems.amc.seller_contact &&
          otherItems.amc.seller_contact.trim()) ||
          (otherItems.amc.seller_name && otherItems.amc.seller_name.trim())) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
              {
                seller_name: otherItems.amc.seller_name,
                contact_no: otherItems.amc.seller_contact,
                updated_by: productBody.user_id,
                created_by: productBody.user_id,
                status_type: 11,
              }) :
          '');
    } else {
      sellerPromise.push('');
    }
    if (otherItems.repair) {
      sellerOption.seller_name.$iLike = otherItems.repair.seller_name;
      if (otherItems.repair.seller_contact) {
        sellerOption.contact_no = otherItems.repair.seller_contact;
      } else {
        sellerOption = _.omit(sellerOption, 'contact_no');
      }
      sellerPromise.push(!otherItems.repair.is_amc_seller &&
      !isProductRepairSellerSame && !isAMCRepairSellerSame &&
      ((otherItems.repair.seller_contact &&
          otherItems.repair.seller_contact.trim()) ||
          (otherItems.repair.seller_name &&
              otherItems.repair.seller_name.trim())) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
              {
                seller_name: otherItems.repair.seller_name,
                contact_no: otherItems.repair.seller_contact,
                updated_by: productBody.user_id,
                created_by: productBody.user_id,
                status_type: 11,
              }) :
          '');
    } else {
      sellerPromise.push('');
    }
    if (otherItems.puc) {
      sellerOption.seller_name.$iLike = otherItems.puc.seller_name;
      if (otherItems.puc.seller_contact) {
        sellerOption.contact_no = otherItems.puc.seller_contact;
      } else {
        sellerOption = _.omit(sellerOption, 'contact_no');
      }
      sellerPromise.push(!isProductPUCSellerSame &&
      ((otherItems.puc.seller_contact &&
          otherItems.puc.seller_contact.trim()) ||
          (otherItems.puc.seller_name && otherItems.puc.seller_name.trim())) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
              {
                seller_name: otherItems.puc.seller_name,
                contact_no: otherItems.puc.seller_contact,
                updated_by: productBody.user_id,
                created_by: productBody.user_id,
                status_type: 11,
              }) :
          '');
    } else {
      sellerPromise.push('');
    }
  }

  retrieveProductMetadata(options, language) {
    return this.modals.metaData.findAll({
      where: options,
      include: [
        {
          model: this.modals.categoryForms,
          as: 'categoryForm',
          attributes: [],
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
          this.modals.sequelize.literal(`${language ?
              `"categoryForm"."title_${language}"` :
              `"categoryForm"."title"`}`),
          'default_name'],
        [
          this.modals.sequelize.literal('"categoryForm"."title"'),
          'name'],
        [
          this.modals.sequelize.literal('"categoryForm"."display_index"'),
          'displayIndex']],
    }).then((metaDataResult) => {
      const metaData = metaDataResult.map((item) => item.toJSON());
      const categoryFormIds = metaData.map((item) => item.categoryFormId);

      console.log({
        metaData, categoryFormIds,
      });
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

        console.log({
          metaDataItem,
        });
        if (metaDataItem.formType === 2 && metaDataItem.value) {
          const dropDown = result[1].find(
              (item) => item.id === parseInt(metaDataItem.value));
          metaDataItem.value = dropDown ? dropDown.title : metaDataItem.value;
        }

        return metaDataItem;
      }).filter((item) => item.value);

      console.log({
        unOrderedMetaData,
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
      options.status_type = [5, 11];
    }
    return this.modals.products.findAll({
      where: options,
      attributes: [
        'id',
        [
          'id',
          'productId'],
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
      console.log(productResult.map((item) => item.toJSON()));
      const products = productResult.map((item) => {
        const productItem = item.toJSON();
        if (productItem.copies) {
          productItem.copies = productItem.copies.map((copyItem) => {
            copyItem.file_type = copyItem.file_type || copyItem.fileType;
            return copyItem;
          });
        }

        return productItem;

      });
      const product_id = products.map((item) => item.id);
      console.log('\n\n\n\n\n\n\n\n');
      console.log({
        product_id,
      });
      return Promise.all([
        this.retrieveProductMetadata({
          product_id,
        }), products]);
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

  prepareProductDetail(parameters) {
    let {user, request} = parameters;
    const productId = request.params.id;
    return this.retrieveProductById(productId, {
      user_id: user.id || user.ID,
      status_type: [5, 8, 11],
    }, request.language).then((result) => {
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
      const itemDetail = productResult.toJSON();
      const currentPurchaseDate = itemDetail.document_date;
      console.log('\n\n\n', JSON.stringify({productDetail}));
      const isModalSame = itemDetail.model === productDetail.model;
      if (productDetail.copies && productDetail.copies.length > 0 &&
          itemDetail.copies && itemDetail.copies.length > 0) {
        const newCopies = productDetail.copies;
        productDetail.copies = itemDetail.copies;
        productDetail.copies.push(...newCopies);
      }

      productDetail.status_type = itemDetail.status_type === 5 ?
          itemDetail.status_type :
          itemDetail.status_type !== 8 ?
              11 :
              productDetail.status_type || itemDetail.status_type;
      productResult.updateAttributes(productDetail);
      productDetail = productResult.toJSON();
      productDetail.isModalSame = isModalSame;
      if (productDetail.document_date &&
          moment.utc(currentPurchaseDate, moment.ISO_8601).valueOf() !==
          moment.utc(productDetail.document_date, moment.ISO_8601).valueOf()) {
        return Promise.all([
          this.warrantyAdaptor.updateWarrantyPeriod(
              {product_id: id, user_id: productDetail.user_id},
              currentPurchaseDate, productDetail.document_date),
          this.insuranceAdaptor.updateInsurancePeriod(
              {product_id: id, user_id: productDetail.user_id},
              currentPurchaseDate, productDetail.document_date),
          this.pucAdaptor.updatePUCPeriod(
              {product_id: id, user_id: productDetail.user_id},
              currentPurchaseDate, productDetail.document_date),
          this.amcAdaptor.updateAMCPeriod(
              {product_id: id, user_id: productDetail.user_id},
              currentPurchaseDate, productDetail.document_date)]).
            catch((err) => console.log(
                `Error on update product ${new Date()} for user ${productDetail.user_id} is as follow: \n \n ${err}`));
      }

      return undefined;
    }).then(() => {
      return productDetail;
    });
  }

  updateProductMetaData(id, values) {
    return this.modals.metaData.findOne({
      where: {
        id,
      },
    }).then(result => {
      result.updateAttributes(values);
      return result;
    });
  }

  deleteProduct(id, userId) {
    return this.modals.products.findById(id).then((result) => {
      if (result) {
        const jobPromise = result.job_id ? [
          this.modals.jobs.update({
            user_status: 3,
            admin_status: 3,
            ce_status: null,
            qe_status: null,
            updated_by: userId,
          }, {
            where: {
              id: result.job_id,
            },
          }), this.modals.jobCopies.update({
            status_type: 3,
            updated_by: userId,
          }, {
            where: {
              job_id: result.job_id,
            },
          })] : [undefined, undefined];
        return Promise.all([
          this.modals.mailBox.create({
            title: `User Deleted Product #${id}`,
            job_id: result.job_id,
            bill_product_id: result.product_id,
            notification_type: 100,
          }),
          this.modals.products.destroy({
            where: {
              id,
              user_id: userId,
            },
          }), ...jobPromise]).then(() => {
          return true;
        });
      }

      return true;
    });
  }

  removeProducts(id, copyId, values) {
    return this.modals.products.findOne({
      where: {
        id,
      },
    }).then(result => {
      const itemDetail = result.toJSON();
      if (copyId &&
          itemDetail.copies.length > 0) {
        values.copies = itemDetail.copies.filter(
            (item) => item.copyId !== parseInt(copyId));
        result.updateAttributes(values);

        return result.toJSON();
      }

      return this.modals.products.destroy({
        where: {
          id,
        },
      }).then(() => {
        return true;
      });
    });
  }
}

export default ProductAdaptor;
