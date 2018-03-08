/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';
import ServiceCenterAdaptor from './serviceCenter';

class BrandAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.serviceCenterAdaptor = new ServiceCenterAdaptor(modals);
  }

  retrieveBrands(options) {
    options.status_type = [1, 11];
    return this.modals.brands.findAll({
      where: options,
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
    }).then((brandResult) => brandResult.map((item) => item.toJSON()));
  }

  retrieveASCBrands(options) {
    let brand;
    return this.modals.brands.findAll({
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
    }).then((brandResults) => {
      if (brandResults.length > 0) {
        brand = brandResults.map(item => item.toJSON())[0];

        return Promise.all([
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

      return undefined;
    }).then((result) => {
      if (result) {
        brand.details = result[0];
        brand.serviceCenters = result[1];

        return brand;
      }

      return undefined;
    });
  }

  retrieveBrandById(id, options) {
    options.status_type = 1;
    const detailOptions = options;
    options = _.omit(options, 'category_id');
    detailOptions.brand_id = id;
    return Promise.all([
      this.modals.brands.findById(id, {
        where: options,
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
            'status_type',
          [
            this.modals.sequelize.fn('CONCAT', 'brands/',
                this.modals.sequelize.col('"brands"."brand_id"'), '/reviews'),
            'reviewUrl'],
          [
            this.modals.sequelize.fn('CONCAT', 'brands/',
                this.modals.sequelize.col('"brands"."brand_id"'), '/images'),
            'imageUrl']],
        include: [
          {
            model: this.modals.brandReviews,
            as: 'brandReviews',
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
      }), this.retrieveBrandDetails(detailOptions)]).then((results) => {
      const brand = results[0] ? results[0].toJSON() : results[0];
      if (brand) {
        brand.details = results[1];
      }

      return brand;
    });
  }

  retrieveBrandDetails(options) {
    return this.modals.brandDetails.findAll({
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
    }).then((detailResult) => detailResult.map((item) => item.toJSON()));

  }

  retrieveCategoryBrands(options) {
    return this.modals.brands.findAll({
      where: {
        status_type: 1,
      }, include: [
        {
          model: this.modals.brandDetails,
          where: {
            status_type: 1,
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
      ],
    }).then((result) => result.map((item) => item.toJSON()));
  }

  retrieveBrandDropDowns(options) {
    return this.modals.brandDropDown.findAll({
      where: options,
    }).then((result) => result.map((item) => item.toJSON()));
  }

  findCreateBrand(values) {
    let brandData;
    let brandDetail;
    let category;
    return Promise.all([
      this.modals.brands.findAll({
        where: {
          brand_name: {
            $iLike: `${values.brand_name}%`,
          },
        },
      }), this.modals.categories.findOne({
        where: {
          category_id: values.category_id,
        },
      })]).then((result) => {
      brandData = result[0].map((item) => item.toJSON());
      category = result[1].toJSON();
      return this.modals.brandDetails.findOne({
        where: {
          brand_id: brandData.map((item) => {
            return item.brand_id;
          }),
          category_id: values.category_id,
        },
      });
    }).then((result) => {
      if (!result) {
        return this.modals.brands.create({
          status_type: 11,
          brand_name: `${values.brand_name}(${category.category_name})`,
          updated_by: values.updated_by,
          created_by: values.created_by,
        });
      }

      brandDetail = result.toJSON();
      return brandData;
    }).then((updatedResult) => {
      if (brandDetail) {
        brandData = updatedResult.find(
            (item) => brandDetail.brand_id === item.brand_id);
      } else {
        brandData = updatedResult.toJSON();
      }

      if (brandData.status_type === 11) {
        return this.modals.brandDetails.create({
          brand_id: brandData.brand_id,
          detail_type: 1,
          updated_by: values.updated_by,
          created_by: values.created_by,
          status_type: 11,
          category_id: values.category_id,
        });
      }

      return undefined;
    }).then(() => brandData);
  }
}

export default BrandAdaptor;
