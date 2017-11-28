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
          required: true,
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
      ],
    }).then((productResult) => {
      products = productResult.map((item) => item.toJSON());
      return Promise.all([
        this.retrieveProductMetadata({
          product_id: {
            $in: products.map((item) => item.id),
          },
        }), this.insuranceAdaptor.retrieveInsurances({
          product_id: {
            $in: products.map((item) => item.id),
          },
        }), this.warrantyAdaptor.retrieveWarranties({
          product_id: {
            $in: products.map((item) => item.id),
          },
        }), this.amcAdaptor.retrieveAMCs({
          product_id: {
            $in: products.map((item) => item.id),
          },
        }), this.repairAdaptor.retrieveRepairs({
          product_id: {
            $in: products.map((item) => item.id),
          },
        })]);
    }).then((results) => {
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
            productItem.warrantyDetails.length + productItem.amcDetails.length +
            productItem.repairBills.length;

        return productItem;
      });

      return options.status_type && options.status_type === 8 ?
          products.filter((item) => item.requiredCount > 0) :
          products;
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
          required: true,
        },
      ],
      attributes: ['id'],
    }).then((productResult) => productResult.map((item) => item.toJSON()));
  }

  retrieveProductCounts(options) {
    if (!options.status_type) {
      options.status_type = {
        $notIn: [3, 9],
      };
    }

    let productResult;
    options = _.omit(options, 'product_status_type');
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
      const inProgressProductOption = {};
      _.assignIn(inProgressProductOption, options);
      inProgressProductOption.status_type = 5;
      return Promise.all([
        this.amcAdaptor.retrieveAMCCounts(inProgressProductOption),
        this.insuranceAdaptor.retrieveInsuranceCount(inProgressProductOption),
        this.warrantyAdaptor.retrieveWarrantyCount(inProgressProductOption),
        this.repairAdaptor.retrieveRepairCount(inProgressProductOption)]);
    }).then((results) => {
      if (options.status_type === 5) {
        return productResult;
      }
      const availableResult = [
        ...results[0],
        ...results[1],
        ...results[2],
        ...results[3]];

      return productResult.filter((item) => availableResult.includes(
          (availResult) => availResult.masterCategoryId ===
              item.masterCategoryId));

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
          required: true,
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
    let product;
    const dropDownPromise = metadataBody.map((item) => {
      if (item.new_drop_down) {
        return this.modals.dropDowns.findCreateFind({
          where: {
            title: {
              $iLike: item.form_value.toLowerCase(),
            },
            category_form_id: item.category_form_id,
          },
          defaults: {
            title: item.form_value,
            category_form_id: item.category_form_id,
            updated_by: item.updated_by,
            status_type: 11,
          },
        });
      }

      return '';
    });

    return Promise.all(dropDownPromise).then((dropDownResult) => {
      const dropDownRes = dropDownResult.filter((item) => item !== '').
          map((ddItem) => ddItem[0].toJSON());
      let product = productBody;
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
        const ddResult = dropDownRes.find(
            (ddItem) => ddItem.category_form_id === mdItem.category_form_id);
        mdItem.form_value = mdItem.new_drop_down ?
            ddResult.id.toString() :
            mdItem.form_value;
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
        },
        {
          model: this.modals.dropDowns,
          as: 'dropDown',
          where: {
            $and: [
              this.modals.sequelize.where(
                  this.modals.sequelize.literal('"categoryForm"."form_type"'),
                  2),],
          },
          attributes: ['id', 'title'],
          required: false,
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
    }).then((metaData) => {
      const unOrderedMetaData = metaData.map((item) => {
        const metaDataItem = item.toJSON();
        if (metaData.formType === 2 && metaDataItem.value) {
          const dropDown = metaDataItem.dropDown.find(
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
      user_id: user.id,
      seller_id: sellerId,
      status_id: 1,
    } : {
      user_id: user.id,
      offline_seller_id: sellerId,
      status_id: 1,
    };

    const defaultClause = isOnlineSeller ? {
      user_id: user.id,
      seller_id: sellerId,
      status_id: 1,
      review_ratings: payload.ratings,
      review_feedback: payload.feedback,
      review_comments: payload.comments,
    } : {
      user_id: user.id,
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

  prepareProductDetail(user, request) {
    const productId = request.params.id;
    return this.retrieveProductById(productId, {
      where: {
        user_id: user.id,
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
