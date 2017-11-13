/*jshint esversion: 6 */
'use strict';

import Bluebird from 'bluebird';
import shared from '../../helpers/shared';

let modals;
const excludedAttributes = {
  exclude: [
    'display_id',
    'created_on',
    'updated_on',
    'updated_by_user_id',
    'status_id'],
};

class BrandController {
  constructor(modal) {
    modals = modal;
  }

  static getBrands(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({status: false, message: 'Unauthorized'});
    } else if (!request.pre.forceUpdate) {
      const categoryId = request.query.categoryid || undefined;

      const options = {
        status_type: 1,
        category_id: categoryId,
      };

      if (categoryId) {
        options.category_id = categoryId;
      }

      return Bluebird.try(() => {
        if (categoryId) {
          return modals.brands.findAll({
            where: {
              status_type: 1,
            },
            include: [
              {
                model: modals.brandDetails,
                as: 'details',
                where: options,
                required: true,
              }, {
                model: modals.serviceCenters,
                as: 'centers',
                attributes: [],
                required: true,
              },
            ],
            order: [['brand_name', 'ASC']],
            attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
          });
        } else {
          return modals.brands.findAll({
            where: {
              status_type: 1,
            },
            order: [['brand_name', 'ASC']],
            attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
            include: [
              {
                model: modals.serviceCenters,
                as: 'centers',
                attributes: [],
                required: true,
              },
            ],
          });
        }
      }).then((results) => {
        reply({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate,
        });
      }).catch((err) => {
        console.log({API_Logs: err});
        reply({
          status: false,
          message: 'Something wrong',
          forceUpdate: request.pre.forceUpdate,
        }).code(500);
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

export default BrandController;
