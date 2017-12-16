/*jshint esversion: 6 */
'use strict';

import BrandAdaptor from './brands';
import InsuranceAdaptor from './insurances';
import WarrantyAdaptor from './warranties';
import AMCAdaptor from './amcs';
import RepairAdaptor from './repairs';
import _ from 'lodash';

class ProductAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.brandAdaptor = new BrandAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
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
              'invoiceNo']],
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
          'id'],
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
      inProgressProductOption = _.omit(inProgressProductOption, 'product_name');
      inProgressProductOption.status_type = 5;
      inProgressProductOption.product_status_type = options.status_type;
      if (products.length > 0) {
        inProgressProductOption.product_id = products.map((item) => item.id);
        return Promise.all([
          this.retrieveProductMetadata({
            product_id: {
              $in: products.map((item) => item.id),
            },
          }),
          this.insuranceAdaptor.retrieveInsurances(inProgressProductOption),
          this.warrantyAdaptor.retrieveWarranties(inProgressProductOption),
          this.amcAdaptor.retrieveAMCs(inProgressProductOption),
          this.repairAdaptor.retrieveRepairs(inProgressProductOption)]);
      }
      return undefined;
    }).then((results) => {
      if (results) {
        const metaData = results[0];
        products = products.map((productItem) => {
          productItem.productMetaData = metaData.filter(
              (item) => item.productId === productItem.id);
          productItem.insuranceDetails = results[1].filter(
              (item) => item.productId === productItem.id);
          productItem.warrantyDetails = results[2].filter(
              (item) => item.productId === productItem.id);
          productItem.amcDetails = results[3].filter(
              (item) => item.productId === productItem.id);
          productItem.repairBills = results[4].filter(
              (item) => item.productId === productItem.id);

          productItem.requiredCount = productItem.insuranceDetails.length +
              productItem.warrantyDetails.length +
              productItem.amcDetails.length +
              productItem.repairBills.length;

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
          'id'],
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
      console.log(products);
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
          }),
          this.amcAdaptor.retrieveAMCs({
            product_id: product.id,
          }),
          this.repairAdaptor.retrieveRepairs({
            product_id: product.id,
          })]);
      }
      return undefined;
    }).then((results) => {
      if (results) {
        const metaData = results[0];
        product.metaData = metaData;
        product.insuranceDetails = results[1];
        product.warrantyDetails = results[2];
        product.amcDetails = results[3];
        product.repairBills = results[4];

        product.requiredCount = product.insuranceDetails.length +
            product.warrantyDetails.length +
            product.amcDetails.length +
            product.repairBills.length;
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
    options.status_type = {
      $notIn: [3, 9],
    };

    let products;
    return this.modals.products.findById(id, {
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
          'main_category_id',
          'masterCategoryId'],
        [
          'brand_id',
          'id'],
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
          }), this.brandAdaptor.retrieveBrandById(products.id, {
            category_id: products.categoryId,
          }), this.insuranceAdaptor.retrieveInsurances({
            product_id: products.id,
          }), this.warrantyAdaptor.retrieveWarranties({
            product_id: products.id,
          }), this.amcAdaptor.retrieveAMCs({
            product_id: products.id,
          }), this.repairAdaptor.retrieveRepairs({
            product_id: products.id,
          })]);
      }
    }).then((results) => {
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

  createProduct(productBody, metadataBody) {
    const brandPromise = productBody.brand_name ?
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
      metadataBody,
    });
    const dropDownPromise = metadataBody.map((item) => {
      if (item.new_drop_down) {
        console.log({
          testMetadata: {
            title: {
              $iLike: item.form_value.toLowerCase(),
            },
            category_form_id: item.category_form_id,
            category_id: productBody.category_id,
            brand_id: productBody.brand_id,
          },
        });
        return this.modals.brandDropDown.findCreateFind({
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
          },
        });
      }

      return '';
    });

    return Promise.all([...dropDownPromise, brandPromise]).
        then((newItemResult) => {
          let product = productBody;
          const newBrand = productBody.brand_name ?
              newItemResult[newItemResult.length - 1][0] : undefined;
          product.brand_id = newBrand ?
              newBrand.brand_id :
              product.brand_id;
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
          let metadata = metadataBody.map((mdItem) => {
            mdItem = _.omit(mdItem, 'new_drop_down');
            return mdItem;
          });
          return this.modals.products.count({
            where: product,
            include: [
              {
                model: this.modals.metaData, where: {
                  $and: metadata,
                }, required: true, as: 'metaData',
              },
            ],
          }).then((count) => {
            if (count === 0) {
              return this.modals.products.create(product);
            }

            return undefined;
          }).then((productResult) => {
            if (productResult) {
              product = productResult.toJSON();
              const metadataPromise = metadata.map((mdItem) => {
                mdItem.product_id = product.id;
                mdItem.status_type = 8;

                return this.modals.metaData.create(mdItem);
              });

              return Promise.all(metadataPromise);
            }

            return undefined;
          }).then((metaData) => {
            if (metaData) {
              product.metaData = metaData.map((mdItem) => mdItem.toJSON());
              return product;
            }

            return undefined;
          });
        });
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
      console.log({API_Logs: err});
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
      console.log({API_Logs: err});
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
      console.log({API_Logs: err});
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

    const billOption = {
      status_type: 5,
    };

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
      return productResult.map((item) => item.toJSON());
    });
  }

  prepareProductDetail(user, request) {
    const productId = request.params.id;
    return this.retrieveProductById(productId, {
      where: {
        user_id: user.id || user.ID,
        status_type: [5, 8, 11],
      },
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
      console.log({API_Logs: err});
      return {
        status: false,
        message: 'Unable to retrieve data',
        product: {},
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }
}

export default ProductAdaptor;
