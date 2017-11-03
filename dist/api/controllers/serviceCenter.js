/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');
var google = require("../../helpers/google");

var modals = void 0;
var excludedAttributes = { exclude: ['tableBrandID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

var ServiceCenterController = function () {
	function ServiceCenterController(modal) {
		_classCallCheck(this, ServiceCenterController);

		modals = modal;
	}

	// Add Authorized Service Center


	_createClass(ServiceCenterController, null, [{
		key: 'addServiceCenter',
		value: function addServiceCenter(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var BrandID = request.payload.BrandID;
			var Name = request.payload.Name;
			var HouseNo = request.payload.HouseNo;
			var Block = request.payload.Block;
			var Street = request.payload.Street;
			var Sector = request.payload.Sector;
			var City = request.payload.City;
			var State = request.payload.State;
			var PinCode = request.payload.PinCode;
			var NearBy = request.payload.NearBy;
			var Latitude = request.payload.Latitude;
			var Longitude = request.payload.Longitude;
			var OpenDays = request.payload.OpenDays;
			var Timings = request.payload.Timings;
			var Details = request.payload.Details;
			modals.authorizedServiceCenter.findOrCreate({
				where: {
					Name: Name,
					BrandID: BrandID,
					HouseNo: HouseNo,
					Street: Street,
					City: City,
					State: State,
					status_id: 1
				},
				defaults: {
					Longitude: Longitude,
					Latitude: Latitude,
					OpenDays: OpenDays,
					Details: Details,
					Timings: Timings,
					Block: Block,
					Sector: Sector,
					PinCode: PinCode,
					NearBy: NearBy,
					updated_by_user_id: user.userId
				},
				attributes: excludedAttributes
			}).then(function (serviceCenter) {
				var detailPromise = [];
				var createdServiceCenter = void 0;
				if (serviceCenter[1]) {
					createdServiceCenter = serviceCenter[0];
					var CenterID = createdServiceCenter.ID;
					for (var i = 0; i < Details.length; i += 1) {
						detailPromise.push(modals.authorizeServiceCenterDetail.create({
							CenterID: CenterID,
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Detail: Details[i].Details,
							status_id: 1
						}));
					}
				}

				if (detailPromise.length > 0) {
					Promise.all(detailPromise).then(function (result) {
						createdServiceCenter.Details = result;
						reply(createdServiceCenter).header('CenterID', createdServiceCenter.ID).code(201);
					}).catch(function (err) {
						console.log({ API_Logs: err });
						reply(err);
					});
				} else {
					reply(serviceCenter[0]).header('CenterID', serviceCenter[0].ID).code(422);
				}
			});
		}
	}, {
		key: 'addServiceCenterDetail',
		value: function addServiceCenterDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var CenterID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Detail = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.authorizeServiceCenterDetail.findOrCreate({
					where: {
						DetailTypeID: DetailTypeID,
						DisplayName: DisplayName,
						CenterID: CenterID,
						status_id: 1
					},
					defaults: {
						Detail: Detail
					},
					attributes: excludedAttributes
				}).then(function (serviceCenterDetail) {
					if (serviceCenterDetail[1]) {
						return reply(serviceCenterDetail[0]).header('ServiceCenterDetailId', serviceCenterDetail[0].DetailID).code(201);
					}

					return reply(serviceCenterDetail[0]).header('ServiceCenterDetailId', serviceCenterDetail[0].DetailID).code(422);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'updateServiceCenter',
		value: function updateServiceCenter(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var BrandID = request.payload.BrandID;
			var Name = request.payload.Name;
			var HouseNo = request.payload.HouseNo;
			var Block = request.payload.Block;
			var Street = request.payload.Street;
			var Sector = request.payload.Sector;
			var City = request.payload.City;
			var State = request.payload.State;
			var PinCode = request.payload.PinCode;
			var NearBy = request.payload.NearBy;
			var Latitude = request.payload.Latitude;
			var Longitude = request.payload.Longitude;
			var OpenDays = request.payload.OpenDays;
			var Timings = request.payload.Timings;
			var Details = request.payload.Details;
			modals.authorizedServiceCenter.update({
				Name: Name,
				BrandID: BrandID,
				OpenDays: OpenDays,
				Timings: Timings,
				HouseNo: HouseNo,
				Block: Block,
				Street: Street,
				Sector: Sector,
				City: City,
				State: State,
				PinCode: PinCode,
				NearBy: NearBy,
				Latitude: Latitude,
				Longitude: Longitude,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(function () {
				var detailPromise = [];
				var CenterID = request.params.id;
				for (var i = 0; i < Details.length; i += 1) {
					if (Details[i].DetailID) {
						detailPromise.push(modals.authorizeServiceCenterDetail.update({
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Detail: Details[i].Details,
							status_id: 1
						}, {
							where: {
								DetailID: Details[i].DetailID
							}
						}));
					} else {
						detailPromise.push(modals.table_online_seller_details.create({
							CenterID: CenterID,
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Detail: Details[i].Details,
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
		key: 'updateServiceCenterDetail',
		value: function updateServiceCenterDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var CenterID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Detail = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.authorizeServiceCenterDetail.update({
					DetailTypeID: DetailTypeID,
					DisplayName: DisplayName,
					Detail: Detail
				}, {
					where: {
						CenterID: CenterID,
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
		key: 'deleteServiceCenter',
		value: function deleteServiceCenter(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			Promise.all([modals.authorizedServiceCenter.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}), modals.authorizeServiceCenterDetail.update({
				status_id: 3
			}, {
				where: {
					SellerID: request.params.id
				}
			})]).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'deleteServiceCenterDetail',
		value: function deleteServiceCenterDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.authorizeServiceCenterDetail.update({
					status_id: 3
				}, {
					where: {
						CenterID: request.params.id,
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
		key: 'retrieveServiceCenters',
		value: function retrieveServiceCenters(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user && !request.pre.forceUpdate) {
				var payload = request.payload || {
					location: '',
					city: '',
					searchValue: '',
					longitude: '',
					latitude: '',
					categoryId: '',
					masterCategoryId: '',
					brandId: ''
				};

				var latitude = payload.latitude || user.latitude || '';
				var longitude = payload.longitude || user.longitude || '';
				var location = payload.location || user.location || '';
				var city = payload.city || '';
				var latlong = latitude && longitude ? latitude + ', ' + longitude : '';
				var categoryId = request.query.categoryid || payload.categoryId || '';
				var brandId = request.query.brandid || payload.brandId || '';
				var whereClause = {
					status_id: {
						$ne: 3
					},
					$and: []
				};
				var brandWhereClause = {
					status_id: {
						$ne: 3
					}
				};
				var detailWhereClause = {
					status_id: {
						$ne: 3
					}
				};
				if (brandId) {
					whereClause.brand_id = brandId;
					brandWhereClause.brand_id = brandId;
				}

				if (categoryId) {
					detailWhereClause.category_id = categoryId;
				}

				if (city) {
					whereClause.$and.push(modals.sequelize.where(modals.sequelize.fn('lower', modals.sequelize.col('address_city')), modals.sequelize.fn('lower', city)));
				}
				var origins = [];
				var destinations = [];
				if (latlong) {
					origins.push(latlong);
				} else if (location) {
					origins.push(location);
				} else if (city) {
					origins.push(city);
				}

				Promise.all([modals.authorizedServiceCenter.findAll({
					where: whereClause,
					include: [{
						model: modals.table_brands,
						as: 'brand',
						attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
						where: brandWhereClause,
						required: true
					}, {
						model: modals.authorizeServiceCenterDetail,
						as: 'centerDetails',
						attributes: [['display_name', 'name'], 'details', ['contactdetail_type_id', 'detailType']],
						where: detailWhereClause,
						required: true
					}],
					attributes: [['center_name', 'centerName'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude', 'timings', ['open_days', 'openingDays'], [modals.sequelize.fn('CONCAT', 'categories/', categoryId, '/image/'), 'cImageURL'], 'address']
				}), modals.table_brands.findAll({
					where: {
						status_id: {
							$ne: 3
						}
					},
					include: [{
						model: modals.brandDetails,
						as: 'details',
						where: {
							status_id: {
								$ne: 3
							},
							category_id: categoryId
						},
						attributes: []
					}],
					attributes: [['brand_id', 'id'], ['brand_name', 'name']]
				})]).then(function (result) {
					var serviceCentersWithLocation = [];
					var finalResult = [];
					if (result[0].length > 0) {
						var serviceCenters = result[0].map(function (item) {
							var center = item.toJSON();
							center.mobileDetails = center.centerDetails.filter(function (detail) {
								return detail.detailType === 3;
							});
							center.address = center.address + ', ' + center.city + ' -' + center.pinCode + ', ' + center.state;
							center.centerAddress = center.centerName + ', ' + center.city + '-' + center.pinCode + ', ' + center.state + ', India';
							center.geoLocation = center.latitude && center.longitude && center.latitude.toString() !== '0' && center.longitude.toString() !== '0' ? center.latitude + ', ' + center.longitude : '';
							if (center.geoLocation) {
								destinations.push(center.geoLocation);
							} else if (center.centerAddress) {
								destinations.push(center.centerAddress);
							} else if (center.city) {
								destinations.push(center.city);
							}

							if (origins.length > 0 && destinations.length > 0) {
								serviceCentersWithLocation.push(center);
							} else {
								center.distanceMetrics = 'km';
								center.distance = parseFloat(500.001);
								finalResult.push(center);
							}

							return center;
						});
						if (origins.length > 0 && destinations.length > 0) {
							return google.distanceMatrix(origins, destinations).then(function (result) {
								for (var i = 0; i < serviceCentersWithLocation.length; i += 1) {
									if (result.length > 0) {
										var tempMatrix = result[i];
										serviceCentersWithLocation[i].distanceMetrics = "km";
										serviceCentersWithLocation[i].distance = tempMatrix.distance ? (tempMatrix.distance.value / 1000).toFixed(2) : null;
										// serviceCentersWithLocation[i].distance = serviceCentersWithLocation[i].distanceMetrics !== 'km' ? serviceCentersWithLocation[i].distance / 1000 : serviceCentersWithLocation[i].distance;
									} else {
										serviceCentersWithLocation[i].distanceMetrics = 'km';
										serviceCentersWithLocation[i].distance = parseFloat(500.001);
									}

									finalResult.push(serviceCentersWithLocation[i]);
								}

								var finalFilteredList = serviceCentersWithLocation.filter(function (elem) {
									return elem.distance !== null && parseFloat(elem.distance) <= 40;
								});

								finalFilteredList.sort(function (a, b) {
									return a.distance - b.distance;
								});

								reply({
									status: true,
									serviceCenters: finalFilteredList,
									filterData: {
										brands: result[1]
									},
									forceUpdate: request.pre.forceUpdate
								}).code(200);
								// }
							}).catch(function (err) {
								console.log({ API_Logs: err });

								reply({
									status: false,
									err: err,
									forceUpdate: request.pre.forceUpdate
								});
							});
						}
						if (origins.length <= 0) {
							reply({
								status: true,
								filterData: {
									brands: result[1]
								},
								serviceCenters: serviceCenters,
								forceUpdate: request.pre.forceUpdate
							});
						}
					} else {
						reply({
							status: false,
							message: 'No Data Found for mentioned search',
							serviceCenters: [],
							forceUpdate: request.pre.forceUpdate
						});
					}
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reply({
						status: false,
						err: err,
						forceUpdate: request.pre.forceUpdate
					});
				});
			} else if (!user) {
				reply({ status: false, message: "Unauthorized", forceUpdate: request.pre.forceUpdate });
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'retrieveServiceCenterById',
		value: function retrieveServiceCenterById(request, reply) {
			modals.authorizedServiceCenter.findOne({
				where: {
					ID: request.params.id
				},
				include: [{ model: modals.table_brands, as: 'Brand', attributes: ['Name'] }, {
					model: modals.authorizeServiceCenterDetail,
					as: 'Details',
					attributes: excludedAttributes
				}],
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'retrieveServiceCenterFilters',
		value: function retrieveServiceCenterFilters(request, reply) {
			if (!request.pre.forceUpdate) {
				Promise.all([modals.categories.findAll({
					where: {
						display_id: [2, 3],
						category_level: 1,
						status_id: {
							$ne: 3
						}
					},
					include: [{
						model: modals.categories,
						on: {
							$or: [modals.sequelize.where(modals.sequelize.col('`subCategories`.`ref_id`'), modals.sequelize.col('`categories`.`category_id`'))]
						},
						as: 'subCategories',
						where: {
							status_id: {
								$ne: 3
							}
						},
						attributes: [['category_id', 'id'], ['category_name', 'name']],
						required: false
					}],
					attributes: [['category_id', 'id'], ['display_id', 'cType'], ['category_name', 'name']],
					order: ['category_name', modals.sequelize.literal('subCategories.category_name')]
				}), modals.authorizedServiceCenter.aggregate('address_city', 'DISTINCT', { plain: false, order: [['address_city']] }), modals.table_brands.findAll({
					where: {
						status_id: {
							$ne: 3
						}
					},
					include: [{ model: modals.authorizedServiceCenter, as: 'center', attributes: [] }],
					attributes: [['brand_name', 'name'], ['brand_id', 'id']]
				})]).then(function (result) {
					reply({
						status: true,
						categories: result[0],
						cities: result[1].map(function (item) {
							return item.DISTINCT;
						}),
						brands: result[2],
						forceUpdate: request.pre.forceUpdate
					});
				});
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}]);

	return ServiceCenterController;
}();

module.exports = ServiceCenterController;