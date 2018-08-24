import ControllerObject from '../api/controllers/dashboard';
import joi from 'joi';

export function prepareDashboardRoutes(modal, routeObject, middleware) {
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {

    /*Retrieve dashboard of consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/dashboard',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getDashboard,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/upcomings',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUpcomingService,
      },
    });

    /*Retrieve E-Home of consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/ehome',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getEHome,
      },
    });

    /*Retrieve Product list for categories*/
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/products',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getProductsInCategory,
      },
    });

    routeObject.push({
      method: 'GET', path: '/consumer/ehome/products/{type}', config: {
        auth: 'jwt', pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus, assign: 'userExist',
          },
        ], handler: ControllerObject.getEHomeProducts,
      },
    });

    /*Retrieve mails of consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/mailbox',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getMailbox,
      },
    });

    /*Mark mail of consumer read*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/mailbox/read',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateNotificationStatus,
        validate: {
          payload: {
            notificationIds: joi.array().items(joi.number()).required().min(0),
            output: 'data',
            parse: true,
          },
        },
      },
    });

    /*Send notification to consumer*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/notify',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.notifyUser,
        validate: {
          payload: joi.object({
            userId: [joi.number(), joi.allow(null)],
            data: joi.object(),
            output: 'data',
            parse: true,
          }).allow(null),
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/dashboard',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.getSellerDashboard,
      },
    });
  }
}