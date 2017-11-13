/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';

class ServiceCenterAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveServiceCenters(options) {
    options.status_type = 1;
    const categoryId = options.category_id;
    options = _.omit(options, 'category_id');
    return this.modals.serviceCenters.findAll({
      where: options,
      include: [
        {
          model: this.modals.brands,
          as: 'brands',
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
              'detailType'],
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
          this.modals.sequelize.fn('CONCAT', 'categories/', categoryId,
              '/image/'),
          'cImageURL'],
        [
          'center_address',
          'address']],
      order: [['center_name', 'ASC']],
    }).then((results) => results.map((item) => item.toJSON()));
  }
}

export default ServiceCenterAdaptor;
