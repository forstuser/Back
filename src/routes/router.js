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
import {prepareAuthRoutes} from './auth';
import {prepareBrandRoutes} from './brand';
import {prepareAccessoryRoute} from './accessory_routes';
import AccessoryServicesController from '../api/controllers/accessory';

let middleware;

export default (app, modals) => {
  middleware = new Middleware(modals);
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
  const searchController = new SearchController(modals);
  const accessoryServicesController = new AccessoryServicesController(modals);
  prepareAuthRoutes(modals, authRoutes, middleware);

  prepareCategoryRoutes(modals, categoryRoutes, middleware);

  prepareBrandRoutes(modals, brandRoutes, middleware);

  prepareServiceCenterRoutes(modals, serviceCenterRoutes, middleware);

  prepareUploadRoutes(modals, uploadFileRoute, middleware);

  prepareDashboardRoutes(modals, dashboardRoutes, middleware);

  prepareProductRoutes(modals, productRoutes, middleware);

  prepareInsightRoutes(modals, insightRoutes, middleware);

  prepareGeneralRoutes(modals, generalRoutes, middleware);

  prepareProductItemRoutes(modals, repairRoutes, middleware);

  prepareCalendarServiceRoutes(modals, calendarRoutes, middleware);

  prepareWhatToServiceRoutes(modals, whatToServiceRoutes, middleware);

  prepareAccessoryRoute(accessoryServicesController,
      AccessoryServicesController, accessoryServicesRoutes, middleware);

  if (searchController) {
    searchRoutes.push({
      method: 'GET',
      path: '/search',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: SearchController.retrieveSearch,
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

  app.route([
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
  ]);
};
