/**
 * Created by arpit on 7/3/2017.
 */
const shared = require('../../helpers/shared');

const ProductAdaptor = require('../Adaptors/product');

let productAdaptor;

class ProductController {
  constructor(modal) {
    productAdaptor = new ProductAdaptor(modal);
  }

  static updateUserReview(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const id = request.params.id;
    if (request.params.reviewfor === 'brands') {
      reply(productAdaptor
        .updateBrandReview(user, id, request.payload));
    } else if (request.params.reviewfor === 'seller') {
      reply(productAdaptor
        .updateSellerReview(user, id, request.query.isonlineseller, request.payload));
    } else {
      reply(productAdaptor
        .updateProductReview(user, id, request.payload));
    }
  }

  static getEHome(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user) {
      reply(productAdaptor.prepareEHomeResult(user)).code(200);
    } else {
      reply({ message: 'Token Expired or Invalid' }).code(401);
    }
  }

  static getProductsInCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    reply(productAdaptor.prepareProductDetail(user, request.params.id)).code(200);
  }
}

module.exports = ProductController;
