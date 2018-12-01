/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';
import ServiceCenterAdaptor from './serviceCenter';

class BrandAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.serviceCenterAdaptor = new ServiceCenterAdaptor(modals);
  }

  async retrieveBrands(options) {
    options.status_type = [1, 11];
    const brandResult = await this.modals.brands.findAll({
      where: options,
      attributes: [
        ['brand_id', 'id'],
        ['brand_name', 'name'],
        ['brand_description', 'description']],
      order: [['brand_index', 'desc'], ['brand_name']],
    });
    return brandResult.map((item) => item.toJSON());
  }

  async retrieveASCBrands(options) {
    let brand;
    const brandResults = await this.modals.brands.findAll({
      where: {
        status_type: 1,
        brand_name: {
          $iLike: `${options.brand_name.toLowerCase()}%`,
        },
      },
      attributes: [
        [
          'brand_id',
          'id'],
        [
          'brand_name',
          'name'],
        [
          'brand_description',
          'description']],
      order: [['brand_index', 'desc'], ['brand_name']],
    });
    let result;
    if (brandResults.length > 0) {
      brand = brandResults.map(item => item.toJSON())[0];

      result = await Promise.all([
        this.retrieveBrandDetails({
          status_type: 1,
          category_id: 327,
          brand_id: brand.id,
        }), this.serviceCenterAdaptor.retrieveServiceCenters({
          status_type: 1,
          category_id: 327,
          brand_id: brand.id,
        })]);
    }
    if (result) {
      brand.details = result[0];
      brand.serviceCenters = result[1];
      return brand;
    }

    return undefined;
  }

  async retrieveBrandById(id, options) {
    options.status_type = 1;
    const detailOptions = options;
    options = _.omit(options, 'category_id');
    detailOptions.brand_id = id;
    const results = await Promise.all([
      this.modals.brands.findById(id, {
        where: options, attributes: [
          ['brand_id', 'id'], ['brand_name', 'name'],
          ['brand_description', 'description'], 'status_type', [
            this.modals.sequelize.fn('CONCAT', 'brands/',
                this.modals.sequelize.col('"brands"."brand_id"'), '/reviews'),
            'reviewUrl'], [
            this.modals.sequelize.fn('CONCAT', 'brands/',
                this.modals.sequelize.col('"brands"."brand_id"'), '/images'),
            'imageUrl']], include: [
          {
            model: this.modals.brandReviews, as: 'brandReviews', attributes: [
              ['review_ratings', 'ratings'], ['review_feedback', 'feedback'],
              ['review_comments', 'comments']], required: false,
          }],
      }), this.retrieveBrandDetails(detailOptions)]);
    const brand = results[0] ? results[0].toJSON() : results[0];
    if (brand) {
      brand.details = results[1];
    }

    return brand;
  }

  async retrieveBrandDetails(options) {
    const detailResult = await this.modals.brandDetails.findAll({
      where: options,
      include: [
        {
          model: this.modals.detailTypes,
          attributes: [],
        },
      ],
      attributes: [
        [
          this.modals.sequelize.literal('"detailType"."type"'),
          'typeId'],
        [
          this.modals.sequelize.literal('"detailType"."title"'),
          'displayName'],
        [
          'value',
          'details'],
        ['category_id', 'categoryId'],
        ['brand_id', 'brandId']],
    });
    return detailResult.map((item) => item.toJSON());

  }

  async retrieveCategoryBrands(options) {
    const result = await this.modals.brands.findAll({
      where: {
        status_type: [1, 11],
      }, include: [
        {
          model: this.modals.brandDetails,
          where: {
            category_id: options.category_id,
          },
          attributes: [],
          as: 'details',
          required: true,
        },
      ],
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
          this.modals.sequelize.literal('"details"."category_id"'),
          'categoryId',
        ],
        'status_type',
        'created_by',
        'updated_by',
      ],
      order: [['brand_index', 'desc'], ['brand_name']],
    });
    return result.map((item) => item.toJSON());
  }

  async retrieveBrandDropDowns(options) {
    const result = await this.modals.brandDropDown.findAll(
        {where: options, order: [['title', 'asc']]});
    return result.map((item) => item.toJSON());
  }

  async findCreateBrand(values) {
    let brandData, brandDetail, category;
    const {category_id} = values;
    const categoryModel = await this.modals.categories.findOne(
        {where: {category_id}});
    console.log(JSON.stringify({categoryModel, category_id}));
    category = categoryModel.toJSON();
    const brandModel = await this.modals.brands.findOne({
      where: {
        brand_name: {
          $or: [
            {$iLike: `${values.brand_name}`},
            {$iLike: `${values.brand_name}(${category.category_name})`},
          ],
        },
      },
      include: [
        {
          model: this.modals.brandDetails, as: 'details',
          where: {category_id: values.category_id},
          attributes: [], required: true,
        }],
    });
    let result;
    if (brandModel) {
      brandData = brandModel.toJSON();
      result = await this.modals.brandDetails.findOne({
        where: {
          brand_id: brandData.brand_id,
          category_id: values.category_id,
        },
      });
    }
    let updatedResult;
    if (!result) {
      updatedResult = await this.modals.brands.create({
        status_type: 11,
        brand_name: `${values.brand_name}(${category.category_name})`,
        updated_by: values.updated_by,
        created_by: values.created_by,
      });
    } else {
      brandDetail = result.toJSON();
    }

    if (!brandDetail) {
      brandData = updatedResult.toJSON();
    }

    if (brandData.status_type === 11) {
      return await this.modals.brandDetails.create({
        brand_id: brandData.brand_id,
        detail_type: 1,
        updated_by: values.updated_by,
        created_by: values.created_by,
        status_type: 11,
        category_id: values.category_id,
      });
    }

    return brandData;
  }

  async retrieveBrandOffers(query_options) {
    const result = await this.modals.brand_offers.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveBrandOffer(query_options) {
    const result = await this.modals.brand_offers.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async updateBrandOffer(query_options, options) {
    return await this.modals.brand_offers.update(options, query_options);
  }

  async retrieveOrUnlinkBrandOffers(options) {
    let seller_offer = await this.modals.seller_offers.findOne(
        {where: options});
    if (seller_offer && ((options.id && seller_offer.id.toString() ===
        options.id.toString()) ||
        ((options.sku_id && seller_offer.sku_id.toString() ===
            options.sku_id.toString()) && (options.sku_measurement_id &&
            seller_offer.sku_measurement_id.toString() ===
            options.sku_measurement_id.toString())))) {
      const seller_offer_result = seller_offer.toJSON();
      await seller_offer.updateAttributes(
          {brand_offer_id: null, status_type: 2});
    }
    return seller_offer.toJSON();
  }

  async createBrandOfferRequestForSeller(options) {
    let seller_offer = await this.modals.seller_offer_request.findOne(
        {where: options});
    if (!seller_offer) {
      seller_offer = await this.modals.seller_offer_request.create(options);
    }
    return seller_offer.toJSON();
  }
}

export default BrandAdaptor;
