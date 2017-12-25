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
    const isWebMode = (request.params && request.params.mode &&
        request.params.mode.toLowerCase() === 'web');
    if (!user && !isWebMode) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (!request.pre.forceUpdate) {
      let condition;

      if (request.query.brandid || request.query.brandId) {
        condition = `= ${request.query.brandid || request.query.brandId}`;
      } else {
        condition = 'IS NOT NULL';
      }

      return modals.sequelize.query(
          `SELECT category_id, category_name from categories where category_id in (SELECT DISTINCT category_id from service_center_details where center_id in (SELECT center_id from center_brand_mapping where brand_id ${condition})) order by category_name;`).
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
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
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
