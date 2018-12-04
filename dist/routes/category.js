'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareCategoryRoutes = prepareCategoryRoutes;

var _category = require('../api/controllers/category');

var _category2 = _interopRequireDefault(_category);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareCategoryRoutes(modal, routesObject, middleware) {
  const initController = new _category2.default(modal);
  if (initController) {
    routesObject.push({
      method: 'GET',
      path: '/categories',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _category2.default.getCategories
      }
    });
    routesObject.push({
      method: 'GET',
      path: '/{mode}/categories',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _category2.default.getCategories
      }
    });
  }
}