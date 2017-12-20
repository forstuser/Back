/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _google = require('../../helpers/google');

var _google2 = _interopRequireDefault(_google);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _serviceCenter = require('../Adaptors/serviceCenter');

var _serviceCenter2 = _interopRequireDefault(_serviceCenter);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var modals = void 0;
var serviceCenterAdaptor = void 0;

var ServiceCenterController = function() {
  function ServiceCenterController(modal) {
    _classCallCheck(this, ServiceCenterController);

    modals = modal;
    serviceCenterAdaptor = new _serviceCenter2.default(modal);
  }

  _createClass(ServiceCenterController, null, [
    {
      key: 'retrieveServiceCenters',
      value: function retrieveServiceCenters(request, reply) {
        var user = _shared2.default.verifyAuthorization(request.headers);
        if (user && !request.pre.forceUpdate) {
          var payload = request.payload || {
            location: '',
            city: '',
            searchValue: '',
            longitude: '',
            latitude: '',
            categoryId: '',
            masterCategoryId: '',
            brandId: '',
          };

          var latitude = payload.latitude || user.latitude || '';
          var longitude = payload.longitude || user.longitude || '';
          var location = payload.location || user.location || '';
          var city = payload.city || '';
          var latlong = latitude && longitude ?
              latitude + ', ' + longitude :
              '';
          var categoryId = request.query.categoryid || payload.categoryId || 0;
          var brandId = request.query.brandid || payload.brandId || 0;
          var whereClause = {
            center_city: {
              $iLike: '%' + city + '%',
            },
            brand_id: brandId,
            category_id: categoryId,
            $and: [
              modals.sequelize.where(
                  modals.sequelize.col('"centerDetails"."category_id"'),
                  categoryId),
              modals.sequelize.where(
                  modals.sequelize.col('"brands"."brand_id"'), brandId)],
          };

          var origins = [];
          var destinations = [];
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
            })]).then(function(result) {
            var serviceCentersWithLocation = [];
            var finalResult = [];
            if (result[0].length > 0) {
              var serviceCenters = result[0].map(function(item) {
                var center = item;
                center.mobileDetails = center.centerDetails.filter(
                    function(detail) {
                      return detail.detailType === 3;
                    });
                center.centerAddress = center.centerName + ', ' + center.city +
                    '-' + center.pinCode + ', ' + center.state + ', India';
                center.address = center.address + ', ' + center.city + '-' +
                    center.pinCode + ', ' + center.state + ', India';
                center.geoLocation = center.latitude && center.longitude &&
                center.latitude.toString() !== '0' &&
                center.longitude.toString() !== '0' ?
                    center.latitude + ', ' + center.longitude :
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
                return _google2.default.distanceMatrix(origins, destinations).
                    then(function(result) {
                      for (var i = 0; i <
                      serviceCentersWithLocation.length; i += 1) {
                        if (result.length > 0) {
                          var tempMatrix = result[i];
                          serviceCentersWithLocation[i].distanceMetrics = 'km';
                          serviceCentersWithLocation[i].distance = tempMatrix.distance ?
                              (tempMatrix.distance.value / 1000).toFixed(2) :
                              null;
                        } else {
                          serviceCentersWithLocation[i].distanceMetrics = 'km';
                          serviceCentersWithLocation[i].distance = parseFloat(
                              500.001);
                        }

                        finalResult.push(serviceCentersWithLocation[i]);
                      }

                      var finalFilteredList = serviceCentersWithLocation.filter(
                          function(elem) {
                            return elem.distance !== null &&
                                parseFloat(elem.distance) <= 40;
                          });

                      finalFilteredList.sort(function(a, b) {
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
                    catch(function(err) {
                      console.log('Error on ' + new Date() + ' for user ' +
                          (user.id || user.ID) + ' is as follow: \n \n ' + err);

                      reply({
                        status: false,
                        err: err,
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
                  serviceCenters: serviceCenters,
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
          }).catch(function(err) {
            console.log('Error on ' + new Date() + ' for user ' +
                (user.id || user.ID) + ' is as follow: \n \n ' + err);
            reply({
              status: false,
              err: err,
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
      },
    }, {
      key: 'retrieveServiceCenterFilters',
      value: function retrieveServiceCenterFilters(request, reply) {
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
                          modals.sequelize.col('`categories`.`category_id`'))],
                  },
                  as: 'subCategories',
                  where: {
                    status_id: {
                      $ne: 3,
                    },
                  },
                  attributes: [
                    [
                      'category_id',
                      'id'],
                    [
                      'category_name',
                      'name']],
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
            })]).then(function(result) {
            reply({
              status: true,
              categories: result[0],
              cities: result[1].map(function(item) {
                return item.DISTINCT;
              }),
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
      },
    }]);

  return ServiceCenterController;
}();

exports.default = ServiceCenterController;