'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareInsightRoutes = prepareInsightRoutes;

var _insight = require('../api/controllers/insight');

var _insight2 = _interopRequireDefault(_insight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 * @param modal
 * @param routeObject
 * @param middleware
 */
function prepareInsightRoutes(modal, routeObject, middleware) {
  //= ========================
  // Product Routes
  //= ========================
  const controllerInit = new _insight2.default(modal);
  if (controllerInit) {
    routeObject.push({
      method: 'GET',
      path: '/insight',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _insight2.default.retrieveCategoryWiseInsight,
        description: 'Get Insight Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/insights',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _insight2.default.retrieveInsightForSelectedCategory,
        description: 'Get Insight Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });
  }
}