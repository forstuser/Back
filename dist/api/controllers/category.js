/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals;

class CategoryController {
  constructor(modal) {
    modals = modal;
  }

  static getCategories(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    const isWebMode = request.params && request.params.mode && request.params.mode.toLowerCase() === 'web';
    if (!user && !isWebMode) {
      reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      });
    } else if (!request.pre.forceUpdate) {
      let condition;

      if (request.query.brandid || request.query.brandId) {
        condition = `= ${request.query.brandid || request.query.brandId}`;
      } else {
        condition = 'IS NOT NULL';
      }

      return modals.sequelize.query(`SELECT category_id, category_name from categories where category_id in (SELECT DISTINCT category_id from service_center_details where center_id in (SELECT center_id from center_brand_mapping where brand_id ${condition})) order by category_name;`).then(results => {
        if (results.length === 0) {
          reply.response({
            status: true,
            categories: [],
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          reply.response({
            status: true,
            categories: results[0],
            forceUpdate: request.pre.forceUpdate
          });
        }
      }).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        reply.response({ status: false, message: 'ISE' });
      });
    } else {
      reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }
}

exports.default = CategoryController;