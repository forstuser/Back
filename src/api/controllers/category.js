/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';

let modals;

class CategoryController {
  constructor(modal) {
    modals = modal;
  }

  static getCategories(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (!request.pre.forceUpdate) {
      let condition;

      if (request.query.brandid) {
        condition = `= ${request.query.brandid}`;
      } else {
        condition = 'IS NOT NULL';
      }

      return modals.sequelize.query(
          `SELECT category_id, category_name from table_categories where category_id in (SELECT DISTINCT category_id from service_center_details where center_id in (SELECT center_id from center_brand_mapping where brand_id ${condition})) order by category_name;`).
          then((results) => {
            if (results.length === 0) {
              reply({
                status: true,
                categories: [],
                forceUpdate: request.pre.forceUpdate,
              });
            }
            else {
              reply({
                status: true,
                categories: results[0],
                forceUpdate: request.pre.forceUpdate,
              });
            }
          }).
          catch((err) => {
            console.log({API_Logs: err});
            reply({status: false, message: 'ISE'});
          });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default CategoryController;
