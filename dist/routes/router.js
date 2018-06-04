/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _search = require('../api/controllers/search');

var _search2 = _interopRequireDefault(_search);

var _middleware = require('../helpers/middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _service_center = require('./service_center');

var _category = require('./category');

var _upload = require('./upload');

var _dashboard = require('./dashboard');

var _product = require('./product');

var _insight = require('./insight');

var _what_to_service = require('./what_to_service');

var _calendar_service = require('./calendar_service');

var _product_item = require('./product_item');

var _general = require('./general');

var _auth = require('./auth');

var _brand = require('./brand');

var _accessory_routes = require('./accessory_routes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let middleware;

exports.default = (app, modals) => {
  middleware = (0, _middleware2.default)(modals);
  // Initializing route groups
  const authRoutes = [];
  const categoryRoutes = [];
  const brandRoutes = [];
  const sellerRoutes = [];
  const serviceCenterRoutes = [];
  const billManagementRoutes = [];
  const dashboardRoutes = [];
  const productRoutes = [];
  const insightRoutes = [];
  const searchRoutes = [];
  const generalRoutes = [];
  const repairRoutes = [];
  const calendarRoutes = [];
  const uploadFileRoute = [];
  const whatToServiceRoutes = [];
  const accessoryServicesRoutes = [];
  const searchController = new _search2.default(modals);
  (0, _auth.prepareAuthRoutes)(modals, authRoutes, middleware);

  (0, _category.prepareCategoryRoutes)(modals, categoryRoutes, middleware);

  (0, _brand.prepareBrandRoutes)(modals, brandRoutes, middleware);

  (0, _service_center.prepareServiceCenterRoutes)(modals, serviceCenterRoutes, middleware);

  (0, _upload.prepareUploadRoutes)(modals, uploadFileRoute, middleware);

  (0, _dashboard.prepareDashboardRoutes)(modals, dashboardRoutes, middleware);

  (0, _product.prepareProductRoutes)(modals, productRoutes, middleware);

  (0, _insight.prepareInsightRoutes)(modals, insightRoutes, middleware);

  (0, _general.prepareGeneralRoutes)(modals, generalRoutes, middleware);

  (0, _product_item.prepareProductItemRoutes)(modals, repairRoutes, middleware);

  (0, _calendar_service.prepareCalendarServiceRoutes)(modals, calendarRoutes, middleware);

  (0, _what_to_service.prepareWhatToServiceRoutes)(modals, whatToServiceRoutes, middleware);

  (0, _accessory_routes.prepareAccessoryRoute)(modals, accessoryServicesRoutes, middleware);

  if (searchController) {
    searchRoutes.push({
      method: 'GET',
      path: '/search',
      handler: _search2.default.retrieveSearch,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        description: 'Get Search Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });
  }

  [...authRoutes, ...categoryRoutes, ...brandRoutes, ...sellerRoutes, ...serviceCenterRoutes, ...billManagementRoutes, ...uploadFileRoute, ...dashboardRoutes, ...productRoutes, ...insightRoutes, ...searchRoutes, ...generalRoutes, ...repairRoutes, ...calendarRoutes, ...whatToServiceRoutes, ...accessoryServicesRoutes].forEach(routeItem => app.route(routeItem));
  const handler = function (request, h, err) {
    console.log(err);
    return h.response('The page was not found').code(404);
  };

  app.route({ method: '*', path: '/{p*}', handler });
};