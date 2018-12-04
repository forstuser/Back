/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import BrandAdaptor from '../adaptors/brands';

let modals;
let brandAdaptor;

class BrandController {
  constructor(modal) {
    modals = modal;
    brandAdaptor = new BrandAdaptor(modal);
  }

  static async getBrands(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const isWebMode = (request.params && request.params.mode &&
        request.params.mode.toLowerCase() === 'web');
    try {
      if (!user && !isWebMode) {
        return reply.response({status: false, message: 'Unauthorized'});
      } else if (!request.pre.forceUpdate) {
        let results = [];
        if (request.query.categoryid) {
          let category_id = (request.query.categoryid || '').split(',');

          const options = JSON.parse(JSON.stringify({
            status_type: 1,
            category_id: category_id.length > 0 ? category_id : undefined,
          }));

          results = await modals.brands.findAll({
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
              }],
            order: [['brand_name', 'ASC']],
            attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
          });
        } else {
          results = await
              modals.brands.findAll({
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
        return reply.response({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getBrandASC(request, reply) {
    try {
      const results = await brandAdaptor.retrieveASCBrands(request.query);
      if (results) {
        return reply.response({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate,
        });
      }

      return reply.response({
        status: false,
        message: 'No Brand Found',
        forceUpdate: request.pre.forceUpdate,
      }).code(404);

    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default BrandController;
