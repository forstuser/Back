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

var _maps = require('@google/maps');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var googleMapsClient = (0, _maps.createClient)({
  Promise: Promise,
  key: 'AIzaSyCT60FOMjGxPjOQjyk9ewP5l9VkmMcTWmE',
});

var NearByAdaptor = function() {
  function NearByAdaptor(modals) {
    _classCallCheck(this, NearByAdaptor);

    this.modals = modals;
  }

  _createClass(NearByAdaptor, [
    {
      key: 'retrieveNearBy',
      value: function retrieveNearBy(
          location, geoLocation, professionIds, reply, userId, request) {
        var origins = [];
        var destinations = [];
        if (geoLocation) {
          origins.push(geoLocation);
        } else if (location) {
          origins.push(location + ',India');
        }
        this.filterNearByProfessional(
            professionIds.split('[')[1].split(']')[0].split(',').
                filter(Boolean), userId).then(function(result) {
          var finalResult = [];
          var userWithOrigins = [];
          if (result.length > 0) {
            var users = result.map(function(item) {
              var user = item.toJSON();
              user.address = user.location + ', India';
              user.geoLocation = user.latitude && user.longitude ?
                  user.latitude + ',' + user.longitude :
                  '';
              user.phoneNo = user.isPhoneAllowed ? user.phoneNo : '';
              user.email = user.isEmailAllowed ? user.email : '';

              if (user.geoLocation) {
                destinations.push(user.geoLocation);
              } else if (user.address) {
                destinations.push(user.address);
              }

              if (origins.length > 0 && destinations.length > 0) {
                if (origins.length < destinations.length) {
                  origins.push(origins[0]);
                }
                userWithOrigins.push(user);
              } else {
                user.distanceMetrics = 'km';
                user.distance = 500.001;

                finalResult.push(user);
              }
              return user;
            });

            if (origins.length > 0 && destinations.length > 0) {
              googleMapsClient.distanceMatrix({
                origins: origins,
                destinations: destinations,
              }).asPromise().then(function(matrix) {
                for (var i = 0; i < userWithOrigins.length; i += 1) {
                  var tempMatrix = matrix.status === 200 && matrix.json ?
                      matrix.json.rows[0].elements[i] :
                      {};
                  if (tempMatrix && tempMatrix.status.toLowerCase() === 'ok') {
                    userWithOrigins[i].distanceMetrics = tempMatrix.distance ?
                        tempMatrix.distance.text.split(' ')[1] :
                        'km';
                    userWithOrigins[i].distance = parseFloat(
                        tempMatrix.distance ?
                            tempMatrix.distance.text.split(' ')[0] :
                            500.001);
                    userWithOrigins[i].distance = userWithOrigins[i].distanceMetrics !==
                    'km' ?
                        userWithOrigins[i].distance / 1000 :
                        userWithOrigins[i].distance;
                  } else {
                    userWithOrigins[i].distanceMetrics = 'km';
                    userWithOrigins[i].distance = parseFloat(500.001);
                  }
                  finalResult.push(userWithOrigins[i]);
                  if (finalResult.length === result.length) {
                    finalResult.sort(function(a, b) {
                      return a.distance - b.distance;
                    });
                    reply({
                      status: true,
                      sortedUsers: finalResult,
                      forceUpdate: request.pre.forceUpdate,
                    }).code(200);
                  }
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
            }

            if (origins.length <= 0) {
              reply({
                status: true,
                users: users,
                forceUpdate: request.pre.forceUpdate,
              });
            }
          } else {
            reply({
              status: false,
              message: 'No Data Found for mentioned search',
              forceUpdate: request.pre.forceUpdate,
            });
          }
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          reply({
            status: false,
            message: 'Unable to get near by professional',
            err: err,
            forceUpdate: request.pre.forceUpdate,
          });
        });
      },
    }, {
      key: 'filterNearByProfessional',
      value: function filterNearByProfessional(professionIds, userId) {
        var whereClause = {
          is_enrolled_professional: 1,
          status_id: {
            $ne: 3,
          },
          ID: {
            $ne: userId,
          },
        };

        if (professionIds.length > 0) {
          whereClause.professional_category_id = professionIds;
        }

        return this.modals.table_users.findAll({
          where: whereClause,
          attributes: [
            [
              'fullname',
              'name'],
            [
              'mobile_no',
              'phoneNo'],
            [
              'email_id',
              'email'],
            'location',
            'longitude',
            'latitude',
            [
              'is_enrolled_professional',
              'isEnrolled'],
            [
              'professional_category_id',
              'categoryId'],
            [
              'share_mobile',
              'isPhoneAllowed'],
            [
              'share_email',
              'isEmailAllowed'],
            [
              'email_verified',
              'isEmailVerified'],
            [
              'professional_description',
              'description']],
          include: [
            {
              model: this.modals.userImages,
              as: 'userImages',
              attributes: [
                [
                  this.modals.sequelize.fn('CONCAT', 'consumer/',
                      this.modals.sequelize.col('user_image_id'), '/images'),
                  'imageUrl']],
            }],
        });
      },
    }]);

  return NearByAdaptor;
}();

exports.default = NearByAdaptor;