/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');
var Bluebird = require("bluebird");

var modals = void 0;
var excludedAttributes = { exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id'] };

var BrandController = function () {
	function BrandController(modal) {
		_classCallCheck(this, BrandController);

		modals = modal;
	}

	_createClass(BrandController, null, [{
		key: 'getBrands',
		value: function getBrands(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({ status: false, message: "Unauthorized" });
			} else if (!request.pre.forceUpdate) {
				var categoryId = request.query.categoryid || undefined;

				var options = {};

				if (categoryId) {
					options.category_id = categoryId;
				}

				return Bluebird.try(function () {
					if (categoryId) {
						return modals.table_brands.findAll({
							where: {
								status_id: {
									$ne: 3
								}
							},
							include: [{
								model: modals.brandDetails,
								as: 'details',
								attributes: [],
								where: options,
								required: true
							}, {
								model: modals.authorizedServiceCenter,
								as: 'center',
								attributes: [],
								required: true
							}],
							order: [['brand_name', 'ASC']],
							attributes: [['brand_name', 'brandName'], ['brand_id', 'id']]
						});
					} else {
						return modals.table_brands.findAll({
							where: {
								status_id: {
									$ne: 3
								}
							},
							order: [['brand_name', 'ASC']],
							attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
							include: [{
								model: modals.authorizedServiceCenter,
								as: 'center',
								attributes: [],
								required: true
							}]
						});
					}
				}).then(function (results) {
					reply({ status: true, brands: results, forceUpdate: request.pre.forceUpdate });
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reply({ status: false, message: "Something wrong", forceUpdate: request.pre.forceUpdate }).code(500);
				});
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'addBrand',
		value: function addBrand(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var Name = request.payload.Name;
			var Description = request.payload.Description;
			var Details = request.payload.Details;
			modals.table_brands.findOrCreate({
				where: {
					Name: Name,
					status_id: 1
				},
				defaults: {
					Description: Description,
					updated_by_user_id: user.userId
				},
				attributes: excludedAttributes
			}).then(function (brand) {
				var detailPromise = [];
				var createdBrand = void 0;
				if (brand[1]) {
					createdBrand = brand[0];
					var brandId = createdBrand.ID;
					for (var i = 0; i < Details.length; i += 1) {
						detailPromise.push(modals.table_brand_details.create({
							BrandID: brandId,
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Details: Details[i].Details,
							status_id: 1
						}));
					}
				}

				if (detailPromise.length > 0) {
					Promise.all(detailPromise).then(function (result) {
						createdBrand.Details = result;
						reply(createdBrand).header('brandId', brand.ID).code(201);
					}).catch(function (err) {
						console.log({ API_Logs: err });
						reply(err);
					});
				} else {
					reply(brand[0]).header('brandId', brand.ID).code(422);
				}
			});
		}
	}, {
		key: 'addBrandDetail',
		value: function addBrandDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var BrandID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Details = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_brand_details.findOrCreate({
					where: {
						DetailTypeID: DetailTypeID,
						DisplayName: DisplayName,
						BrandID: BrandID,
						status_id: 1
					},
					defaults: {
						Details: Details
					},
					attributes: excludedAttributes
				}).then(function (brandDetail) {
					if (brandDetail[1]) {
						return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(201);
					}

					return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(422);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'updateBrand',
		value: function updateBrand(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var Name = request.payload.Name;
			var Description = request.payload.Description;
			var Details = request.payload.Details;
			modals.table_brands.update({
				Name: Name,
				Description: Description,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(function () {
				var detailPromise = [];
				var brandId = request.params.id;
				for (var i = 0; i < Details.length; i += 1) {
					if (Details[i].DetailID) {
						detailPromise.push(modals.table_brand_details.update({
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Details: Details[i].Details,
							status_id: 1
						}, {
							where: {
								DetailID: Details[i].DetailID
							}
						}));
					} else {
						detailPromise.push(modals.table_brand_details.create({
							BrandID: brandId,
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Details: Details[i].Details,
							status_id: 1
						}));
					}
				}

				if (detailPromise.length > 0) {
					Promise.all(detailPromise).then(function () {
						return reply().code(204);
					}).catch(function (err) {
						console.log({ API_Logs: err });
						reply(err);
					});
				} else {
					reply().code(422);
				}
			});
		}
	}, {
		key: 'updateBrandDetail',
		value: function updateBrandDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var BrandID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Details = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_brand_details.update({
					DetailTypeID: DetailTypeID,
					DisplayName: DisplayName,
					Details: Details
				}, {
					where: {
						BrandID: BrandID,
						DetailID: request.params.detailid
					}
				}).then(function () {
					return reply().code(204);
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reply(err);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'deleteBrand',
		value: function deleteBrand(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			Promise.all([modals.table_brands.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}), modals.table_brand_details.update({
				status_id: 3
			}, {
				where: {
					BrandID: request.params.id
				}
			})]).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'deleteBrandDetail',
		value: function deleteBrandDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_brand_details.update({
					status_id: 3
				}, {
					where: {
						BrandID: request.params.id,
						DetailID: request.params.detailid
					}
				}).then(function () {
					return reply().code(204);
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reply(err);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'retrieveBrand',
		value: function retrieveBrand(request, reply) {
			modals.table_brands.findAll({
				where: { status_id: 1 },
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'retrieveBrandById',
		value: function retrieveBrandById(request, reply) {
			Promise.all([modals.table_brands.findOne({
				where: {
					ID: request.params.id
				},
				attributes: excludedAttributes
			}), modals.table_brand_details.findAll({
				where: {
					status_id: 1,
					BrandID: request.params.id
				}
			})]).then(function (result) {
				if (result[0]) {
					var brand = result[0].toJSON();
					brand.Details = result[1];
					return reply(brand).code(200);
				}

				return reply().code(404);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}]);

	return BrandController;
}();

module.exports = BrandController;