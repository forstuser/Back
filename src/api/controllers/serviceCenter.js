/*jshint esversion: 6 */
'use strict';

import google from '../../helpers/google';
import shared from '../../helpers/shared';
import ServiceCenterAdaptor from '../Adaptors/serviceCenter';

let modals;
let serviceCenterAdaptor;

class ServiceCenterController {
  constructor(modal) {
    modals = modal;
    serviceCenterAdaptor = new ServiceCenterAdaptor(modal);
  }

  static retrieveServiceCenters(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user && !request.pre.forceUpdate) {
      const payload = request.payload || {
        location: '',
        city: '',
        searchValue: '',
        longitude: '',
        latitude: '',
        categoryId: '',
        masterCategoryId: '',
        brandId: '',
      };

      const latitude = payload.latitude || user.latitude || '';
      const longitude = payload.longitude || user.longitude || '';
      const location = payload.location || user.location || '';
      const city = payload.city || '';
      const latlong = latitude && longitude ? `${latitude}, ${longitude}` : '';
      const categoryId = request.query.categoryid || payload.categoryId || 0;
      const brandId = request.query.brandid || payload.brandId || 0;
      const whereClause = {
        center_city: {
          $iLike: `%${city}%`,
        },
        brand_id: brandId,
        category_id: categoryId,
        $and: [
          modals.sequelize.where(
              modals.sequelize.col('"centerDetails"."category_id"'),
              categoryId),
          modals.sequelize.where(modals.sequelize.col('"brands"."brand_id"'),
              brandId),
        ],
      };

      const origins = [];
      const destinations = [];
      if (latlong) {
        origins.push(latlong);
      } else if (location) {
        origins.push(location);
      } else if (city) {
        origins.push(city);
      }

      Promise.all([
        serviceCenterAdaptor.retrieveServiceCenters(whereClause),
        modals.brands.findAll({
          where: {
            status_type: 1,
          },
          include: [
            {
              model: modals.brandDetails,
              as: 'details',
              where: {
                status_type: 1,
                category_id: categoryId,
              },
              attributes: [],
            }],
          attributes: [['brand_id', 'id'], ['brand_name', 'name']],
        })]).then((result) => {
        const serviceCentersWithLocation = [];
        const finalResult = [];
        if (result[0].length > 0) {
          const serviceCenters = result[0].map((item) => {
            const center = item;
            center.mobileDetails = center.centerDetails.filter(
                detail => detail.detailType === 3);
            center.centerAddress = `${center.centerName}, ${center.city}-${center.pinCode}, ${center.state}, India`;
            center.address = `${center.address}, ${center.city}-${center.pinCode}, ${center.state}, India`;
            center.geoLocation = center.latitude && center.longitude &&
            center.latitude.toString() !== '0' &&
            center.longitude.toString() !== '0' ?
                `${center.latitude}, ${center.longitude}` :
                '';
            if (center.geoLocation) {
              destinations.push(center.geoLocation);
            } else if (center.address) {
              destinations.push(center.address);
            } else if (center.centerAddress) {
              destinations.push(center.centerAddress);
            } else if (center.city) {
              destinations.push(center.city);
            }

            if (origins.length > 0 && destinations.length > 0) {
              serviceCentersWithLocation.push(center);
            } else {
              center.distanceMetrics = 'km';
              center.distance = parseFloat(500.001);
              finalResult.push(center);
            }

            return center;
          });
          if (origins.length > 0 && destinations.length > 0) {
            return google.distanceMatrix(origins, destinations).
                then((result) => {
                  for (let i = 0; i <
                  serviceCentersWithLocation.length; i += 1) {
                    if (result.length > 0) {
                      const tempMatrix = result[i];
                      serviceCentersWithLocation[i].distanceMetrics = 'km';
                      serviceCentersWithLocation[i].distance = (tempMatrix.distance) ?
                          (tempMatrix.distance.value / 1000).toFixed(2) :
                          null;
                    } else {
                      serviceCentersWithLocation[i].distanceMetrics = 'km';
                      serviceCentersWithLocation[i].distance = parseFloat(
                          500.001);
                    }

                    finalResult.push(serviceCentersWithLocation[i]);
                  }

                  const finalFilteredList = serviceCentersWithLocation.filter(
                      (elem) => {
                        return (elem.distance !== null &&
                            parseFloat(elem.distance) <= 40);
                      });

                  finalFilteredList.sort((a, b) => {
                    return a.distance - b.distance;
                  });

                  reply({
                    status: true,
                    serviceCenters: finalFilteredList,
                    filterData: {
                      brands: result[1],
                    },
                    forceUpdate: request.pre.forceUpdate,
                  }).code(200);
                  // }
                }).
                catch((err) => {
                  console.log(
                      `Error on ${new Date()} for user ${user.id ||
                      user.ID} is as follow: \n \n ${err}`);

                  reply({
                    status: false,
                    err,
                    forceUpdate: request.pre.forceUpdate,
                  });
                });
          }
          if (origins.length <= 0) {
            reply({
              status: true,
              filterData: {
                brands: result[1],
              },
              serviceCenters,
              forceUpdate: request.pre.forceUpdate,
            });
          }
        } else {
          reply({
            status: false,
            message: 'No Data Found for mentioned search',
            serviceCenters: [],
            forceUpdate: request.pre.forceUpdate,
          });
        }
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        reply({
          status: false,
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      });
    } else if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveServiceCenterFilters(request, reply) {
    if (!request.pre.forceUpdate) {
      Promise.all([
        modals.categories.findAll({
          where: {
            id: [2, 3],
            category_level: 1,
            status_id: {
              $ne: 3,
            },
          },
          include: [
            {
              model: modals.categories,
              on: {
                $or: [
                  modals.sequelize.where(
                      modals.sequelize.col('`subCategories`.`ref_id`'),
                      modals.sequelize.col('`categories`.`category_id`')),
                ],
              },
              as: 'subCategories',
              where: {
                status_id: {
                  $ne: 3,
                },
              },
              attributes: [['category_id', 'id'], ['category_name', 'name']],
              required: false,
            }],
          attributes: [
            [
              'category_id',
              'id'],
            [
              'display_id',
              'cType'],
            [
              'category_name',
              'name']],
          order: [
            'category_name',
            modals.sequelize.literal('subCategories.category_name')],
        }),
        modals.authorizedServiceCenter.aggregate('address_city', 'DISTINCT',
            {plain: false, order: [['address_city']]}),
        modals.table_brands.findAll({
          where: {
            status_id: {
              $ne: 3,
            },
          },
          include: [
            {
              model: modals.authorizedServiceCenter,
              as: 'center',
              attributes: [],
            }],
          attributes: [['brand_name', 'name'], ['brand_id', 'id']],
        }),
      ]).then((result) => {
        reply({
          status: true,
          categories: result[0],
          cities: result[1].map(item => item.DISTINCT),
          brands: result[2],
          forceUpdate: request.pre.forceUpdate,
        });
      });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default ServiceCenterController;
