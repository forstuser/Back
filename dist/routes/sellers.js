/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareSellerRoutes = prepareSellerRoutes;

var _sellers = require('../api/controllers/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Shop and earn routes
function prepareSellerRoutes(modal, route, middleware) {

  const varController = new _sellers2.default(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/mysellers',
      handler: _sellers2.default.getMySellers,
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
      path: '/sellers',
      handler: _sellers2.default.getSellers,
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
      path: '/sellers/{sid}',
      handler: _sellers2.default.getSellerById,
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
      method: 'DELETE',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.unLinkSellerWithUser,
        description: 'UnLink Seller with User.'
      }
    });
    route.push({
      method: 'PUT',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.linkSellerWithUser,
        description: 'Link Seller with User.'
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/invite',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.addInviteSeller,
        description: 'Add Seller to database and invite him on be half of User.',
        validate: {
          payload: {
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            contact_no: _joi2.default.string().required(),
            email: [_joi2.default.string(), _joi2.default.allow(null)],
            address: [_joi2.default.string(), _joi2.default.allow(null)],
            city_id: [_joi2.default.number(), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)],
            location_id: [_joi2.default.number(), _joi2.default.allow(null)],
            gstin: [_joi2.default.string(), _joi2.default.allow(null)],
            pan_no: [_joi2.default.string(), _joi2.default.allow(null)],
            reg_no: [_joi2.default.string(), _joi2.default.allow(null)],
            longitude: [_joi2.default.string(), _joi2.default.allow(null)],
            latitude: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });
  }
}