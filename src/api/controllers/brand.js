/*jshint esversion: 6 */
'use strict';

import Bluebird from 'bluebird';
import shared from '../../helpers/shared';
import BrandAdaptor from '../Adaptors/brands';

let modals;
let brandAdaptor;

class BrandController {
  constructor(modal) {
    modals = modal;
    brandAdaptor = new BrandAdaptor(modal);
  }

  static getBrands(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const isWebMode = (request.params && request.params.mode &&
        request.params.mode.toLowerCase() === 'web');
    if (!user && !isWebMode) {
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
            attributes: ['brand_name', ['brand_id', 'id']],
          });
        } else {
          return modals.brands.findAll({
            where: {
              status_type: 1,
            },
            order: [['brand_name', 'ASC']],
            attributes: ['brand_name', ['brand_id', 'id']],
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
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
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

  static getBrandASC(request, reply) {
    return brandAdaptor.retrieveASCBrands(request.query).then((results) => {
      if (results) {
        return reply({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate,
        });
      }

      return reply({
        status: false,
        message: 'No Brand Found',
        forceUpdate: request.pre.forceUpdate,
      }).code(404);

    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({
        status: false,
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate,
      }).code(500);
    });
  }
}

export default BrandController;
