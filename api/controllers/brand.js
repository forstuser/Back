/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = {exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id']};

class BrandController {
	constructor(modal) {
		modals = modal;
	}

	static getBrands(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({status: false, message: "Unauthorized"});
		} else if (!request.pre.forceUpdate) {
			const categoryId = request.query.categoryid || undefined;

			const options = {};

			if (categoryId) {
				options.category_id = categoryId;
			}

			modals.table_brands.findAll({
				where: {
					status_id: {
						$ne: 3
					}
				},
				include: [
					{
						model: modals.brandDetails,
						as: 'details',
						attributes: [],
						where: options,
						required: true
					}
				],
				attributes: [['brand_name', 'brandName'], ['brand_id', 'id']]
			}).then((results) => {
				reply({status: true, brands: results, forceUpdate: request.pre.forceUpdate});
			}).catch((err) => {
				console.log(err);
				reply({status: false, message: "Something wrong", forceUpdate: request.pre.forceUpdate}).code(500);
			});
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static addBrand(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const Name = request.payload.Name;
		const Description = request.payload.Description;
		const Details = request.payload.Details;
		modals.table_brands.findOrCreate({
			where: {
				Name,
				status_id: 1
			},
			defaults: {
				Description,
				updated_by_user_id: user.userId
			},
			attributes: excludedAttributes
		}).then((brand) => {
			const detailPromise = [];
			let createdBrand;
			if (brand[1]) {
				createdBrand = brand[0];
				const brandId = createdBrand.ID;
				for (let i = 0; i < Details.length; i += 1) {
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
				Promise.all(detailPromise).then((result) => {
					createdBrand.Details = result;
					reply(createdBrand).header('brandId', brand.ID).code(201);
				}).catch((err) => {
					reply(err);
				});
			} else {
				reply(brand[0]).header('brandId', brand.ID).code(422);
			}
		});
	}

	static addBrandDetail(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const BrandID = request.params.id;
		const DetailTypeID = request.payload.DetailTypeID;
		const DisplayName = request.payload.DisplayName;
		const Details = request.payload.Details;
		if (user.accessLevel.toLowerCase() === 'premium') {
			modals.table_brand_details.findOrCreate({
				where: {
					DetailTypeID,
					DisplayName,
					BrandID,
					status_id: 1
				},
				defaults: {
					Details
				},
				attributes: excludedAttributes
			}).then((brandDetail) => {
				if (brandDetail[1]) {
					return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(201);
				}

				return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(422);
			});
		} else {
			reply().code(401);
		}
	}

	static updateBrand(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const Name = request.payload.Name;
		const Description = request.payload.Description;
		const Details = request.payload.Details;
		modals.table_brands.update({
			Name,
			Description,
			updated_by_user_id: user.userId
		}, {
			where: {
				ID: request.params.id
			}
		}).then(() => {
			const detailPromise = [];
			const brandId = request.params.id;
			for (let i = 0; i < Details.length; i += 1) {
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
				Promise.all(detailPromise).then(() => reply().code(204)).catch(err => reply(err));
			} else {
				reply().code(422);
			}
		});
	}

	static updateBrandDetail(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const BrandID = request.params.id;
		const DetailTypeID = request.payload.DetailTypeID;
		const DisplayName = request.payload.DisplayName;
		const Details = request.payload.Details;
		if (user.accessLevel.toLowerCase() === 'premium') {
			modals.table_brand_details.update({
				DetailTypeID,
				DisplayName,
				Details
			}, {
				where: {
					BrandID,
					DetailID: request.params.detailid
				}
			}).then(() => reply().code(204)).catch(err => reply(err));
		} else {
			reply().code(401);
		}
	}

	static deleteBrand(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
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
		})]).then(() => reply().code(204)).catch(err => reply(err));
	}

	static deleteBrandDetail(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user.accessLevel.toLowerCase() === 'premium') {
			modals.table_brand_details.update({
				status_id: 3
			}, {
				where: {
					BrandID: request.params.id,
					DetailID: request.params.detailid
				}
			}).then(() => reply().code(204)).catch(err => reply(err));
		} else {
			reply().code(401);
		}
	}

	static retrieveBrand(request, reply) {
		modals.table_brands.findAll({
			where: {status_id: 1},
			attributes: excludedAttributes
		}).then((result) => {
			reply(result).code(200);
		}).catch(err => reply(err));
	}

	static retrieveBrandById(request, reply) {
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
		})]).then((result) => {
			if (result[0]) {
				const brand = result[0].toJSON();
				brand.Details = result[1];
				return reply(brand).code(200);
			}

			return reply().code(404);
		}).catch((err) => {
			reply(err);
		});
	}
}

module.exports = BrandController;
