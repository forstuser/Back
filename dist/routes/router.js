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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var middleware = void 0;

exports.default = function (app, modals) {
  middleware = new _middleware2.default(modals);
  // Initializing route groups
  var authRoutes = [];
  var categoryRoutes = [];
  var brandRoutes = [];
  var sellerRoutes = [];
  var serviceCenterRoutes = [];
  var billManagementRoutes = [];
  var dashboardRoutes = [];
  var productRoutes = [];
  var insightRoutes = [];
  var searchRoutes = [];
  var generalRoutes = [];
  var repairRoutes = [];
  var calendarRoutes = [];
  var uploadFileRoute = [];
  var whatToServiceRoutes = [];
  var searchController = new _search2.default(modals);
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

  if (searchController) {
    searchRoutes.push({
      method: 'GET',
      path: '/search',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _search2.default.retrieveSearch,
        description: 'Get Search Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });
  }

  app.route([].concat(authRoutes, categoryRoutes, brandRoutes, sellerRoutes, serviceCenterRoutes, billManagementRoutes, uploadFileRoute, dashboardRoutes, productRoutes, insightRoutes, searchRoutes, generalRoutes, repairRoutes, calendarRoutes, whatToServiceRoutes));
};