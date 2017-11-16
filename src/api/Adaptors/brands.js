/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';

class BrandAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveBrands(options) {
    options.status_type = 1;
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

  retrieveBrandById(id, options) {
    options.status_type = 1;
    const detailOptions = options;
    options = _.omit(options, 'category_id');
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
          [
            this.modals.sequelize.fn('CONCAT', 'brands/',
                this.modals.sequelize.col('"brands"."brand_id"'), '/reviews'),
            'reviewUrl']],
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
}

export default BrandAdaptor;
