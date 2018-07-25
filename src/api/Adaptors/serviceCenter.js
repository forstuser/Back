/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';

class ServiceCenterAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveServiceCenters(options) {
    options.status_type = 1;
    const categoryId = options.category_id;
    const brand_id = options.brand_id;
    options = _.omit(options, 'category_id');
    options = _.omit(options, 'brand_id');
    const results = await this.modals.serviceCenters.findAll({
      where: options,
      include: [
        {
          model: this.modals.brands,
          as: 'brands',
          where: {
            brand_id,
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
          required: true,
        },
        {
          model: this.modals.centerDetails,
          where: {
            category_id: categoryId,
          },
          include: [
            {
              model: this.modals.detailTypes,
              attributes: [],
            },
          ],
          attributes: [
            [
              this.modals.sequelize.literal(
                  '"centerDetails->detailType"."type"'),
              'type'],
            [
              this.modals.sequelize.literal(
                  '"centerDetails->detailType"."title"'),
              'name'],
            [
              'value',
              'details'],
            ['category_id', 'categoryId']],
          required: true,
          as: 'centerDetails',
        }],
      attributes: [
        [
          'center_name',
          'centerName'],
        [
          'center_city',
          'city'],
        [
          'center_state',
          'state'],
        [
          'center_country',
          'country'],
        [
          'center_pin',
          'pinCode'],
        [
          'center_latitude',
          'latitude'],
        [
          'center_longitude',
          'longitude'],
        [
          'center_timings',
          'timings'],
        [
          'center_days',
          'openingDays'],
        [
          this.modals.sequelize.fn('CONCAT', '/categories/', categoryId,
              '/images/1'),
          'cImageURL'],
        [
          'center_address',
          'address']],
      order: [['center_name', 'ASC']],
    });
    return results.map((item) => item.toJSON());
  }
}

export default ServiceCenterAdaptor;
