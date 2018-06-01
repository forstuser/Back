'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareBrandRoutes = prepareBrandRoutes;

var _brand = require('../api/controllers/brand');

var _brand2 = _interopRequireDefault(_brand);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareBrandRoutes(modal, routeObject, middleware) {
  const controllerInit = new _brand2.default(modal);
  if (controllerInit) {
    // Get brands
    routeObject.push({
      method: 'GET',
      path: '/brands',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _brand2.default.getBrands
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/{mode}/brands',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _brand2.default.getBrands
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/brandcenter',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _brand2.default.getBrandASC
      }
    });
  }
}