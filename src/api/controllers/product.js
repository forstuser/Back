/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

const ProductAdaptor = require('../Adaptors/product');

let productAdaptor;

class ProductController {
	constructor(modal) {
		productAdaptor = new ProductAdaptor(modal);
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

module.exports = ProductController;
