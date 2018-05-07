/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _ehome = require('../Adaptors/ehome');

var _ehome2 = _interopRequireDefault(_ehome);

var _dashboard = require('../Adaptors/dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dashboardAdaptor = void 0;
var eHomeAdaptor = void 0;
var notificationAdaptor = void 0;
var userAdaptor = void 0;
var modals = void 0;

var DashboardController = function () {
  function DashboardController(modal) {
    _classCallCheck(this, DashboardController);

    dashboardAdaptor = new _dashboard2.default(modal);
    eHomeAdaptor = new _ehome2.default(modal);
    notificationAdaptor = new _notification2.default(modal);
    userAdaptor = new _user2.default(modal);
    modals = modal;
  }

  _createClass(DashboardController, null, [{
    key: 'getDashboard',
    value: function getDashboard(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply(dashboardAdaptor.retrieveDashboardResult(user, request)).code(200);
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'getEHome',
    value: function getEHome(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      var language = request.language;
      console.log(language);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply(eHomeAdaptor.prepareEHomeResult(user, request, language)).code(200);
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'getProductsInCategory',
    value: function getProductsInCategory(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply(eHomeAdaptor.prepareProductDetail({
          user: user,
          masterCategoryId: request.params.id,
          ctype: request.query.subCategoryId,
          brandIds: (request.query.brandids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean),
          categoryIds: (request.query.categoryids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean),
          offlineSellerIds: (request.query.offlinesellerids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean),
          onlineSellerIds: (request.query.onlinesellerids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean),
          sortBy: request.query.sortby,
          searchValue: request.query.searchvalue,
          request: request
        })).code(200);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateNotificationStatus',
    value: function updateNotificationStatus(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return notificationAdaptor.updateNotificationStatus(user, request.payload.notificationIds).then(function () {
          return reply({ status: true }).code(201); //, forceUpdate: request.pre.forceUpdate}).code(201);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({ status: false }).code(500); //, forceUpdate: request.pre.forceUpdate}).code(500);
        });
      }
    }
  }, {
    key: 'getMailbox',
    value: function getMailbox(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else if (!request.pre.forceUpdate && user) {
        return reply(notificationAdaptor.retrieveNotifications(user, request)).code(200);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'notifyUser',
    value: function notifyUser(request, reply) {
      var payload = request.payload || { userId: '', data: { title: '', description: '' } };
      notificationAdaptor.notifyUser(payload.userId || '', payload.data, reply);
    }
  }]);

  return DashboardController;
}();

exports.default = DashboardController;