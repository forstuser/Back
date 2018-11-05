/*jshint esversion: 6 */
'use strict';

import SearchController from '../api/controllers/search';
import Middleware from '../helpers/middleware';
import {prepareServiceCenterRoutes} from './service_center';
import {prepareCategoryRoutes} from './category';
import {prepareUploadRoutes} from './upload';
import {prepareDashboardRoutes} from './dashboard';
import {prepareProductRoutes} from './product';
import {prepareInsightRoutes} from './insight';
import {prepareWhatToServiceRoutes} from './what_to_service';
import {prepareCalendarServiceRoutes} from './calendar_service';
import {prepareProductItemRoutes} from './product_item';
import {prepareGeneralRoutes} from './general';
import {prepareAuthRoutes} from './users';
import {prepareBrandRoutes} from './brand';
import {prepareAccessoryRoute} from './accessory_routes';
import {prepareOfferRoutes} from './offer';
import {prepareShopEarnRoute} from './shop_earn';
import {prepareSellerRoutes} from './sellers';
import {prepareOrderRoutes} from './order';

let middleware;

export default (app, modals, socket_server) => {
  middleware = Middleware(modals);
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
  const offerRoutes = [];
  const shopEarnRoutes = [];
  const orderRoutes = [];
  const searchController = new SearchController(modals);
  prepareAuthRoutes(modals, authRoutes, middleware, socket_server);

  prepareCategoryRoutes(modals, categoryRoutes, middleware, socket_server);

  prepareBrandRoutes(modals, brandRoutes, middleware, socket_server);

  prepareServiceCenterRoutes(modals, serviceCenterRoutes, middleware,
      socket_server);

  prepareUploadRoutes(modals, uploadFileRoute, middleware, socket_server);

  prepareDashboardRoutes(modals, dashboardRoutes, middleware, socket_server);

  prepareProductRoutes(modals, productRoutes, middleware, socket_server);

  prepareInsightRoutes(modals, insightRoutes, middleware, socket_server);

  prepareGeneralRoutes(modals, generalRoutes, middleware, socket_server);

  prepareProductItemRoutes(modals, repairRoutes, middleware, socket_server);

  prepareCalendarServiceRoutes(modals, calendarRoutes, middleware,
      socket_server);

  prepareWhatToServiceRoutes(modals, whatToServiceRoutes, middleware,
      socket_server);

  prepareAccessoryRoute(modals, accessoryServicesRoutes, middleware,
      socket_server);

  prepareOfferRoutes(modals, offerRoutes, middleware, socket_server);

  prepareShopEarnRoute(modals, shopEarnRoutes, middleware, socket_server);

  prepareSellerRoutes(modals, sellerRoutes, middleware, socket_server);

  prepareOrderRoutes(modals, orderRoutes, middleware, socket_server);

  if (searchController) {
    searchRoutes.push({
      method: 'GET',
      path: '/search',
      handler: SearchController.retrieveSearch,
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        description: 'Get Search Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Successful'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });
  }

  ([
    ...authRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...sellerRoutes,
    ...serviceCenterRoutes,
    ...billManagementRoutes,
    ...uploadFileRoute,
    ...dashboardRoutes,
    ...productRoutes,
    ...insightRoutes,
    ...searchRoutes,
    ...generalRoutes,
    ...repairRoutes,
    ...calendarRoutes,
    ...whatToServiceRoutes,
    ...accessoryServicesRoutes,
    ...offerRoutes,
    ...shopEarnRoutes, ...orderRoutes,
  ]).forEach((routeItem) => app.route(routeItem));
  const handler = (request, h, err) => {
    console.log(err);
    return h.response('The page was not found').code(404);
  };

  app.route({method: '*', path: '/{p*}', handler});
};
