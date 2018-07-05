import ControllerObject from '../api/controllers/serviceCenter';
import joi from 'joi';

export function prepareServiceCenterRoutes(modal, routeObject, middleware) {
  const initController = new ControllerObject(modal);
  if (initController) {
    routeObject.push({
      method: 'POST',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveServiceCenters,
        validate: {
          payload: {
            location: [joi.string(), joi.allow(null)],
            city: [joi.string(), joi.allow(null)],
            searchValue: [joi.string(), joi.allow(null)],
            longitude: [joi.string(), joi.allow(null)],
            latitude: [joi.string(), joi.allow(null)],
            categoryId: [joi.number(), joi.allow(null)],
            masterCategoryId: [joi.number(), joi.allow(null)],
            brandId: [joi.number(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveServiceCenters,
      },
    });
    routeObject.push({
      method: 'GET',
      path: '/consumer/servicecenters/filters',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveServiceCenterFilters,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/{mode}/centers',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveServiceCenters,
      },
    });
    routeObject.push({
      method: 'GET',
      path: '/consumer/web/centers/filters',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveServiceCenterFilters,
      },
    });
  }
}