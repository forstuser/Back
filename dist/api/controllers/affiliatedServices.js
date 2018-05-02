/*jshint esversion: 6 */
'use strict';

// create adapter for this controller

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _affiliatedServices = require('../Adaptors/affiliatedServices');

var _affiliatedServices2 = _interopRequireDefault(_affiliatedServices);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modals = void 0;
var affiliatedServicesAdaptor = void 0;

var affiliatedServicesController = function () {
  function affiliatedServicesController(modal) {
    _classCallCheck(this, affiliatedServicesController);

    modals = modal;
    affiliatedServicesAdaptor = new _affiliatedServices2.default(modals);
  }

  _createClass(affiliatedServicesController, null, [{
    key: 'getCities',
    value: function getCities(request, reply) {

      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        // this is where make us of adapter
        return affiliatedServicesAdaptor.getCities({
          where: {}
        }).then(function (cities) {
          return reply({
            status: true,
            cities: cities
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to retrieve all cities data'
          });
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    }
  }, {
    key: 'getAllCategory',
    value: function getAllCategory(request, reply) {

      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        // this is where make us of adapter
        return affiliatedServicesAdaptor.getAllCategory({
          city_id: request.params.id
        }).then(function (categories) {
          return reply({
            status: true,
            categories: categories
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to retrieve all cities data'
          });
        });
      } else {
        return _shared2.default.preValidation(request.pre, reply);
      }
    }
  }]);

  return affiliatedServicesController;
}();

exports.default = affiliatedServicesController;