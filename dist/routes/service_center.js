'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareServiceCenterRoutes = prepareServiceCenterRoutes;

var _serviceCenter = require('../api/controllers/serviceCenter');

var _serviceCenter2 = _interopRequireDefault(_serviceCenter);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareServiceCenterRoutes(modal, routeObject, middleware) {
  var initController = new _serviceCenter2.default(modal);
  if (initController) {
    routeObject.push({
      method: 'POST',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _serviceCenter2.default.retrieveServiceCenters,
        validate: {
          payload: {
            location: [_joi2.default.string(), _joi2.default.allow(null)],
            city: [_joi2.default.string(), _joi2.default.allow(null)],
            searchValue: [_joi2.default.string(), _joi2.default.allow(null)],
            longitude: [_joi2.default.string(), _joi2.default.allow(null)],
            latitude: [_joi2.default.string(), _joi2.default.allow(null)],
            categoryId: [_joi2.default.number(), _joi2.default.allow(null)],
            masterCategoryId: [_joi2.default.number(), _joi2.default.allow(null)],
            brandId: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _serviceCenter2.default.retrieveServiceCenters
      }
    });
    routeObject.push({
      method: 'GET',
      path: '/consumer/servicecenters/filters',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _serviceCenter2.default.retrieveServiceCenterFilters
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/{mode}/centers',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _serviceCenter2.default.retrieveServiceCenters
      }
    });
    routeObject.push({
      method: 'GET',
      path: '/consumer/web/centers/filters',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _serviceCenter2.default.retrieveServiceCenterFilters
      }
    });
  }
}