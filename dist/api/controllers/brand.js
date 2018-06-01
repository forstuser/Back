/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _brands = require('../Adaptors/brands');

var _brands2 = _interopRequireDefault(_brands);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals;
let brandAdaptor;

class BrandController {
  constructor(modal) {
    modals = modal;
    brandAdaptor = new _brands2.default(modal);
  }

  static getBrands(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    const isWebMode = request.params && request.params.mode && request.params.mode.toLowerCase() === 'web';
    if (!user && !isWebMode) {
      reply.response({ status: false, message: 'Unauthorized' });
    } else if (!request.pre.forceUpdate) {
      const categoryId = request.query.categoryid || undefined;

      const options = {
        status_type: 1,
        category_id: categoryId
      };

      if (categoryId) {
        options.category_id = categoryId;
      }

      return _bluebird2.default.try(() => {
        if (categoryId) {
          return modals.brands.findAll({
            where: {
              status_type: 1
            },
            include: [{
              model: modals.brandDetails,
              as: 'details',
              where: options,
              required: true
            }, {
              model: modals.serviceCenters,
              as: 'centers',
              attributes: [],
              required: true
            }],
            order: [['brand_name', 'ASC']],
            attributes: [['brand_name', 'brandName'], ['brand_id', 'id']]
          });
        } else {
          return modals.brands.findAll({
            where: {
              status_type: 1
            },
            order: [['brand_name', 'ASC']],
            attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
            include: [{
              model: modals.serviceCenters,
              as: 'centers',
              attributes: [],
              required: true
            }]
          });
        }
      }).then(results => {
        reply.response({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate
        });
      }).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        reply.response({
          status: false,
          message: 'Something wrong',
          forceUpdate: request.pre.forceUpdate
        }).code(500);
      });
    } else {
      reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static getBrandASC(request, reply) {
    return brandAdaptor.retrieveASCBrands(request.query).then(results => {
      if (results) {
        return reply.response({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate
        });
      }

      return reply.response({
        status: false,
        message: 'No Brand Found',
        forceUpdate: request.pre.forceUpdate
      }).code(404);
    }).catch(err => {
      console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
      return reply.response({
        status: false,
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate
      }).code(500);
    });
  }
}

exports.default = BrandController;