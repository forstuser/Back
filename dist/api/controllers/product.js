/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');

var ProductAdaptor = require('../Adaptors/product');

var productAdaptor = void 0;

var ProductController = function () {
	function ProductController(modal) {
		_classCallCheck(this, ProductController);

		productAdaptor = new ProductAdaptor(modal);
	}

	_createClass(ProductController, null, [{
		key: 'updateUserReview',
		value: function updateUserReview(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({
					status: false,
					message: 'Unauthorized',
					forceUpdate: request.pre.forceUpdate
				});
			} else if (user && !request.pre.forceUpdate) {
				var id = request.params.id;
				if (request.params.reviewfor === 'brands') {
					reply(productAdaptor.updateBrandReview(user, id, request));
				} else if (request.params.reviewfor === 'sellers') {
					reply(productAdaptor.updateSellerReview(user, id, request.query.isonlineseller, request));
				} else {
					reply(productAdaptor.updateProductReview(user, id, request));
				}
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'retrieveProductDetail',
		value: function retrieveProductDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({
					status: false,
					message: 'Unauthorized',
					forceUpdate: request.pre.forceUpdate
				});
			} else if (user && !request.pre.forceUpdate) {
				reply(productAdaptor.prepareProductDetail(user, request)).code(200);
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}]);

	return ProductController;
}();

module.exports = ProductController;