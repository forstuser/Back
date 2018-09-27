/*jshint esversion: 6 */
'use strict';

import google from '../../helpers/google';
import shared from '../../helpers/shared';
import ServiceCenterAdaptor from '../Adaptors/serviceCenter';
import BrandAdaptor from '../Adaptors/brands';

let modals;
let serviceCenterAdaptor;
let brandAdaptor;

class ServiceCenterController {
  constructor(modal) {
    modals = modal;
    serviceCenterAdaptor = new ServiceCenterAdaptor(modal);
    brandAdaptor = new BrandAdaptor(modals);
  }

  static async retrieveServiceCenters(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      const isWebMode = (request.params && request.params.mode &&
          request.params.mode.toLowerCase() === 'web');
      if ((request.pre.userExist || isWebMode) && !request.pre.forceUpdate) {
        console.log(request.payload);
        const payload = request.payload || {
          location: '', city: '',
          searchValue: '', longitude: '',
          latitude: '', categoryId: '',
          masterCategoryId: '', brandId: '',
        };
        let latitude = '';
        let longitude = '';
        let location = '';
        let city = request.query.city;

        if (!isWebMode) {
          latitude = payload.latitude || user.latitude || '';
          longitude = payload.longitude || user.longitude || '';
          location = payload.location || user.location || '';
          city = payload.city || '';
        }

        const latlong = latitude && longitude ?
            `${latitude}, ${longitude}` :
            '';
        const categoryId = request.query.categoryid || payload.categoryId || 0;
        const brandId = request.query.brandid || payload.brandId || 0;
        const whereClause = {
          center_city: {$iLike: `%${city}%`},
          brand_id: brandId, category_id: categoryId, $and: [
            modals.sequelize.where(
                modals.sequelize.col('"centerDetails"."category_id"'),
                categoryId),
            modals.sequelize.where(modals.sequelize.col('"brands"."brand_id"'),
                brandId)],
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

        const brandDetailOption = {
          status_type: 1,
          category_id: categoryId,
        };

        let [serviceCenters, filterBrands, selectedBrand] = await Promise.all([
          serviceCenterAdaptor.retrieveServiceCenters(whereClause),
          brandAdaptor.retrieveCategoryBrands(brandDetailOption),
          brandAdaptor.retrieveBrandById(brandId, brandDetailOption)]);
        const serviceCentersWithLocation = [];
        const finalResult = [];
        if (serviceCenters.length > 0) {
          serviceCenters = serviceCenters.map((item) => {
            const center = item;
            center.mobileDetails = center.centerDetails.filter(
                detail => detail.detailType === 3);
            center.centerAddress = `${center.centerName}, ${center.pinCode ?
                `${center.city}-${center.pinCode}` :
                `${center.city}`}, ${center.state}, India`;
            center.address = `${center.address}, ${center.pinCode ?
                `${center.city}-${center.pinCode}` :
                `${center.city}`}, ${center.state}, India`;
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
            const result = await google.distanceMatrix(origins, destinations);
            for (let i = 0; i < serviceCentersWithLocation.length; i += 1) {
              if (result.length > 0) {
                const tempMatrix = result[i];
                serviceCentersWithLocation[i].distanceMetrics = 'km';
                serviceCentersWithLocation[i].distance = (tempMatrix.distance) ?
                    (tempMatrix.distance.value / 1000).toFixed(2) :
                    null;
              } else {
                serviceCentersWithLocation[i].distanceMetrics = 'km';
                serviceCentersWithLocation[i].distance = parseFloat(500.001);
              }

              finalResult.push(serviceCentersWithLocation[i]);
            }

            const finalFilteredList = serviceCentersWithLocation.filter(
                (elem) => (elem.distance !== null &&
                    parseFloat(elem.distance) <= 40));

            finalFilteredList.sort((a, b) => a.distance - b.distance);

            return reply.response({
              status: true,
              serviceCenters: finalFilteredList,
              brand: selectedBrand,
              filterData: {
                brands: filterBrands,
              },
              forceUpdate: request.pre.forceUpdate,
            }).code(200);
          }
          if (origins.length <= 0) {
            return reply.response({
              status: true,
              filterData: {
                brands: filterBrands,
              },
              serviceCenters,
              brand: selectedBrand,
              forceUpdate: request.pre.forceUpdate,
            });
          }
        } else {
          return reply.response({
            status: true,
            message: 'No Data Found for mentioned search',
            filterData: {
              brands: filterBrands,
            },
            serviceCenters: [],
            brand: selectedBrand,
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to fetch service centers.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveServiceCenterFilters(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const [categories, cities, brands] = await Promise.all([
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
        ]);
        return reply.response({
          status: true,
          categories,
          cities: cities.map(item => item.DISTINCT),
          brands,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to fetch service center filters.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }
}

export default ServiceCenterController;
