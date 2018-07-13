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
import reg_certificate from './reg_certificates';
import FuelAdaptor from './refueling';
import re from 'request-promise';
import {notifyUser} from '../../helpers/shared';

export default class ProductAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.brandAdaptor = new BrandAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.pucAdaptor = new PUCAdaptor(modals);
    this.regCertAdaptor = new reg_certificate(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.sellerAdaptor = new SellerAdaptor(modals);
    this.serviceScheduleAdaptor = new ServiceScheduleAdaptor(modals);
    this.fuelAdaptor = new FuelAdaptor(modals);
  }

  async retrieveProducts(options, language) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }

    if (!options.ref_id) {
      options.ref_id = null;
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
    const productResult = await this.modals.products.findAll({
      where: options, include: [
        {
          model: this.modals.brands,
          as: 'brand',
          attributes: [
            ['brand_id', 'brandId'], ['brand_id', 'id'],
            ['brand_name', 'name'], ['brand_description', 'description'],
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
            'distance', 'due_in_months', 'due_in_days'],
          required: false,
        },
        {
          model: this.modals.bills,
          where: billOption,
          attributes: [
            ['consumer_name', 'consumerName'],
            ['consumer_email', 'consumerEmail'],
            ['consumer_phone_no', 'consumerPhoneNo'],
            ['document_number', 'invoiceNo'], 'seller_id'],
          include: [
            {
              model: this.modals.onlineSellers,
              as: 'sellers',
              attributes: [
                ['sid', 'id'], ['seller_name', 'sellerName'],
                'url', 'gstin', 'contact', 'email',
                [
                  this.modals.sequelize.fn('CONCAT', 'sellers/',
                      this.modals.sequelize.literal('"bill->sellers"."sid"'),
                      '/reviews?isonlineseller=true'), 'reviewUrl']],
              include: [
                {
                  model: this.modals.sellerReviews,
                  as: 'sellerReviews',
                  attributes: [
                    ['review_ratings', 'ratings'],
                    ['review_feedback', 'feedback'],
                    ['review_comments', 'comments']],
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
            ['sid', 'id'], ['seller_name', 'sellerName'],
            ['owner_name', 'ownerName'], ['pan_no', 'panNo'],
            ['reg_no', 'regNo'], ['is_service', 'isService'],
            'url', 'gstin', ['contact_no', 'contact'], 'email', 'address',
            'city', 'state', 'pincode', 'latitude', 'longitude',
            [
              this.modals.sequelize.fn('CONCAT', 'sellers/',
                  this.modals.sequelize.literal('"sellers"."sid"'),
                  '/reviews?isonlineseller=false'), 'reviewUrl']],
          include: [
            {
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [
                ['review_ratings', 'ratings'],
                ['review_feedback', 'feedback'],
                ['review_comments', 'comments']],
              required: false,
            },
          ],
          required: false,
        },
        {
          model: this.modals.productReviews,
          as: 'productReviews',
          attributes: [
            ['review_ratings', 'ratings'],
            ['review_feedback', 'feedback'],
            ['review_comments', 'comments']],
          required: false,
        },
        {
          model: this.modals.categories,
          as: 'category',
          attributes: [],
          required: false,
        },
        {
          model: this.modals.accessory_part,
          as: 'accessory_part',
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
      ], attributes: [
        'id', ['product_name', 'productName'],
        'file_type', 'file_ref',
        ['category_id', 'categoryId'], ['main_category_id', 'masterCategoryId'],
        'sub_category_id', ['brand_id', 'brandId'], 'taxes',
        ['colour_id', 'colorId'], ['purchase_cost', 'value'],
        [
          this.modals.sequelize.fn('CONCAT', '/categories/',
              this.modals.sequelize.literal('"category"."category_id"'),
              '/images/'), 'cImageURL'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"')),
          'productURL'], 'accessory_part_id',
        ['document_date', 'purchaseDate'], 'model',
        ['document_number', 'documentNo'], ['updated_at', 'updatedDate'],
        ['bill_id', 'billId'], ['job_id', 'jobId'],
        ['seller_id', 'sellerId'], 'copies',
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"'), '/reviews'),
          'reviewUrl'],
        [
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`), 'sub_category_name'],
        [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`), 'categoryName'],
        [
          this.modals.sequelize.literal(`"accessory_part"."title"`),
          'accessory_part_name'],
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
          'serviceCenterUrl'], 'status_type',
      ], order: [['document_date', 'DESC']],
    });
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
    inProgressProductOption = _.omit(inProgressProductOption, 'bill_id');
    inProgressProductOption = _.omit(inProgressProductOption,
        'accessory_part_id');
    inProgressProductOption = _.omit(inProgressProductOption, 'accessory_id');
    inProgressProductOption.status_type = [5, 11, 12];
    inProgressProductOption.product_status_type = options.status_type;
    inProgressProductOption = _.omit(inProgressProductOption, 'ref_id');
    let warrantyOptions = {};
    _.assignIn(warrantyOptions, inProgressProductOption);
    warrantyOptions.warranty_type = [1, 2];
    let metaData = [], insurances = [], warranties = [], amcs = [],
        repairs = [], pucs = [];
    if (products.length > 0) {
      inProgressProductOption.product_id = products.map((item) => item.id);
      [
        metaData, insurances, warranties,
        amcs, repairs, pucs] = await Promise.all([
        this.retrieveProductMetadata({
          product_id: products.map((item) => item.id),
        }, language),
        this.insuranceAdaptor.retrieveInsurances(inProgressProductOption),
        this.warrantyAdaptor.retrieveWarranties(warrantyOptions),
        this.amcAdaptor.retrieveAMCs(inProgressProductOption),
        this.repairAdaptor.retrieveRepairs(inProgressProductOption),
        this.pucAdaptor.retrievePUCs(inProgressProductOption)]);
    }
    return products.map((productItem) => {
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
      productItem.insuranceDetails = insurances.filter(
          (item) => item.productId === productItem.id);
      productItem.warrantyDetails = warranties.filter(
          (item) => item.productId === productItem.id);
      productItem.amcDetails = amcs.filter(
          (item) => item.productId === productItem.id);
      productItem.repairBills = repairs.filter(
          (item) => item.productId === productItem.id);
      productItem.pucDetails = pucs.filter(
          (item) => item.productId === productItem.id);

      productItem.requiredCount = productItem.insuranceDetails.length +
          productItem.warrantyDetails.length +
          productItem.amcDetails.length +
          productItem.repairBills.length + productItem.pucDetails.length;

      return productItem;
    });
  }

  async retrieveEHomeProducts(options, language, limit, offset, sort_by) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }

    console.log({offset});
    limit = limit || 10;
    offset = offset || 0;

    if (!options.ref_id) {
      options.ref_id = null;
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
    const productResult = await this.modals.products.findAll({
      where: options,
      attributes: [
        'id',
        ['product_name', 'productName'],
        'file_type', 'file_ref', 'bill_id', 'category_id',
        ['category_id', 'categoryId'], 'main_category_id',
        ['main_category_id', 'masterCategoryId'],
        'sub_category_id', 'brand_id', ['brand_id', 'brandId'],
        'taxes', ['colour_id', 'colorId'], ['purchase_cost', 'value'],
        [
          this.modals.sequelize.fn('CONCAT', '/categories/',
              this.modals.sequelize.literal('"category_id"'),
              '/images/'), 'cImageURL'], [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"')),
          'productURL'], 'accessory_part_id', ['document_date', 'purchaseDate'],
        'model', ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'], ['bill_id', 'billId'], 'job_id',
        ['job_id', 'jobId'], 'seller_id', ['seller_id', 'sellerId'],
        'copies', 'service_schedule_id', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"'), '/reviews'),
          'reviewUrl'], [
          this.modals.sequelize.fn('CONCAT',
              '/consumer/servicecenters?brandid=',
              this.modals.sequelize.literal('"products"."brand_id"'),
              '&categoryid=',
              this.modals.sequelize.col('"products"."category_id"')),
          'serviceCenterUrl'], 'status_type',
      ],
      order: [
        ['updated_at', sort_by || 'DESC'],
        ['document_date', sort_by || 'DESC']],
      limit,
      offset,
    });
    products = productResult.map((item) => item.toJSON());
    billOption.id = products.map(item => item.bill_id).filter(Boolean);
    let [brands, colours, service_schedules, bills, offline_sellers, product_reviews, categories, accessory_parts] = await Promise.all(
        [
          this.modals.brands.findAll({
            where: {
              brand_id: products.map(item => item.brand_id).
                  filter(Boolean),
            }, attributes: [
              ['brand_id', 'brandId'], ['brand_id', 'id'],
              ['brand_name', 'name'], ['brand_description', 'description'],
              [
                this.modals.sequelize.fn('CONCAT', 'brands/',
                    this.modals.sequelize.col('"brand_id"'), '/reviews'),
                'reviewUrl']],
          }),
          this.modals.colours.findAll({
            where: {
              colour_id: products.map(item => item.colorId).
                  filter(Boolean),
            }, attributes: [
              ['colour_id', 'colorId'], ['colour_name', 'colorName']],
          }),
          this.modals.serviceSchedules.findAll({
            where: {
              id: products.map(item => item.service_schedule_id).
                  filter(Boolean),
            }, attributes: [
              'id', 'inclusions', 'exclusions',
              'service_number', 'service_type', 'distance',
              'due_in_months', 'due_in_days'],
          }),
          this.modals.bills.findAll({
            where: billOption,
            attributes: [
              'id', ['consumer_name', 'consumerName'],
              ['consumer_email', 'consumerEmail'],
              ['consumer_phone_no', 'consumerPhoneNo'],
              ['document_number', 'invoiceNo'], 'seller_id'],
            include: [
              {
                model: this.modals.onlineSellers,
                as: 'sellers',
                attributes: [
                  ['sid', 'id'], ['seller_name', 'sellerName'],
                  'url', 'gstin', 'contact', 'email',
                  [
                    this.modals.sequelize.fn('CONCAT', 'sellers/',
                        this.modals.sequelize.literal('"sellers"."sid"'),
                        '/reviews?isonlineseller=true'), 'reviewUrl']],
                include: [
                  {
                    model: this.modals.sellerReviews,
                    as: 'sellerReviews',
                    attributes: [
                      ['review_ratings', 'ratings'],
                      ['review_feedback', 'feedback'],
                      ['review_comments', 'comments']],
                    required: false,
                  },
                ],
                required: false,
              }],
            required: options.status_type === 8,
          }),
          this.modals.offlineSellers.findAll({
            where: {sid: products.map(item => item.seller_id).filter(Boolean)},
            attributes: [
              ['sid', 'id'], ['seller_name', 'sellerName'],
              ['owner_name', 'ownerName'], ['pan_no', 'panNo'],
              ['reg_no', 'regNo'], ['is_service', 'isService'],
              'url', 'gstin', ['contact_no', 'contact'], 'email', 'address',
              'city', 'state', 'pincode', 'latitude', 'longitude',
              [
                this.modals.sequelize.fn('CONCAT', 'sellers/',
                    this.modals.sequelize.literal('"sid"'),
                    '/reviews?isonlineseller=false'), 'reviewUrl']],
            include: [
              {
                model: this.modals.sellerReviews,
                as: 'sellerReviews',
                attributes: [
                  ['review_ratings', 'ratings'],
                  ['review_feedback', 'feedback'],
                  ['review_comments', 'comments']],
                required: false,
              },
            ],
          }),
          this.modals.productReviews.findAll({
            where: {
              bill_product_id: products.map(item => item.id).
                  filter(Boolean),
            },
            attributes: [
              'bill_product_id', ['review_ratings', 'ratings'],
              ['review_feedback', 'feedback'],
              ['review_comments', 'comments']],
          }),
          this.modals.categories.findAll({
            where: {
              category_id: [
                ...products.map(item => item.category_id).filter(Boolean),
                ...products.map(item => item.main_category_id).filter(Boolean),
                ...products.map(item => item.sub_category_id).filter(Boolean)],
            },
            attributes: ['category_id', 'category_name'],
          }),
          this.modals.accessory_part.findAll({
            where: {
              id: products.map(item => item.accessory_part_id).
                  filter(Boolean),
            },
            attributes: ['id', 'title'],
          })]);
    brands = brands.map(item => item.toJSON());
    colours = colours.map(item => item.toJSON());
    service_schedules = service_schedules.map(item => item.toJSON());
    bills = bills.map(item => item.toJSON());
    offline_sellers = offline_sellers.map(item => item.toJSON());
    categories = categories.map(item => item.toJSON());
    accessory_parts = accessory_parts.map(item => item.toJSON());
    product_reviews = product_reviews.map(item => item.toJSON());

    products = products.map((item) => {
      const productItem = item;
      const sub_category = categories.find(
          subItem => productItem.sub_category_id === subItem.category_id);
      const category = categories.find(
          subItem => productItem.category_id === subItem.category_id);
      const main_category = categories.find(
          subItem => productItem.main_category_id === subItem.category_id);
      const accessory_part = accessory_parts.find(
          subItem => productItem.accessory_part_id === subItem.id);
      productItem.sub_category_name = (sub_category || {}).category_name;
      productItem.masterCategoryName = (main_category || {}).category_name;
      productItem.categoryName = (category || {}).category_name;
      productItem.accessory_part_name = (accessory_part || {}).title;
      productItem.sellers = offline_sellers.find(
          subItem => subItem.id === productItem.seller_id);
      productItem.bill = bills.find(
          subItem => subItem.id === productItem.bill_id);
      productItem.productReviews = product_reviews.filter(
          subItem => subItem.bill_product_id === productItem.id);
      productItem.brand = brands.find(
          subItem => subItem.id === productItem.brand_id);
      productItem.schedule = service_schedules.find(
          subItem => subItem.id === productItem.service_schedule_id);
      productItem.purchaseDate = moment.utc(productItem.purchaseDate,
          moment.ISO_8601).startOf('days');
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
    inProgressProductOption = _.omit(inProgressProductOption, 'bill_id');
    inProgressProductOption = _.omit(inProgressProductOption, '$or');
    inProgressProductOption = _.omit(inProgressProductOption,
        'accessory_part_id');
    inProgressProductOption = _.omit(inProgressProductOption, 'accessory_id');
    inProgressProductOption.status_type = [5, 11, 12];
    inProgressProductOption.product_status_type = options.status_type;
    inProgressProductOption = _.omit(inProgressProductOption, 'ref_id');
    let warrantyOptions = {};
    _.assignIn(warrantyOptions, inProgressProductOption);
    warrantyOptions.warranty_type = [1, 2];
    let metaData = [], insurances = [], warranties = [], amcs = [],
        repairs = [], pucs = [];
    if (products.length > 0) {
      inProgressProductOption.product_id = products.map((item) => item.id);
      [
        metaData, insurances, warranties,
        amcs, repairs, pucs] = await Promise.all([
        this.retrieveProductMetadata({
          product_id: products.map((item) => item.id),
        }, language),
        this.insuranceAdaptor.retrieveInsurances(inProgressProductOption),
        this.warrantyAdaptor.retrieveWarranties(warrantyOptions),
        this.amcAdaptor.retrieveAMCs(inProgressProductOption),
        this.repairAdaptor.retrieveRepairs(inProgressProductOption),
        this.pucAdaptor.retrievePUCs(inProgressProductOption)]);
    }
    return products.map((productItem) => {
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
      productItem.insuranceDetails = insurances.filter(
          (item) => item.productId === productItem.id);
      productItem.warrantyDetails = warranties.filter(
          (item) => item.productId === productItem.id);
      productItem.amcDetails = amcs.filter(
          (item) => item.productId === productItem.id);
      productItem.repairBills = repairs.filter(
          (item) => item.productId === productItem.id);
      productItem.pucDetails = pucs.filter(
          (item) => item.productId === productItem.id);

      productItem.requiredCount = productItem.insuranceDetails.length +
          productItem.warrantyDetails.length +
          productItem.amcDetails.length +
          productItem.repairBills.length + productItem.pucDetails.length;

      return productItem;
    });
  }

  async retrieveUpcomingProducts(options, language) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }

    options.model = {
      $not: null,
    };
    options.service_schedule_id = {
      $not: null,
    };

    const productResult = await this.modals.products.findAll({
      where: options, include: [
        {
          model: this.modals.serviceSchedules, as: 'schedule', attributes: [
            'id', 'inclusions', 'exclusions', 'service_number', 'service_type',
            'distance', 'due_in_months', 'due_in_days'], required: false,
        }, {
          model: this.modals.categories, as: 'category',
          attributes: [], required: false,
        }, {
          model: this.modals.categories, as: 'mainCategory',
          attributes: [], required: false,
        }, {
          model: this.modals.categories, as: 'sub_category',
          attributes: [], required: false,
        }], attributes: [
        'id', ['id', 'productId'], ['product_name', 'productName'], [
          this.modals.sequelize.literal('"category"."category_id"'),
          'categoryId'],
        ['main_category_id', 'masterCategoryId'], 'sub_category_id',
        ['brand_id', 'brandId'], ['colour_id', 'colorId'],
        ['purchase_cost', 'value'], 'taxes', [
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`),
          'sub_category_name'], [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`), 'categoryName'],
        [
          this.modals.sequelize.literal(`${language ?
              `"mainCategory"."category_name_${language}"` :
              `"mainCategory"."category_name"`}`), 'masterCategoryName'],
        [
          this.modals.sequelize.literal(`"sub_category"."category_name"`),
          'default_sub_category_name'],
        [
          this.modals.sequelize.literal(`"mainCategory"."category_name"`),
          'default_masterCategoryName'],
        [
          this.modals.sequelize.literal(`"category"."category_name"`),
          'default_categoryName'],
        ['document_date', 'purchaseDate'], 'model', 'file_type', 'file_ref',
        ['document_number', 'documentNo'], ['updated_at', 'updatedDate'],
        ['bill_id', 'billId'], ['job_id', 'jobId'],
        ['seller_id', 'sellerId'], 'copies', 'status_type'],
      order: [['document_date', 'DESC']],
    });
    return await Promise.try(() => productResult.map((item) => {
      const productItem = item.toJSON();
      productItem.serviceCenterUrl = `/consumer/servicecenters?brandid=${productItem.brandId}&categoryid=${productItem.categoryId}`;
      productItem.reviewUrl = `products/${productItem.id}/reviews`;
      productItem.productURL = `products/${productItem.id}`;
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
          `/categories/${productItem.category_id}/images/1/thumbnail`;
      productItem.purchaseDate = moment.utc(productItem.purchaseDate,
          moment.ISO_8601).startOf('days');
      if (productItem.schedule) {
        productItem.schedule.due_date = moment.utc(productItem.purchaseDate,
            moment.ISO_8601).
            add(productItem.schedule.due_in_months, 'months');
      }
      return productItem;
    }));
  }

  async retrieveUsersLastProduct(options, language) {
    let billOption = {};
    let products;

    if (options.online_seller_id) {
      billOption.seller_id = options.online_seller_id;
    } else {
      billOption = undefined;
    }
    options = _.omit(options, 'online_seller_id');

    options = _.omit(options, 'product_status_type');

    const productResult = await this.modals.products.findAll({
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
            ['sid', 'id'], ['seller_name', 'sellerName'],
            ['owner_name', 'ownerName'], ['pan_no', 'panNo'],
            ['reg_no', 'regNo'], ['is_service', 'isService'],
            'url', 'gstin', ['contact_no', 'contact'],
            'email', 'address', 'city', 'state',
            'pincode', 'latitude', 'longitude', [
              this.modals.sequelize.fn('CONCAT', 'sellers/',
                  this.modals.sequelize.literal('"sellers"."sid"'),
                  '/reviews?isonlineseller=false'), 'reviewUrl']],
          include: [
            {
              model: this.modals.sellerReviews,
              as: 'sellerReviews', attributes: [
                ['review_ratings', 'ratings'],
                ['review_feedback', 'feedback'],
                ['review_comments', 'comments']],
              required: false,
            },
          ],
          required: false,
        },
        {
          model: this.modals.productReviews,
          as: 'productReviews', attributes: [
            ['review_ratings', 'ratings'],
            ['review_feedback', 'feedback'],
            ['review_comments', 'comments']],
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
        'id', 'file_type', 'file_ref',
        ['product_name', 'productName'], 'model',
        ['category_id', 'categoryId'],
        ['main_category_id', 'masterCategoryId'],
        'sub_category_id', ['brand_id', 'brandId'],
        ['colour_id', 'colorId'],
        ['purchase_cost', 'value'], 'taxes',
        [
          this.modals.sequelize.fn('CONCAT', '/categories/',
              this.modals.sequelize.col('"products"."category_id"'),
              '/images/'), 'cImageURL'],
        [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"')), 'productURL'],
        [
          this.modals.sequelize.literal(`${language ?
              `"sub_category"."category_name_${language}"` :
              `"sub_category"."category_name"`}`), 'sub_category_name'], [
          this.modals.sequelize.literal(`${language ?
              `"category"."category_name_${language}"` :
              `"category"."category_name"`}`), 'categoryName'], [
          this.modals.sequelize.literal(`"sub_category"."category_name"`),
          'default_sub_category_name'], [
          this.modals.sequelize.literal(`"mainCategory"."category_name"`),
          'default_masterCategoryName'], [
          this.modals.sequelize.literal(`"category"."category_name"`),
          'default_categoryName'], [
          this.modals.sequelize.literal(`${language ?
              `"mainCategory"."category_name_${language}"` :
              `"mainCategory"."category_name"`}`), 'masterCategoryName'],
        ['document_date', 'purchaseDate'],
        ['document_number', 'documentNo'], ['updated_at', 'updatedDate'],
        ['bill_id', 'billId'], ['job_id', 'jobId'],
        ['seller_id', 'sellerId'], 'copies', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"'), '/reviews'),
          'reviewUrl'], [
          this.modals.sequelize.fn('CONCAT',
              '/consumer/servicecenters?brandid=',
              this.modals.sequelize.literal('"products"."brand_id"'),
              '&categoryid=',
              this.modals.sequelize.col('"products"."category_id"')),
          'serviceCenterUrl'], 'updated_at', 'status_type',
      ],
      order: [['updated_at', 'DESC']],
    });
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
                productItem.bill.billStatus === 5));
    let results;
    if (products.length > 0) {
      const results = await Promise.all([
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
  }

  async retrieveProductIds(options) {
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

    const productResult = await this.modals.products.findAll({
      where: options,
      include: [
        {
          model: this.modals.bills, where: billOption, include: [
            {
              model: this.modals.onlineSellers, as: 'sellers',
              attributes: [], required: false,
            }], attributes: ['status_type'], required: !!(billOption.seller_id),
        },
      ],
      attributes: ['id', 'status_type'],
    });
    return productResult.map((item) => item.toJSON()).filter(
        (productItem) => productItem.status_type !== 8 ||
            (productItem.status_type === 8 && productItem.bill &&
                productItem.bill.status_type === 5));
  }

  async retrieveProductCounts(options) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }

    let billOption = {};
    if (options.status_type === 8) {
      billOption.status_type = 5;
    }

    let inProgressProductOption = {};
    _.assignIn(inProgressProductOption, options);
    let productResult;
    options = _.omit(options, 'product_status_type');
    const productItems = await this.modals.products.findAll({
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
    });
    productResult = productItems.map((item) => item.toJSON());
    inProgressProductOption = _.omit(inProgressProductOption,
        'accessory_part_id');
    inProgressProductOption = _.omit(inProgressProductOption, 'accessory_id');
    inProgressProductOption.status_type = 5;
    inProgressProductOption.product_status_type = options.status_type;
    const results = await Promise.all([
      this.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
      this.insuranceAdaptor.retrieveInsuranceCount(inProgressProductOption),
      this.warrantyAdaptor.retrieveWarrantyCount(inProgressProductOption),
      this.repairAdaptor.retrieveRepairCount(inProgressProductOption),
      this.pucAdaptor.retrievePUCs(inProgressProductOption)]);
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
  }

  async retrieveProductById(id, options, language) {
    try {
      options.id = id;
      let productItem;
      let products;
      const productResult = await this.modals.products.findOne({
        where: options,
        include: [
          {
            model: this.modals.serviceSchedules,
            as: 'schedule',
            attributes: [
              'id', 'title', 'inclusions',
              'exclusions', 'service_number', 'service_type',
              'distance', 'due_in_months', 'due_in_days'],
            required: false,
          },
          {
            model: this.modals.bills,
            attributes: [
              ['consumer_name', 'consumerName'],
              ['consumer_email', 'consumerEmail'],
              ['consumer_phone_no', 'consumerPhoneNo'],
              ['document_number', 'invoiceNo']], include: [
              {
                model: this.modals.onlineSellers,
                as: 'sellers',
                attributes: [
                  ['seller_name', 'sellerName'], 'url',
                  'contact', 'email', [
                    this.modals.sequelize.fn('CONCAT', 'sellers/',
                        this.modals.sequelize.literal('"bill->sellers"."sid"'),
                        '/reviews?isonlineseller=true'), 'reviewUrl']],
                include: [
                  {
                    model: this.modals.sellerReviews, as: 'sellerReviews',
                    attributes: [
                      ['review_ratings', 'ratings'],
                      ['review_feedback', 'feedback'],
                      ['review_comments', 'comments']],
                    required: false,
                  }],
                required: false,
              }], required: false,
          },
          {
            model: this.modals.offlineSellers, as: 'sellers',
            attributes: [
              ['sid', 'id'], ['seller_name', 'sellerName'],
              'url', ['contact_no', 'contact'], 'email',
              'address', 'city', 'state', 'pincode',
              'latitude', 'longitude', [
                this.modals.sequelize.fn('CONCAT', 'sellers/',
                    this.modals.sequelize.literal('"sellers"."sid"'),
                    '/reviews?isonlineseller=false'), 'reviewUrl']], include: [
              {
                model: this.modals.sellerReviews, as: 'sellerReviews',
                attributes: [
                  ['review_ratings', 'ratings'],
                  ['review_feedback', 'feedback'],
                  ['review_comments', 'comments']], required: false,
              }], required: false,
          },
          {
            model: this.modals.productReviews, as: 'productReviews',
            attributes: [
              ['review_ratings', 'ratings'], ['review_feedback', 'feedback'],
              ['review_comments', 'comments']], required: false,
          }, {
            model: this.modals.categories, as: 'category',
            attributes: [], required: false,
          }, {
            model: this.modals.categories, as: 'mainCategory', attributes: [],
            required: false,
          }, {
            model: this.modals.categories, as: 'sub_category', attributes: [],
            required: false,
          }],
        attributes: [
          'id', ['product_name', 'productName'],
          'file_type', 'file_ref', [
            this.modals.sequelize.literal('"category"."category_id"'),
            'categoryId'], ['main_category_id', 'masterCategoryId'],
          'model', 'sub_category_id', ['colour_id', 'colorId'], [
            this.modals.sequelize.literal(
                `${language ? `"sub_category"."category_name_${language}"` :
                    `"sub_category"."category_name"`}`), 'sub_category_name'],
          [
            this.modals.sequelize.literal(
                `${language ? `"category"."category_name_${language}"` :
                    `"category"."category_name"`}`), 'categoryName'],
          [
            this.modals.sequelize.literal(`"sub_category"."category_name"`),
            'default_sub_category_name'], ['purchase_cost', 'value'], [
            this.modals.sequelize.literal(`"mainCategory"."category_name"`),
            'default_masterCategoryName'], 'taxes', [
            this.modals.sequelize.literal(`"category"."category_name"`),
            'default_categoryName'], ['brand_id', 'brandId'], [
            this.modals.sequelize.literal(
                `${language ? `"mainCategory"."category_name_${language}"` :
                    `"mainCategory"."category_name"`}`), 'masterCategoryName'],
          [
            this.modals.sequelize.fn('CONCAT', '/categories/',
                this.modals.sequelize.col('"category"."category_id"'),
                '/images/0'), 'cImageURL'], ['document_date', 'purchaseDate'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"')),
            'productURL'], ['document_number', 'documentNo'],
          ['updated_at', 'updatedDate'], [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.literal('"products"."id"'), '/reviews'),
            'reviewUrl'], ['job_id', 'jobId'], ['seller_id', 'sellerId'],
          [
            this.modals.sequelize.fn('CONCAT',
                '/consumer/servicecenters?brandid=',
                this.modals.sequelize.literal('"products"."brand_id"'),
                '&categoryid=',
                this.modals.sequelize.col('"products"."category_id"')),
            'serviceCenterUrl'],
          'copies',
          'status_type'],
      });
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

        const rcPromise = products.masterCategoryId &&
        products.masterCategoryId === 3 ?
            this.regCertAdaptor.retrieveRegCerts({product_id: products.id}) :
            [];

        const fuelPromise = products.masterCategoryId &&
        products.masterCategoryId === 3 ?
            this.fuelAdaptor.retrieveRefueling({product_id: products.id}) :
            [];
        let [metaData, brand, insuranceDetails, warrantyDetails, amcDetails, repairBills, pucDetails, serviceSchedules, serviceCenterCounts, rc_details, accessories, fuel_details] = await Promise.all(
            [
              this.retrieveProductMetadata({product_id: products.id}, language),
              this.brandAdaptor.retrieveBrandById(products.brandId,
                  {category_id: products.categoryId}),
              this.insuranceAdaptor.retrieveInsurances(
                  {product_id: products.id}),
              this.warrantyAdaptor.retrieveWarranties(
                  {product_id: products.id}),
              this.amcAdaptor.retrieveAMCs({product_id: products.id}),
              this.repairAdaptor.retrieveRepairs({product_id: products.id}),
              this.pucAdaptor.retrievePUCs({product_id: products.id}),
              products.schedule ?
                  this.serviceScheduleAdaptor.retrieveServiceSchedules({
                    category_id: products.categoryId,
                    brand_id: products.brandId,
                    status_type: 1, title: {$iLike: products.schedule.title},
                    id: {$gte: products.schedule.id},
                  }) : undefined,
              this.modals.serviceCenters.count({
                include: [
                  {
                    model: this.modals.brands, as: 'brands',
                    where: {brand_id: products.brandId},
                    attributes: [], required: true,
                  }, {
                    model: this.modals.centerDetails,
                    where: {category_id: products.categoryId},
                    attributes: [], required: true, as: 'centerDetails',
                  }],
              }),
              rcPromise,
              this.retrieveProducts({ref_id: products.id}),
              fuelPromise]);
        products.purchaseDate = moment.utc(products.purchaseDate,
            moment.ISO_8601).startOf('days');
        products.metaData = metaData.filter(
            (item) => !item.name.toLowerCase().includes('puc'));
        products.brand = brand;
        products.insuranceDetails = insuranceDetails;
        products.warrantyDetails = warrantyDetails;
        products.amcDetails = amcDetails;
        products.rc_details = rc_details;
        products.repairBills = repairBills;
        products.pucDetails = pucDetails;
        let temp_odometer = 0, temp_quantity = 0, temp_price = 0;
        const asc_fuel_detail = _.orderBy(fuel_details, ['odometer_reading'],
            ['asc']);
        products.fuel_details = _.orderBy(
            asc_fuel_detail.map((fItem, index) => {
              if (index > 0) {
                const odo_diff = (fItem.odometer_reading - temp_odometer);
                fItem.mileage = odo_diff && temp_quantity ?
                    odo_diff / temp_quantity :
                    0;

                fItem.rs_km = temp_price && odo_diff ?
                    temp_price / odo_diff :
                    0;
              }
              temp_odometer = fItem.odometer_reading;
              temp_quantity = fItem.fuel_quantity;
              temp_price = fItem.value;
              return fItem;
            }), ['odometer_reading', 'effective_date'], ['desc', 'desc']);
        if (fuel_details.length > 1) {
          products.mileage = fuel_details[0].mileage;
        }

        products.accessories = accessories;
        products.serviceSchedules = serviceSchedules ?
            serviceSchedules.map((scheduleItem) => {
              scheduleItem.due_date = moment.utc(products.purchaseDate,
                  moment.ISO_8601).add(scheduleItem.due_in_months, 'months');

              return scheduleItem;
            }) : serviceSchedules;
        products.serviceCenterUrl = serviceCenterCounts &&
        serviceCenterCounts > 0 ? products.serviceCenterUrl : '';
      }

      return products;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async updateProductDetails(parameters) {
    try {
      let {user, productBody, metaDataBody, otherItems, id} = parameters;
      let dbProduct;
      let flag = false;
      dbProduct = (await this.modals.products.findOne({
        where: {id}, include: {
          model: this.modals.users,
          as: 'consumer',
          attributes: ['id', ['full_name', 'name'], 'email'],
        },
      })).toJSON();
      productBody.seller_id = dbProduct.seller_id;
      productBody.brand_id = productBody.brand_name || productBody.brand_id ||
      productBody.brand_id === 0
          ? productBody.brand_id : dbProduct.brand_id;
      productBody.model = productBody.brand_name || productBody.model ||
      productBody.model !== ''
          ? productBody.model : dbProduct.model;
      productBody.category_id = productBody.category_id ||
          dbProduct.category_id;
      productBody.main_category_id = productBody.main_category_id ||
          dbProduct.main_category_id;
      productBody.sub_category_id = productBody.sub_category_id ||
          dbProduct.sub_category_id;
      productBody.document_date = productBody.document_date ||
          dbProduct.document_date;
      productBody.purchase_cost = productBody.purchase_cost ||
          dbProduct.purchase_cost;
      productBody.product_name = productBody.product_name ||
          dbProduct.product_name;
      const result = await Promise.all([
        productBody.brand_id || productBody.brand_id === 0 ?
            this.modals.products.count({
              where: {
                id, brand_id: productBody.brand_id,
                model: productBody.model, status_type: {$notIn: [8]},
              },
            }) : 1,
        this.verifyCopiesExist(id),
        this.modals.products.count({
          where: {id, status_type: 8},
        }),
        this.modals.products.count({
          where: {
            user_id: productBody.user_id, category_id: [1, 2, 3],
            status_type: [5, 11],
          },
        }),
      ]);

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
      const {amc, insurance, repair, puc, warranty} = otherItems;
      const isProductAMCSellerSame = false;
      const isProductRepairSellerSame = false;
      const isAMCRepairSellerSame = repair && amc && repair.seller_contact ===
          amc.seller_contact;
      const isProductPUCSellerSame = false;
      const {main_category_id, category_id, user_id, brand_name, brand_id, model, document_number, document_date, taxes, purchase_cost, colour_id, seller_contact, seller_name, seller_email} = productBody;
      const providerOptions = {
        main_category_id, category_id, status_type: 11, updated_by: user_id,
      };
      const insuranceProviderPromise = insurance &&
      insurance.provider_name ?
          this.insuranceAdaptor.findCreateInsuranceBrand(_.assign({
            type: 1, name: insurance.provider_name,
          }, providerOptions)) :
          undefined;
      const warrantyProviderPromise = warranty &&
      warranty.extended_provider_name ?
          this.insuranceAdaptor.findCreateInsuranceBrand(_.assign({
            type: 2, name: warranty.extended_provider_name,
          }, providerOptions)) :
          undefined;

      const brandPromise = !brand_id &&
      brand_id !== 0 && brand_name ?
          this.brandAdaptor.findCreateBrand({
            status_type: 11, brand_name, category_id,
            updated_by: user_id, created_by: user_id,
          }) : undefined;
      this.prepareSellerPromise({sellerPromise, productBody, amc, repair, puc});
      sellerPromise.push(insuranceProviderPromise);
      sellerPromise.push(brandPromise);
      sellerPromise.push(warrantyProviderPromise);
      let product = productBody;
      let [sellerDetail, amcSeller, repairSeller, pucSeller, insuranceProvider, brandDetail, warrantyProvider] = await Promise.all(
          sellerPromise);
      const newSeller = seller_contact || seller_name || seller_email ?
          sellerDetail :
          undefined;
      product = _.omit(product, 'seller_name');
      product = _.omit(product, 'seller_contact');
      product = _.omit(product, 'brand_name');
      product.seller_id = newSeller ? newSeller.sid : product.seller_id;
      product.brand_id = brandDetail ? brandDetail.brand_id : brand_id;

      let metadata = metaDataBody.map((mdItem) => {
        mdItem = _.omit(mdItem, 'new_drop_down');
        return mdItem;
      });

      if (product.new_drop_down && model) {
        await this.modals.brandDropDown.findCreateFind({
          where: {title: {$iLike: model}, category_id, brand_id},
          defaults: {
            title: model, category_id, brand_id,
            updated_by: user_id, created_by: user_id, status_type: 11,
          },
        });
      }

      product = !colour_id ? _.omit(product, 'colour_id') : product;
      product = !purchase_cost && purchase_cost !== 0 ?
          _.omit(product, 'purchase_cost') :
          product;
      product = _.omit(product, 'new_drop_down');
      product = !model && model !== '' ? _.omit(product, 'model') : product;
      product = !taxes && taxes !== 0 ? _.omit(product, 'taxes') : product;
      product = !document_number ? _.omit(product, 'document_number') : product;
      product = !document_date ? _.omit(product, 'document_date') : product;
      product = !product.seller_id ? _.omit(product, 'seller_id') : product;
      product = !product.brand_id && product.brand_id !== 0 ?
          _.omit(product, 'brand_id') :
          product;
      const brandModelPromise = model ? [
            this.modals.brandDropDown.findOne({
              where: {
                brand_id: product.brand_id,
                title: {$iLike: `${model}%`}, category_id,
              },
            }), this.modals.categories.findOne({where: {category_id}})] :
          [, this.modals.categories.findOne({where: {category_id}})];
      brandModelPromise.push(this.modals.warranties.findAll({
        where: {product_id: id, warranty_type: 1},
        order: [['expiry_date', 'ASC']],
      }), this.modals.metaData.findAll({where: {product_id: id}}));
      let [renewalTypes, productDetail, productModel, productCategory, normalWarranties, currentMetaData] = await Promise.all(
          [
            this.categoryAdaptor.retrieveRenewalTypes({status_type: 1}),
            this.updateProduct(id, JSON.parse(JSON.stringify(product))),
            ...brandModelPromise]);
      normalWarranties = normalWarranties ?
          normalWarranties.map((item) => item.toJSON()) :
          [];
      product = productDetail;
      currentMetaData = currentMetaData ?
          currentMetaData.map(
              item => item.toJSON()) : [];
      const productPromise = [];
      await this.prepareProductItems({
        product, productModel, productCategory,
        normalWarranties, productPromise, currentMetaData,
        metadata, amc, insurance, puc, repair, warranty,
        renewalTypes, sellerDetail, amcSeller, repairSeller,
        pucSeller, insuranceProvider, warrantyProvider,
        isProductAMCSellerSame, isProductRepairSellerSame,
        isAMCRepairSellerSame, isProductPUCSellerSame,
      });

      if (!productBody.accessory_part_id && !productBody.accessory_id &&
          dbProduct.status_type === 8) {
        let [accessories, brand, fcm_detail] = await Promise.all([
          this.retrieveAccessoryForProducts(
              {category_id: productBody.category_id}),
          this.modals.brands.findById(product.brand_id),
          this.modals.fcmDetails.findAll({where: {user_id: product.user_id}})]);

        console.log('\n\n\n\n\n\n', JSON.stringify({fcm_detail, accessories}));
        if (fcm_detail && accessories.length > 0) {
          fcm_detail = fcm_detail.map(item => item.toJSON());
          notifyUser(id, {
            title: `Add some zing to your ${product.product_name ||
            `${product.brand.brand_name} ${product.model || ''}`}!.`,
            description: `Check out Trendy Accessories for your ${product.product_name ||
            `${product.brand.brand_name} ${product.model ||
            ''}`} in our Deals section.`,
            notification_type: 5,
            link: 'http://bit.ly/2NXhJGC' ||
            `https://www.binbill.com/deals/accessories/${product.category_id}?product_id=${product.id}`,
            id: product.id,
          }, {
            title: `Add some zing to your ${product.product_name ||
            `${product.brand.brand_name} ${product.model || ''}`}!.`,
            body: `Check out Trendy Accessories for your ${product.product_name ||
            `${product.brand.brand_name} ${product.model ||
            ''}`} in our Deals section.`,
          }, fcm_detail);
        }
        if (dbProduct.consumer.email && accessories.length > 0) {
          const {email, id, name} = dbProduct.consumer;
          product.accessories = accessories;
          product.brand = brand.toJSON();
          this.sendProductAccessoryMail(
              {email, id, name, product});
        }
      }
      product.flag = flag;

      return product;
    } catch (e) {
      console.log('\n\n\n', e);
      throw e;
    }
  }

  async updateAccessoryProduct(parameters) {
    try {
      let {user, productBody, otherItems, id, ref_id} = parameters;
      let dbProduct, masterProduct;
      let flag = false;
      [masterProduct, dbProduct] = await Promise.all([
        this.modals.products.findOne({where: {id: ref_id}}),
        this.modals.products.findById(id)]);
      masterProduct = masterProduct.toJSON();
      dbProduct = dbProduct ? dbProduct.toJSON() : {};
      productBody.seller_id = dbProduct.seller_id;
      productBody.brand_id = productBody.brand_id || productBody.brand_id === 0
          ? productBody.brand_id : dbProduct.brand_id;
      productBody.job_id = productBody.job_id || masterProduct.job_id;
      productBody.category_id = productBody.category_id ||
          masterProduct.category_id;
      productBody.main_category_id = productBody.main_category_id ||
          masterProduct.main_category_id;
      productBody.accessory_part_id = productBody.accessory_part_id ||
          dbProduct.accessory_part_id;
      productBody.sub_category_id = productBody.sub_category_id ||
          masterProduct.sub_category_id;
      productBody.document_date = productBody.document_date ||
          dbProduct.document_date;
      productBody.purchase_cost = productBody.purchase_cost ||
          dbProduct.purchase_cost;
      productBody.product_name = productBody.product_name ||
          dbProduct.product_name;
      let {warranty} = otherItems;
      const {
        main_category_id, category_id, user_id, accessory_part_name, document_number,
        document_date, taxes, purchase_cost, accessory_part_id, job_id,
      } = productBody;

      const accessory_part_promise = !accessory_part_id && accessory_part_name ?
          this.findCreateAccessoryPart({
            status_type: 11, title: accessory_part_name,
            accessory_part_name, category_id, main_category_id,
            updated_by: user_id, created_by: user_id,
          }) : undefined;
      let product = productBody;
      let [accessory_part] = await Promise.all([accessory_part_promise]);
      product = !purchase_cost && purchase_cost !== 0 ?
          _.omit(product, 'purchase_cost') : product;
      product = _.omit(product, 'accessory_part_name');
      product = !taxes && taxes !== 0 ? _.omit(product, 'taxes') : product;
      product = !document_number ? _.omit(product, 'document_number') : product;
      product = !document_date ? _.omit(product, 'document_date') : product;
      product = !product.seller_id ? _.omit(product, 'seller_id') : product;
      product = !product.brand_id && product.brand_id !== 0 ?
          _.omit(product, 'brand_id') : product;
      product.ref_id = ref_id;
      product.accessory_part_id = accessory_part ?
          accessory_part.id : product.accessory_part_id;
      let [renewalTypes, productDetail] = await Promise.all(
          [
            this.categoryAdaptor.retrieveRenewalTypes({status_type: 1}),
            id ? this.updateProduct(id, JSON.parse(JSON.stringify(product))) :
                this.createEmptyProduct(JSON.parse(JSON.stringify(product)))]);
      product = productDetail;
      let {renewal_type, effective_date, id: warranty_id, expiry_date} = warranty ||
      {};

      if (renewal_type) {
        const warrantyRenewalType = renewalTypes.find(
            item => item.type === renewal_type);
        effective_date = effective_date || document_date || moment.utc();
        effective_date = moment.utc(effective_date, moment.ISO_8601).isValid() ?
            moment.utc(effective_date, moment.ISO_8601).startOf('day') :
            moment.utc(effective_date, 'DD MMM YY').startOf('day');
        expiry_date = moment.utc(effective_date, moment.ISO_8601).
            add(warrantyRenewalType.effective_months, 'months').
            subtract(1, 'day').endOf('days');
        const warrantyOptions = {
          renewal_type, updated_by: user_id, status_type: 11, job_id,
          product_id: productDetail.id, warranty_type: 1, user_id,
          expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
          effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
          document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
        };

        warranty = await (warranty_id ?
            this.warrantyAdaptor.updateWarranties(warranty_id, warrantyOptions)
            : this.warrantyAdaptor.createWarranties(warrantyOptions));
      }

      product.warranty = warranty;
      return product;
    } catch (e) {
      throw e;
    }
  }

  async prepareProductItems(parameters) {
    let {
      product, productModel, productCategory, normalWarranties, currentMetaData,
      warranty, sellerDetail, metadata, amc, insurance, puc, repair, renewalTypes, amcSeller,
      repairSeller, pucSeller, insuranceProvider, warrantyProvider, isProductAMCSellerSame,
      isProductRepairSellerSame, isAMCRepairSellerSame, isProductPUCSellerSame, productPromise,
    } = parameters;
    const {document_date, main_category_id, model, category_id, brand_id, user_id, isModalSame} = product;
    if (product) {
      const warrantyItemPromise = [];
      let serviceSchedule;
      if (main_category_id === 3 && model) {
        const diffDays = moment.utc().
            diff(moment.utc(document_date), 'days', true);
        const diffMonths = moment.utc().
            diff(moment.utc(document_date), 'months', true);
        serviceSchedule = this.serviceScheduleAdaptor.retrieveServiceSchedules(
            {
              category_id, brand_id, title: {$iLike: `${model}%`},
              status_type: 1, $or: {
                due_in_days: {$or: {$gte: diffDays}},
                due_in_months: {$or: {$eq: null, $gte: diffMonths}},
              },
            });
      }

      if (!product.isModalSame) {
        if (productCategory) {
          const {product_type, category_form_1_value, category_form_2_value} = (productModel ||
              {});
          const {type_category_form, category_form_1, category_form_2} = productCategory;
          if (type_category_form) {
            const typeMDExist = metadata.find(
                (mdItem) => mdItem.category_form_id === type_category_form);
            if (!typeMDExist || !model) {
              metadata.push({
                category_form_id: type_category_form,
                form_value: product_type,
                updated_by: user_id,
              });
            }
          }

          if (category_form_1) {
            const typeMDExist = metadata.find(
                (mdItem) => mdItem.category_form_id === category_form_1);
            if (!typeMDExist || !model) {
              metadata.push({
                category_form_id: category_form_1,
                form_value: category_form_1_value,
                updated_by: user_id,
              });
            }
          }

          if (category_form_2) {
            const typeMDExist = metadata.find(
                (mdItem) => mdItem.category_form_id === category_form_2);
            if (!typeMDExist || !model) {
              metadata.push({
                category_form_id: category_form_2,
                form_value: category_form_2_value,
                updated_by: user_id,
              });
            }
          }
        }

        if (!warranty) {
          if ((productModel || !model) && (normalWarranties || []).length > 0) {
            warrantyItemPromise.push(...normalWarranties.map(
                (wItem) => this.warrantyAdaptor.deleteWarranties(wItem.id,
                    user_id)));
          }

          const {warranty_renewal_type, dual_renewal_type} = (productModel ||
              {});
          warranty = {renewal_type: warranty_renewal_type, dual_renewal_type};
        }
      }

      if (warranty) {
        this.prepareWarrantyPromise({
          warranty, renewalTypes,
          warrantyItemPromise, product, warrantyProvider,
        });
      }

      const insurancePromise = [];
      if (insurance) {
        this.prepareInsurancePromise({
          insurance, renewalTypes, insurancePromise,
          product, insuranceProvider,
        });
      }

      const amcPromise = [];
      if (amc) {
        this.prepareAMCPromise({
          renewalTypes, amc, amcPromise, product,
          isProductAMCSellerSame, sellerDetail, amcSeller,
        });
      }

      const repairPromise = [];
      if (repair) {
        this.prepareRepairPromise({
          repair, isProductRepairSellerSame,
          sellerDetail, amcSeller, repairSeller,
          isAMCRepairSellerSame, repairPromise, product,
        });
      }

      const metadataPromise = metadata.filter(
          (mdItem) => mdItem.category_form_id).map((mdItem) => {
        mdItem.status_type = 11;
        const currentMetaDataItem = currentMetaData.find(
            (cmdItem) => cmdItem.category_form_id === mdItem.category_form_id);
        if (currentMetaDataItem && currentMetaDataItem.id) {
          return this.updateProductMetaData(currentMetaDataItem.id, mdItem);
        }

        mdItem.product_id = product.id;
        return this.modals.metaData.create(mdItem);
      });

      const pucPromise = [];
      if (puc) {
        this.preparePUCPromise({
          renewalTypes, puc, pucPromise, product,
          isProductPUCSellerSame, sellerDetail, pucSeller,
        });
      }
      [
        product.metaData, product.insurances, product.warranties, product.amcs,
        product.repairs, product.pucDetail, product.service_schedules,
        product.service_center_counts, product.rc_details] = await Promise.all([
        Promise.all(metadataPromise),
        Promise.all(insurancePromise),
        Promise.all(warrantyItemPromise),
        Promise.all(amcPromise),
        Promise.all(repairPromise),
        Promise.all(pucPromise), serviceSchedule,
        this.modals.serviceCenters.count({
          include: [
            {
              model: this.modals.brands, as: 'brands',
              where: {brand_id: product.brand_id},
              attributes: [], required: true,
            }, {
              model: this.modals.centerDetails,
              where: {category_id: product.category_id},
              attributes: [], required: true, as: 'centerDetails',
            }],
        }), main_category_id === 3 ?
            this.regCertAdaptor.updateRegCertPeriod(
                {
                  options: {product_id: product.id, user_id},
                  purchase_date: document_date,
                  new_purchase_date: document_date,
                }) :
            undefined]);

      product.metaData = product.metaData.filter(mdItem => mdItem).map(
          (mdItem) => mdItem.toJSON());
      if ((product.service_schedules || []).length > 0) {
        productPromise.push(this.updateProduct(product.id, {
          service_schedule_id: product.service_schedules[0].id,
        }));
      } else if (product.service_schedule_id && !product.model) {
        productPromise.push(this.updateProduct(product.id, {
          service_schedule_id: null,
        }));
      } else if ((product.service_schedule || []).length === 0) {
        productPromise.push(this.updateProduct(product.id, {
          service_schedule_id: null,
        }));
      }
      product.serviceCenterUrl = product.service_center_counts > 0 ?
          `/consumer/servicecenters?brandid=${product.brand_id}&categoryid=${product.category_id}`
          : '';

      await Promise.all(productPromise);
    }
  }

  async verifyCopiesExist(product_id) {
    const results = await Promise.all([
      this.modals.products.count({where: {id: product_id, status_type: 5}}),
      this.modals.amcs.count({where: {product_id, status_type: 5}}),
      this.modals.insurances.count({where: {product_id, status_type: 5}}),
      this.modals.pucs.count({where: {product_id, status_type: 5}}),
      this.modals.repairs.count({where: {product_id, status_type: 5}}),
      this.modals.warranties.count({where: {product_id, status_type: 5}})]);
    return (results.filter(item => item > 0).length > 0);
  }

  async preparePUCPromise(parameters) {
    let {puc, pucPromise, product, isProductPUCSellerSame, sellerDetail, pucSeller} = parameters;
    const {user_id, job_id, document_date} = product;
    let {expiry_period, effective_date, value, id, seller_contact, seller_name} = puc;

    const product_id = product.id;
    effective_date = effective_date || document_date || moment.utc();
    effective_date = moment.utc(effective_date, moment.ISO_8601).isValid() ?
        moment.utc(effective_date, moment.ISO_8601).startOf('day') :
        moment.utc(effective_date, 'DD MMM YY').startOf('day');
    const expiry_date = moment.utc(effective_date, moment.ISO_8601).
        add(expiry_period || 6, 'months').
        subtract(1, 'day').endOf('days').format('YYYY-MM-DD');
    const values = {
      renewal_type: expiry_period || 6, updated_by: user_id, status_type: 11,
      renewal_cost: value, product_id, job_id, user_id,
      seller_id: isProductPUCSellerSame ? sellerDetail.sid :
          seller_name || seller_contact ? pucSeller.sid : undefined,
      expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
      effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
    };
    pucPromise.push(id ?
        this.pucAdaptor.updatePUCs(id, values) :
        this.pucAdaptor.createPUCs(values));
  }

  async prepareRepairPromise(parameters) {
    let {repair, isProductRepairSellerSame, sellerDetail, amcSeller, repairSeller, isAMCRepairSellerSame, repairPromise, product} = parameters;
    const {user_id, job_id} = product;
    let {repair_for, document_date, warranty_upto, value, id, seller_contact, seller_name} = repair;
    const product_id = product.id;
    document_date = document_date || product.document_date;
    document_date = moment.utc(document_date, moment.ISO_8601).isValid() ?
        moment.utc(document_date, moment.ISO_8601).startOf('day') :
        moment.utc(document_date, 'DD MMM YY').startOf('day');

    const seller_id = isProductRepairSellerSame ? sellerDetail.sid :
        isAMCRepairSellerSame ? amcSeller.sid :
            seller_name || seller_name === '' || seller_contact ?
                repairSeller.sid : undefined;
    const values = {
      updated_by: user_id, status_type: 11, product_id, seller_id,
      document_date: moment.utc(document_date).format('YYYY-MM-DD'),
      repair_for, job_id, repair_cost: value, warranty_upto, user_id,
    };
    repairPromise.push(otherItems.repair.id ?
        this.repairAdaptor.updateRepairs(id, values) :
        this.repairAdaptor.createRepairs(values));
  }

  async prepareAMCPromise(parameters) {
    let {amc, amcPromise, product, isProductAMCSellerSame, sellerDetail, amcSeller} = parameters;
    const {document_date, user_id, job_id} = product;
    const product_id = product.id;
    let {seller_name, effective_date, seller_contact, value, id} = amc;
    effective_date = effective_date || document_date || moment.utc();
    effective_date = moment.utc(effective_date, moment.ISO_8601).isValid() ?
        moment.utc(effective_date, moment.ISO_8601).startOf('day') :
        moment.utc(effective_date, 'DD MMM YY').startOf('day');
    const expiry_date = moment.utc(effective_date, moment.ISO_8601).
        add(12, 'months').subtract(1, 'day').endOf('days').format('YYYY-MM-DD');
    const values = {
      renewal_type: 8, updated_by: user_id, status_type: 11, product_id, job_id,
      renewal_cost: value,
      seller_id: isProductAMCSellerSame ? sellerDetail.sid :
          seller_name || seller_name === '' || seller_contact ? amcSeller.sid :
              undefined, user_id,
      expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
      effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
    };
    amcPromise.push(otherItems.amc.id ? this.amcAdaptor.updateAMCs(id, values) :
        this.amcAdaptor.createAMCs(values));
  }

  async prepareInsurancePromise(parameters) {
    let {insurance, insurancePromise, product, insuranceProvider, renewalTypes} = parameters;
    const {document_date, user_id, job_id} = product;
    let {renewal_type, effective_date, policy_no, provider_id, amount_insured, value, id} = insurance;
    const product_id = product.id;
    let insuranceRenewalType = renewalTypes.find(
        item => item.type === 8);
    if (renewal_type) {
      insuranceRenewalType = renewalTypes.find(
          item => item.type === renewal_type);
    }

    effective_date = effective_date || document_date || moment.utc();
    effective_date = moment.utc(effective_date, moment.ISO_8601).isValid() ?
        moment.utc(effective_date, moment.ISO_8601).startOf('day') :
        moment.utc(effective_date, 'DD MMM YY').startOf('day');
    const expiry_date = moment.utc(effective_date, moment.ISO_8601).
        add(insuranceRenewalType.effective_months, 'months').
        subtract(1, 'day').endOf('days');
    const values = {
      renewal_type: renewal_type || 8, updated_by: user_id, job_id,
      status_type: 11, product_id, document_number: policy_no,
      amount_insured, renewal_cost: value, user_id,
      expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
      effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      provider_id: insuranceProvider ? insuranceProvider.id : provider_id,
    };
    insurancePromise.push(id ?
        this.insuranceAdaptor.updateInsurances(otherItems.insurance.id,
            values) : this.insuranceAdaptor.createInsurances(values));
  }

  async prepareWarrantyPromise(parameters) {
    let {warranty, renewalTypes, warrantyItemPromise, product, warrantyProvider} = parameters;
    let warrantyRenewalType;
    let expiry_date;
    const product_id = product.id;
    let {id, renewal_type, extended_id, extended_renewal_type, effective_date, extended_effective_date, extended_provider_id, extended_provider_name} = warranty;
    const {document_date, user_id, job_id} = product;
    const updateOption = {status_type: 11};
    if (id && !renewal_type) {
      warrantyItemPromise.push(
          this.warrantyAdaptor.updateWarranties(id, updateOption));
    }

    if (extended_id && !extended_renewal_type) {
      warrantyItemPromise.push(
          this.warrantyAdaptor.updateWarranties(extended_id, updateOption));
    }

    if (renewal_type) {
      warrantyRenewalType = renewalTypes.find(
          item => item.type === renewal_type);
      effective_date = effective_date || document_date || moment.utc();
      effective_date = moment.utc(effective_date, moment.ISO_8601).isValid() ?
          moment.utc(effective_date, moment.ISO_8601).startOf('day') :
          moment.utc(effective_date, 'DD MMM YY').startOf('day');
      expiry_date = moment.utc(effective_date, moment.ISO_8601).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').endOf('days');
      const warrantyOptions = {
        renewal_type, updated_by: user_id, status_type: 11, job_id,
        product_id, warranty_type: 1, user_id,
        expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
        effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
        document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      };

      warrantyItemPromise.push(id ?
          this.warrantyAdaptor.updateWarranties(warranty.id, warrantyOptions)
          : this.warrantyAdaptor.createWarranties(warrantyOptions));
    }

    if (extended_renewal_type) {
      warrantyRenewalType = renewalTypes.find(
          item => item.type === extended_renewal_type);
      effective_date = extended_effective_date || expiry_date ||
          document_date;
      effective_date = moment.utc(effective_date, moment.ISO_8601).isValid() ?
          moment.utc(effective_date, moment.ISO_8601).startOf('day') :
          moment.utc(effective_date, 'DD MMM YY').startOf('day');
      expiry_date = moment.utc(effective_date).
          add(warrantyRenewalType.effective_months, 'months').
          subtract(1, 'day').endOf('days');
      const extendedOptions = {
        renewal_type: extended_renewal_type,
        provider_id: extended_provider_name &&
        warrantyProvider ? warrantyProvider.id : extended_provider_id,
        updated_by: user_id, status_type: 11, job_id,
        product_id, warranty_type: 2, user_id,
        expiry_date: moment.utc(expiry_date).format('YYYY-MM-DD'),
        effective_date: moment.utc(effective_date).format('YYYY-MM-DD'),
        document_date: moment.utc(effective_date).format('YYYY-MM-DD'),
      };
      warrantyItemPromise.push(extended_id ?
          this.warrantyAdaptor.updateWarranties(extended_id, extendedOptions)
          : this.warrantyAdaptor.createWarranties(extendedOptions));
    }

    warrantyItemPromise.push(this.warrantyAdaptor.updateWarrantyPeriod(
        {product_id, user_id}, document_date, document_date));
  }

  async prepareSellerPromise(parameters) {
    let {sellerPromise, productBody, amc, repair, puc, isProductAMCSellerSame, isProductRepairSellerSame, isProductPUCSellerSame, isAMCRepairSellerSame} = parameters;
    let sellerOption;
    let {seller_id, seller_name, seller_contact, seller_email, seller_address, user_id} = productBody;
    seller_name = seller_name || '';
    if (seller_id) {
      sellerOption = {sid: seller_id};
    } else {
      sellerOption = {
        $or: {
          $and: {
            seller_name: {
              $iLike: seller_name,
            },
          },
        },
      };

      if (seller_contact && seller_contact.trim()) {
        sellerOption.$or.$and.contact_no = seller_contact.trim();
      }

      if (seller_email && seller_email.trim()) {
        sellerOption.$or.$and.email = {
          $iLike: seller_email.trim(),
        };
      }
    }

    sellerPromise.push(seller_contact && seller_contact.trim() ||
    seller_name && seller_name.trim() || seller_name === '' ||
    seller_email && seller_email.trim() ||
    seller_address && seller_address.trim() ?
        this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption, {
          seller_name,
          contact_no: seller_contact,
          email: seller_email,
          address: seller_address,
          updated_by: user_id,
          created_by: user_id,
          status_type: 11,
        }) :
        '');

    if (amc) {
      let {seller_name, seller_contact} = amc;
      seller_name = seller_name ? seller_name.trim() : '';
      seller_contact = seller_contact ? seller_contact.trim() : '';
      sellerOption.seller_name.$iLike = seller_name;
      if (seller_contact) {
        sellerOption.contact_no = seller_contact;
      } else {
        sellerOption = _.omit(sellerOption, 'contact_no');
      }
      sellerPromise.push((seller_contact || seller_name || seller_name === '') ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
              {
                seller_name, contact_no: seller_contact, updated_by: user_id,
                created_by: user_id, status_type: 11,
              }) : '');
    } else {
      sellerPromise.push('');
    }
    if (repair) {

      let {seller_name, seller_contact} = repair;
      seller_name = seller_name ? seller_name.trim() : '';
      seller_contact = seller_contact ? seller_contact.trim() : '';
      sellerOption.seller_name.$iLike = seller_name;
      if (repair.seller_contact) {
        sellerOption.contact_no = seller_contact;
      } else {
        sellerOption = _.omit(sellerOption, 'contact_no');
      }
      sellerPromise.push(!repair.is_amc_seller &&
      !isProductRepairSellerSame && !isAMCRepairSellerSame &&
      ((repair.seller_contact &&
          repair.seller_contact.trim()) ||
          (repair.seller_name &&
              repair.seller_name.trim())) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
              {
                seller_name: repair.seller_name,
                contact_no: repair.seller_contact,
                updated_by: productBody.user_id,
                created_by: productBody.user_id,
                status_type: 11,
              }) :
          '');
    } else {
      sellerPromise.push('');
    }
    if (puc) {
      sellerOption.seller_name.$iLike = puc.seller_name;
      if (puc.seller_contact) {
        sellerOption.contact_no = puc.seller_contact;
      } else {
        sellerOption = _.omit(sellerOption, 'contact_no');
      }
      sellerPromise.push(!isProductPUCSellerSame &&
      ((puc.seller_contact &&
          puc.seller_contact.trim()) ||
          (puc.seller_name && puc.seller_name.trim())) ?
          this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
              {
                seller_name: puc.seller_name,
                contact_no: puc.seller_contact,
                updated_by: productBody.user_id,
                created_by: productBody.user_id,
                status_type: 11,
              }) :
          '');
    } else {
      sellerPromise.push('');
    }
  }

  async retrieveProductMetadata(options, language) {
    const metaDataResult = await this.modals.metaData.findAll({
      where: JSON.parse(JSON.stringify(options)), include: [
        {
          model: this.modals.categoryForms,
          as: 'categoryForm', attributes: [],
        }], attributes: [
        'id', ['product_id', 'productId'],
        ['form_value', 'value'], ['category_form_id', 'categoryFormId'],
        [
          this.modals.sequelize.literal('"categoryForm"."form_type"'),
          'formType'], [
          this.modals.sequelize.literal(`${language ?
              `"categoryForm"."title_${language}"` :
              `"categoryForm"."title"`}`), 'default_name'],
        [this.modals.sequelize.literal('"categoryForm"."title"'), 'name'],
        [
          this.modals.sequelize.literal('"categoryForm"."display_index"'),
          'displayIndex']],
    });
    let metaData = metaDataResult.map((item) => item.toJSON());
    const categoryFormIds = metaData.filter(
        item => !!item && item.categoryFormId).
        map((item) => item.categoryFormId);
    const dropDowns = categoryFormIds.length > 0 ?
        await this.modals.dropDowns.findAll({
          where: JSON.parse(
              JSON.stringify({category_form_id: categoryFormIds})),
          attributes: ['id', 'title'],
        }) :
        [];
    return _.orderBy(metaData.map((item) => {
      const metaDataItem = item;
      if (metaDataItem.formType === 2 && metaDataItem.value) {
        const dropDown = dropDowns.find(
            (item) => item.id === parseInt(metaDataItem.value));
        metaDataItem.value = dropDown ? dropDown.title : metaDataItem.value;
      }
      return metaDataItem;
    }).filter((item) => item.value), ['displayIndex'], ['asc']);
  }

  async updateBrandReview(user, brand_id, request) {
    const {ratings: review_ratings, feedback: review_feedback, comments: review_comments} = request.payload;
    const user_id = user.id || user.ID;
    try {
      const result = await     this.modals.brandReviews.findCreateFind({
        where: {user_id, brand_id, status_id: 1},
        defaults: {
          user_id, brand_id, status_id: 1, review_ratings,
          review_feedback, review_comments,
        },
      });
      if (!result[1]) {
        await result[0].updateAttributes(
            {review_ratings, review_feedback, review_comments});
      }

      return {
        status: true, message: 'Review Updated Successfully',
        result: result[0].toJSON(), forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: true, message: 'Review Update Failed',
        err, forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async updateSellerReview(user, seller_id, isOnlineSeller, request) {
    const payload = request.payload;
    const {ratings: review_ratings, feedback: review_feedback, comments: review_comments} = request.payload;
    const user_id = user.id || user.ID;
    const status_id = 1;

    const whereClause = isOnlineSeller ?
        {user_id, seller_id, status_id} :
        {user_id, offline_seller_id: seller_id, status_id};

    const defaultClause = isOnlineSeller ? {
      user_id, seller_id, status_id, review_ratings,
      review_feedback, review_comments,
    } : {
      user_id, offline_seller_id: seller_id, status_id,
      review_ratings, review_feedback, review_comments,
    };
    try {
      const result = await     this.modals.sellerReviews.findCreateFind({
        where: whereClause,
        defaults: defaultClause,
      });
      if (!result[1]) {
        await result[0].updateAttributes(
            {review_ratings, review_feedback, review_comments});
      }

      return {
        status: true, message: 'Review Updated Successfully',
        result: result[0].toJSON(), forceUpdate: request.pre.forceUpdate,
      };

    } catch (err) {
      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));

      return {
        status: true, message: 'Review Update Failed',
        err, forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async updateProductReview(user, bill_product_id, request) {
    const payload = request.payload;
    const {ratings: review_ratings, feedback: review_feedback, comments: review_comments} = request.payload;
    const user_id = user.id || user.ID;
    const status_id = 1;
    const whereClause = {user_id, bill_product_id, status_id};
    try {
      const result = await     this.modals.productReviews.findCreateFind({
        where: whereClause,
        defaults: {
          user_id, bill_product_id, status_id, review_ratings,
          review_feedback, review_comments,
        },
      });
      if (!result[1]) {
        await result[0].updateAttributes(
            {review_ratings, review_feedback, review_comments});
      }

      return {
        status: true, message: 'Review Updated Successfully',
        result: result[0].toJSON(), forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: true, message: 'Review Update Failed',
        err, forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async retrieveNotificationProducts(options) {
    if (!options.status_type) {
      options.status_type = [5, 11];
    }
    const productResult = await this.modals.products.findAll({
      where: options,
      attributes: [
        'id', ['id', 'productId'], ['product_name', 'productName'],
        ['purchase_cost', 'value'], ['main_category_id', 'masterCategoryId'],
        'taxes', [
          this.modals.sequelize.fn('CONCAT', 'products/',
              this.modals.sequelize.literal('"products"."id"')),
          'productURL'], ['document_date', 'purchaseDate'],
        ['document_number', 'documentNo'], ['updated_at', 'updatedDate'],
        ['bill_id', 'billId'], ['job_id', 'jobId'], 'copies', 'user_id'],
    });
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
    const product_id = products.filter(item => !!item && item.id).
        map((item) => item.id);
    return await Promise.all(
        [
          product_id.length > 0 ?
              this.retrieveProductMetadata({product_id}) :
              [], products]);
  }

  async retrieveMissingDocProducts(options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }

    let products = await this.modals.products.findAll({
      where: options,
      attributes: [
        'id', ['product_name', 'productName'],
        ['purchase_cost', 'value'],
        ['main_category_id', 'masterCategoryId'], 'taxes',
        ['document_date', 'purchaseDate'],
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'],
        ['bill_id', 'billId'], ['job_id', 'jobId'],
        'copies', 'user_id',
      ],
    });
    products = products.map((item) => {
      const product = item.toJSON();
      product.hasDocs = product.copies.length > 0;
      return product;
    });
    const [insurances, warranties] = await Promise.all([
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
  }

  async retrieveProductExpenses(options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }
    const productResult = await   this.modals.products.findAll({
      where: options,
      attributes: [
        'id', ['product_name', 'productName'],
        ['purchase_cost', 'value'],
        ['main_category_id', 'masterCategoryId'],
        'taxes', ['document_date', 'purchaseDate'],
        ['document_number', 'documentNo'],
        ['updated_at', 'updatedDate'], ['bill_id', 'billId'],
        ['job_id', 'jobId'], 'copies', 'user_id',
      ],
    });
    return productResult.map((item) => item.toJSON());
  }

  async prepareProductDetail(parameters) {
    let {user, request} = parameters;
    const productId = request.params.id;
    try {
      const result = await     this.retrieveProductById(productId, {
        user_id: user.id || user.ID,
        status_type: [5, 8, 11],
      }, request.language);
      if (result) {
        return ({
          status: true,
          message: 'Successful',
          product: result,
          forceUpdate: request.pre.forceUpdate,
        });
      }

      return ({
        status: false,
        product: {},
        message: 'No Data Found',
        forceUpdate: request.pre.forceUpdate,
      });
    } catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: false,
        message: 'Unable to retrieve data',
        product: {},
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async createEmptyProduct(productDetail) {
    const productResult = await this.modals.products.create(productDetail);
    return productResult.toJSON();
  }

  async updateProduct(id, productDetail) {
    const productResult = await this.modals.products.findOne({where: {id}});
    const itemDetail = productResult.toJSON();
    const currentPurchaseDate = itemDetail.document_date;
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
    await   productResult.updateAttributes(productDetail);
    productDetail = productResult.toJSON();
    productDetail.isModalSame = isModalSame;
    if (productDetail.document_date &&
        moment.utc(currentPurchaseDate, moment.ISO_8601).valueOf() !==
        moment.utc(productDetail.document_date, moment.ISO_8601).valueOf()) {
      await Promise.all([
        this.warrantyAdaptor.updateWarrantyPeriod(
            {product_id: id, user_id: productDetail.user_id},
            currentPurchaseDate, productDetail.document_date),
        this.insuranceAdaptor.updateInsurancePeriod(
            {
              options: {product_id: id, user_id: productDetail.user_id},
              purchase_date: currentPurchaseDate,
              new_purchase_date: productDetail.document_date,
            }),
        this.pucAdaptor.updatePUCPeriod(
            {product_id: id, user_id: productDetail.user_id},
            currentPurchaseDate, productDetail.document_date),
        this.amcAdaptor.updateAMCPeriod(
            {product_id: id, user_id: productDetail.user_id},
            currentPurchaseDate, productDetail.document_date)]).
          catch((err) => console.log(
              `Error on update product ${new Date()} for user ${productDetail.user_id} is as follow: \n \n ${err}`));
    }
    return productDetail;
  }

  async updateProductMetaData(id, values) {
    const result = await   this.modals.metaData.findOne({where: {id}});
    await   result.updateAttributes(values);
    return result;
  }

  async deleteProduct(id, updated_by) {
    const result = await   this.modals.products.findById(id);
    if (result) {
      const jobPromise = result.job_id ? [
        this.modals.jobs.update({
          user_status: 3, admin_status: 3,
          ce_status: null, qe_status: null, updated_by,
        }, {where: {id: result.job_id}}),
        this.modals.jobCopies.update({status_type: 3, updated_by},
            {where: {job_id: result.job_id}})] : [undefined, undefined];
      await Promise.all([
        this.modals.mailBox.create({
          title: `User Deleted Product #${id}`, job_id: result.job_id,
          bill_product_id: result.product_id, notification_type: 100,
        }),
        this.modals.products.destroy({where: {id, user_id: updated_by}}),
        ...jobPromise]);
    }

    return true;
  }

  async removeProducts(id, copyId, values) {
    const result = await   this.modals.products.findOne({where: {id}});
    const itemDetail = result.toJSON();
    if (copyId && itemDetail.copies.length > 0) {
      values.copies = itemDetail.copies.filter(
          (item) => item.copyId !== parseInt(copyId));
      await     result.updateAttributes(values);

      return result.toJSON();
    }

    await   this.modals.products.destroy({where: {id}});

    return true;
  }

  async findCreateAccessoryPart(values) {
    let category, accessoryPartModel;
    accessoryPartModel = await this.modals.accessory_part.findOne({
      where: {
        title: {$iLike: `${values.accessory_part_name}`},
        category_id: values.category_id,
      },
    });
    if (!accessoryPartModel) {
      accessoryPartModel = await this.modals.accessory_part.create(values);
    }

    return accessoryPartModel.toJSON();
  }

  async retrieveAccessoryForProducts(options) {
    const {category_id} = options;
    return (await this.modals.table_accessory_categories.findAll(
        {
          where: {category_id}, include: [
            {
              model: this.modals.table_accessory_products,
              as: 'accessory_items',
              where: {
                include_email: true,
                title: {$and: {$ne: '', $not: null}}, details: {
                  isOutOfStock: false, image: {$and: {$ne: '', $not: null}},
                  name: {$and: {$ne: '', $not: null}},
                  price: {$and: {$ne: '', $not: null}},
                },
              },
              attributes: [
                'id', 'asin', 'accessory_id', 'accessory_type_id',
                'details', 'affiliate_type', 'bb_class'],
            }], attributes: ['category_id', 'priority', 'title', 'id'],
          order: [['category_id', 'asc'], ['priority', 'asc']],
        })).map(item => {
      item = item.toJSON();
      item.products = item.accessory_items;
      return item;
    });
  }

  async sendProductAccessoryMail(options) {
    const {email, id, name, product} = options;
    const products = [product];
    const productHtml = [];
    products.forEach(pItem => {
      const accessoryHtml = [];
      pItem.accessories.forEach((accessItem) => {
        accessItem.products.forEach((aItem) => {
          const rating = parseInt(aItem.details.rating);
          const ratingHtml = ['<div style="padding: 10px 50px">'];
          let i = 0;
          while (ratingHtml.length <= 5) {
            if (i < rating) {
              ratingHtml.push(
                  `<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/rating_color.png" alt="rating"/>`);
            } else {
              ratingHtml.push(
                  `<img src="https://s3.ap-south-1.amazonaws.com/binbill-static/rating.png" alt="rating"/>`);
            }

            i++;
          }
          ratingHtml.push(`<span style="padding: 10px;">${rating ||
          0} out of 5</span></div>`);
          if (accessoryHtml.length < 2) {
            accessoryHtml.push(`<td align="center" width="310" style=" width:300px; padding: 5px 0;border: 0 solid transparent;"
    valign="top">
    <div class="col num4" style="max-width: 320px;min-width: 310px;display: table-cell;vertical-align: top;">
        <div style="background-color: transparent; width: 100% !important;">
            <div style="border: 0 solid transparent;padding: 5px 0;">
                <div align="center" class="img-container center fixedwidth" style="padding-right: 0;  padding-left: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr style="line-height:0;">
                            <td style="padding-right: 0; padding-left: 0;" align="center"><img class="center fixedwidth" align="center" border="0" src="${aItem.details.image}"
                                     alt="Image" title="Image"
                                     style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 159.5px;min-width: 159.5px; max-height: 159.5px; min-height:159.5px;"
                                     width="159.5" height="159.5"></td>
                        </tr>
                    </table>
                </div>
                <div class="">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="padding: 10px 30px 5px;">
                                <div style="color:#888888;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:150%; padding: 10px 30px 5px;">
                                    <div style="font-size:12px;line-height:18px;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;color:#888888;text-align:left;">
                                        <p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center;text-overflow: ellipsis;white-space: nowrap;overflow: hidden; width:270px">
                                            <strong>${aItem.details.name}</strong>
                                        </p></div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="padding: 10px 30px 20px;">${ratingHtml.toString().
                replace(/,/g, '')}
                                <a href="${aItem.details.url}" style="text-decoration: none">
                                    <div style="color:#888888;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:150%; padding: 10px 50px 20px;">
                                        <div style="font-size:12px;line-height:18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#888888;text-align:left;border:2px solid #00a0ff;border-radius: 50px; padding-top: 10px; padding-bottom: 10px">
                                            <p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">
                                                <strong>₹ ${aItem.details.price}</strong></p></div>
                                    </div></a></td></tr></table></div>
                <div align="center" class="button-container center "
                     style="padding-right: 30px; padding-left: 30px; padding-top:10px; padding-bottom:5px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0; mso-table-rspace:0;">
                        <tr>
                            <td style="padding: 10px 30px 10px;" align="center">
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                                             href="https://www.binbill.com/deals/accessories/${pItem.category_id}?product_id=${product.id}&accessory_id=${accessItem.id}"
                                             style="height:34pt; v-text-anchor:middle; width:73pt;" arcsize="0%"
                                             strokecolor="#00A0FF" fillcolor="#FFFFFF">
                                    <w:anchorlock/>
                                    <v:textbox inset="0,0,0,0">
                                        <center style="color:#00A0FF; font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif; font-size:16px;">
                                            <a href="https://www.binbill.com/deals/accessories/${pItem.category_id}?product_id=${product.id}&accessory_id=${accessItem.id}" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #00A0FF; background-color: #FFFFFF; border-radius: 0; -webkit-border-radius: 0; -moz-border-radius: 0; max-width: 98px; border: 2px solid #00A0FF;padding: 5px 30px;font-family: 'Roboto', Tahoma, Verdana, Segoe, sans-serif;mso-border-alt: none">
              <span style="font-size:16px;line-height:32px;"><span
                      style="font-size: 14px; line-height: 28px;"
                      data-mce-style="font-size: 14px; line-height: 18px;">VIEW NOW</span></span>
                                            </a></center>
                                    </v:textbox>
                                </v:roundrect>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </div>
</td>`);
          }
        });
      });
      productHtml.push(`<div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid three-up ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"><table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">
                                        <td align="center" width="170" style="width:170px; padding: 5px 0;border: 0 solid transparent;" valign="top"><div class="col num4" style="max-width: 170px;min-width: 170px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;"><div style="border: 0 solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider "
                                           style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><tbody>
                                        <tr style="vertical-align: top">
                                            <td class="divider_inner"
                                                style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding: 15px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <table class="divider_content"  align="center" border="0"
                                                       cellpadding="0" cellspacing="0" width="100%"
                                                       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;border-top: 3px solid #00AFFF;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0;line-height: 0;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span>&#160;</span>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table></div></div>
                        </div></td><td align="center" width="175" style="max-width: 320px;min-width: 240px; padding: 5px 0;border: 0 solid transparent;"
                        valign="top">
                        <div class="col num4" style="width:260px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding: 5px 0;">
                                    <div class="">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 5px;">
                                        <div style="color:#555555;line-height:120%;font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif; padding: 0;">
                                            <div style="font-size:12px;width: 230px;line-height:14px;color:#555555;font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif;text-align:left; display: inline-block;">
                                                <p style="margin: 5px;font-size:14px;line-height:17px;text-align:center;display:inline-block;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;width: 220px;"><strong>${pItem.product_name ?
          pItem.product_name :
          `${pItem.brand.brand_name} ${pItem.model || ''}`}</strong></p>
                                                </div></div></td></tr></table></div></div></div></div></td>
                    <td align="center" width="170" style=" width:170px; padding: 5px 0;border: 0 solid transparent;"
                        valign="top"><div class="col num4" style="max-width: 170px;min-width: 170px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding: 5px 0;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider "
                                           style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><tbody><tr style="vertical-align: top">
                                            <td class="divider_inner" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 15px;padding-left: 15px;padding-top: 15px;padding-bottom: 15px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <table class="divider_content" align="center" border="0"
                                                       cellpadding="0" cellspacing="0" width="100%"
                                                       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;border-top: 3px solid #00AFFF;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <tbody><tr style="vertical-align: top"><td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0;line-height: 0;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span>&#160;</span></td></tr></tbody></table></td></tr></tbody></table></div></div></div></td></tr></table></td></tr></table></div></div></div>
            <div style="background-color:#FFFFFF;"><div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid two-up "><div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#FFFFFF;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">${accessoryHtml.toString()}</tr></table></td></tr></table></div></div></div>`);
    });

    if (productHtml.length > 0) {
      await re({
        url: `https://admin.binbill.com/api/mailfromcrons`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        json: {
          html: `<!DOCTYPE html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title></title>
    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css">
</head>
<body class="clean-body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #F3F3F3">
<div class="ie-browser">
<div class="mso-container">
<table class="nl-container"
       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #F3F3F3;width: 100%"
       cellpadding="0" cellspacing="0">
    <tbody>
    <tr style="vertical-align: top">
        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" style="background-color: #F3F3F3;">
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">
                        <td align="center" width="620"
                            style=" width:620px; padding-right: 0; padding-left: 0; padding-top:5px; padding-bottom:5px; border: 0 solid transparent;"
                            valign="top"><div class="col num12"
                             style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;">
                                    <div align="center" class="img-container center fixedwidth "
                                         style="padding-right: 0;  padding-left: 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr style="line-height:0;line-height:0;">
                                                <td style="padding-right: 0; padding-left: 0;" align="center">
                                        <img class="center fixedwidth" align="center" border="0"
                                             src="https://s3.ap-south-1.amazonaws.com/binbill-static/BinBill_+Color+Logo+2X-04.png" alt="Image"
                                             title="Image"
                                             style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;max-width: 217px"
                                             width="217">
                                             </td></tr></table></div></div></div>                        </div>
                       </td></tr></table></td></tr></table></div>
                </div>
            </div>
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="620"
                            style=" width:620px; padding: 5px 0;border: 0 solid transparent;"
                            valign="top"><div class="col num12"
                             style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;"><div style="border: 0 solid transparent;padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;"><table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider "
                                           style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><tbody>
                                        <tr style="vertical-align: top">    <td class="divider_inner"
                                                style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-bottom: 10px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <table class="divider_content" height="0px" align="center" border="0"
                                                       cellpadding="0" cellspacing="0" width="100%"
                                                       style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;border-top: 3px solid #00AAF8;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                    <tbody><tr style="vertical-align: top"><td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0;line-height: 0;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%"><span>&#160;</span></td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table></div>
                            </div>
                        </div></td></tr></table></td></tr></table>
                    </div>
                </div>
            </div>
            <div style="background-color:#FFFFFF;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#FFFFFF;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="620"
                            style=" width:620px; padding: 0;border: 0 solid transparent;border-top-width: 0;"
                            valign="top"><div class="col num12" style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;"><div style="border: 0 solid transparent;padding-top:0; padding-bottom:0; padding-right: 0; padding-left: 0;"><div class="">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">
<div style="color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">
                                            <div style="font-size:12px;line-height:14px;color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;text-align:left;">
                                                <p style="margin: 0;font-size: 14px;line-height: 17px"><span
                                                        style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);"><strong>
                                                        Hello${name ?
              ` ${name}` : ''},
                                                        </strong></span><br><br>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">Congratulations on successfully adding your product!</span><br><br>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">Did you know that we have exciting and best of Accessories for your <b>${product.product_name}</b>?</span><br><br>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">Check out suitably chosen Accessories for your product in our Deals section.</span>
                                                        <span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">All your Product Needs in one place.</span>
                                                </p></div>
                                        </div></td></tr></table>
                                    </div></div></div>
                        </div></td></tr></table></td></tr></table>
                    </div>
                </div>
            </div>
            ${productHtml.toString()}
            <div style="background-color:#FFFFFF;">
      <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#FFFFFF;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 620px;"><tr class="layout-full-width" style="background-color:transparent;"><td align="center" width="620" style=" width:620px; padding-right: 0; padding-left: 0; padding-top:5px; padding-bottom:5px; border: 0 solid transparent;" valign="top">
            <div class="col num12" style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
              <div style="background-color: transparent; width: 100% !important;">
              <div style="border: 0 solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0; padding-left: 0;"><div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0; mso-table-rspace:0;"><tr>
  <td style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;" align="center">
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.binbill.com/deals" style="height:31pt; v-text-anchor:middle; width:76pt;" arcsize="10%" strokecolor="#3AAEE0" fillcolor="#3AAEE0">
  <w:anchorlock/>
  <v:textbox inset="0,0,0,0">
  <a href="https://www.binbill.com/deals/accessories/${product.category_id}?product_id=${product.id}" style="text-decoration: none;">
  <center style="color:#ffffff; font-family:'Roboto', Tahoma, Verdana, Segoe, sans-serif; font-size:16px;">
    <div style="color: #ffffff; background-color: #3AAEE0; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 102px; width: auto; border: 0 solid transparent;padding: 5px 20px;font-family: 'Roboto', Tahoma, Verdana, Segoe, sans-serif; text-align: center; mso-border-alt: none;">
      <span style="font-size:16px;line-height:32px;">View All</span>
    </div>
  </center></a></v:textbox></v:roundrect></td></tr></table>
</div><div class=""><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">
	<div style="color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">	
		<div style="font-size:12px;line-height:14px;color:#555555;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px"><span style="font-size: 16px; line-height: 19px; color: rgb(0, 0, 0);">For any queries, write to us at <strong>support@binbill.com</strong> or call us at <strong>+91-124-4343177</strong>. </span><br><br><br><span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 16px;"><strong><span style="font-size: 16px; line-height: 19px;">Cheers,</span></strong></span><br><span style="color: rgb(0, 0, 0); font-size: 14px; line-height: 16px;"><strong><span style="font-size: 16px; line-height: 19px;">BinBill Team</span></strong></span><br><br></p></div>	
	</div></td></tr></table>
</div></div>              </div></div></td></tr></table></td></tr></table></div></div></div>
            <div style="background-color:#8C8C8C;">
                <div style="Margin: 0 auto;min-width: 320px;max-width: 620px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;"
                     class="block-grid ">
                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#8C8C8C;" align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 620px;">
                                        <tr class="layout-full-width" style="background-color:transparent;">
                        <td align="center" width="620"
                            style=" width:620px; padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px; border: 0 solid transparent;"
                            valign="top"><div class="col num12"
                             style="min-width: 320px;max-width: 620px;display: table-cell;vertical-align: top;">
                            <div style="background-color: transparent; width: 100% !important;">
                                <div style="border: 0 solid transparent;padding-top:10px; padding-bottom:10px; padding-right: 10px; padding-left: 10px;">                                    <div align="center"
                                         style="padding-right: 10px; padding-left: 10px; padding-bottom: 10px;"
                                         class="">
                                        <div style="line-height:10px;font-size:1px">&#160;</div>
                                        <div style="display: table; max-width:171px;">
                                            <table width="151" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="border-collapse:collapse; padding-right: 10px; padding-left: 10px; padding-bottom: 10px;"
                                                        align="center">
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                                               style="border-collapse:collapse; mso-table-lspace: 0;mso-table-rspace: 0; width:151px;">
                                                            <tr><td width="32" style="width:32px; padding-right: 15px;"
                                                                    valign="top"><table align="left" border="0" cellspacing="0" cellpadding="0" width="32"
                                                   height="32"
                                                   style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;Margin-right: 15px">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle"
                                                        style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="https://www.facebook.com/binbill.ehome/"
                                                           title="Facebook" target="_blank">
                                                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/facebook.png" alt="Facebook"
                                                                 title="Facebook" width="32"
                                                                 style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        <div style="line-height:5px;font-size:1px">&#160;</div>
                                                        </td></tr></tbody></table></td><td width="32" style="width:32px; padding-right: 15px;" valign="top">
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32"
                                                   height="32"
                                                   style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;Margin-right: 15px">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle"
                                                        style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="http://twitter.com//binbill_ehome" title="Twitter"
                                                           target="_blank">
                                                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/twitter.png" alt="Twitter" title="Twitter"
                                                                 width="32"
                                                                 style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        <div style="line-height:5px;font-size:1px">&#160;</div>
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table></td><td width="32" style="width:32px; padding-right: 0;" valign="top">
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32"
                                                   height="32"
                                                   style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0;mso-table-rspace: 0;vertical-align: top;Margin-right: 0">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle"
                                                        style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="https://www.linkedin.com/company/binbill.com/"
                                                           title="LinkedIn" target="_blank">
                                                            <img src="https://s3.ap-south-1.amazonaws.com/binbill-static/linkedin%402x.png" alt="LinkedIn"
                                                                 title="LinkedIn" width="32"
                                                                 style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        <div style="line-height:5px;font-size:1px">&#160;</div>
                                                    </td>
                                                </tr>
                                                </tbody></table></td></tr></table></td></tr></table></div></div></div></div></div></td></tr></table></td></tr></table></div></div></div></td></tr></table></td></tr></tbody></table></div></body></html>`,
          email,
          subject: 'Exciting Accessories to complement your product!',
        },
      }).catch(err => {
        throw err;
      });
    }
  }

  async bitlyGenerator(long_url) {
    const result = await re({
      url: `https://api-ssl.bitly.com/v4/shorten`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer a0d77b7de14e7ba297f3382ed73f34c763899af1',
      },
      json: {
        long_url,
        group_guid: 'Bi5edpzw47U',
      },
    });

    console.log(JSON.stringify(result));
    return result.link;
  }
}