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

  static async getCategories(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    const isWebMode = request.params && request.params.mode && request.params.mode.toLowerCase() === 'web';
    try {
      if (!user && !isWebMode) {
        return reply.response({
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

        const results = await modals.sequelize.query(`SELECT category_id, category_name from categories where category_id in (SELECT DISTINCT category_id from service_center_details where center_id in (SELECT center_id from center_brand_mapping where brand_id ${condition})) order by category_name;`);
        if (results.length === 0) {
          return reply.response({
            status: true,
            categories: [],
            forceUpdate: request.pre.forceUpdate
          });
        }

        return reply.response({
          status: true,
          categories: results[0],
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({ status: false, message: 'ISE' });
    }
  }
}

exports.default = CategoryController;