/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareOfferRoutes = prepareOfferRoutes;

var _offer = require('../api/controllers/offer');

var _offer2 = _interopRequireDefault(_offer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareOfferRoutes(modal, route, middleware) {

  const varController = new _offer2.default(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/offer/categories',
      handler: _offer2.default.getOfferCategories,
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }]
      }
    });

    route.push({
      method: 'GET',
      path: '/offer/categories/{id}',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _offer2.default.getOffers
      }
    });
  }
}