/*jshint esversion: 6 */
'use strict';

import ProductAdaptor from '../Adaptors/product';
import shared from '../../helpers/shared';

let productAdaptor;

class ProductController {
	constructor(modal) {
		productAdaptor = new ProductAdaptor(modal);
	}

  static createProduct(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      const productBody = {
        product_name: request.payload.product_name,
        user_id: user.id,
        main_category_id: request.payload.main_category_id,
        category_id: request.payload.category_id,
        brand_id: request.payload.brand_id,
        colour_id: request.payload.colour_id,
        purchase_cost: request.payload.purchase_cost,
        taxes: request.payload.taxes,
        updated_by: user.id,
        seller_id: request.payload.seller_id,
        status_type: 11,
        document_number: request.payload.document_number,
        document_date: request.payload.document_date,
      };
      const metaDataBody = request.payload.metadata.map((item) => {
        item.updated_by = user.id;

        return item;
      });
      return productAdaptor.createProduct(productBody, metaDataBody).
          then((result) => {
            if (result) {
              return reply({
                status: true,
                message: 'successfull',
                product: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'Product already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          }).
          catch((err) => {
            console.log(err);
            return reply({
              status: false,
              message: 'An error occurred in product creation.',
              forceUpdate: request.pre.forceUpdate,
              err,
            });
          });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

	static updateUserReview(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			const id = request.params.id;
			if (request.params.reviewfor === 'brands') {
				reply(productAdaptor
					.updateBrandReview(user, id, request));
			} else if (request.params.reviewfor === 'sellers') {
				reply(productAdaptor
					.updateSellerReview(user, id, request.query.isonlineseller, request));
			} else {
				reply(productAdaptor
					.updateProductReview(user, id, request));
			}
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveProductDetail(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			reply(productAdaptor.prepareProductDetail(user, request)).code(200);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}
}

export default ProductController;
