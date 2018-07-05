'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareDashboardRoutes = prepareDashboardRoutes;

var _dashboard = require('../api/controllers/dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareDashboardRoutes(modal, routeObject, middleware) {
  const controllerInit = new _dashboard2.default(modal);
  if (controllerInit) {

    /*Retrieve dashboard of consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/dashboard',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _dashboard2.default.getDashboard
      }
    });

    /*Retrieve E-Home of consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/ehome',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _dashboard2.default.getEHome
      }
    });

    /*Retrieve Product list for categories*/
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/products',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _dashboard2.default.getProductsInCategory
      }
    });

    /*Retrieve mails of consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/mailbox',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _dashboard2.default.getMailbox
      }
    });

    /*Mark mail of consumer read*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/mailbox/read',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _dashboard2.default.updateNotificationStatus,
        validate: {
          payload: {
            notificationIds: _joi2.default.array().items(_joi2.default.number()).required().min(0),
            output: 'data',
            parse: true
          }
        }
      }
    });

    /*Send notification to consumer*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/notify',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _dashboard2.default.notifyUser,
        validate: {
          payload: _joi2.default.object({
            userId: [_joi2.default.number(), _joi2.default.allow(null)],
            data: _joi2.default.object(),
            output: 'data',
            parse: true
          }).allow(null)
        }
      }
    });
  }
}