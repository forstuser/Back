/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');

var modals = void 0;
var excludedAttributes = { exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id'] };

var SellerController = function () {
	function SellerController(modal) {
		_classCallCheck(this, SellerController);

		modals = modal;
	}

	_createClass(SellerController, null, [{
		key: 'addSeller',
		value: function addSeller(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var Name = request.payload.Name;
			var URL = request.payload.URL;
			var GstinNo = request.payload.GstinNo;
			var Details = request.payload.Details;
			modals.table_online_seller.findOrCreate({
				where: {
					Name: Name,
					status_id: 1
				},
				defaults: {
					URL: URL,
					GstinNo: GstinNo,
					Details: Details,
					updated_by_user_id: user.userId
				},
				attributes: excludedAttributes
			}).then(function (seller) {
				var detailPromise = [];
				var createdSeller = void 0;
				if (seller[1]) {
					createdSeller = seller[0];
					var sellerId = createdSeller.ID;
					for (var i = 0; i < Details.length; i += 1) {
						detailPromise.push(modals.table_online_seller_details.create({
							SellerID: sellerId,
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Details: Details[i].Details,
							status_id: 1
						}));
					}
				}

				if (detailPromise.length > 0) {
					Promise.all(detailPromise).then(function (result) {
						createdSeller.Details = result;
						reply(createdSeller).header('SellerID', seller.ID).code(201);
					}).catch(function (err) {
						console.log({ API_Logs: err });
						reply(err);
					});
				} else {
					reply(seller[0]).header('SellerId', seller.ID).code(422);
				}
			});
		}
	}, {
		key: 'addSellerDetail',
		value: function addSellerDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var SellerID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Details = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_online_seller_details.findOrCreate({
					where: {
						DetailTypeID: DetailTypeID,
						DisplayName: DisplayName,
						SellerID: SellerID,
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
		key: 'updateSeller',
		value: function updateSeller(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var Name = request.payload.Name;
			var URL = request.payload.URL;
			var GstinNo = request.payload.GstinNo;
			var Details = request.payload.Details;
			modals.table_online_seller.update({
				Name: Name,
				URL: URL,
				GstinNo: GstinNo,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(function () {
				var detailPromise = [];
				var SellerID = request.params.id;
				for (var i = 0; i < Details.length; i += 1) {
					if (Details[i].DetailID) {
						detailPromise.push(modals.table_online_seller_details.update({
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
						detailPromise.push(modals.table_online_seller_details.create({
							SellerID: SellerID,
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
		key: 'updateSellerDetail',
		value: function updateSellerDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var SellerID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Details = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_online_seller_details.update({
					DetailTypeID: DetailTypeID,
					DisplayName: DisplayName,
					Details: Details
				}, {
					where: {
						SellerID: SellerID,
						DetailID: request.params.detailid
					}
				}).then(function () {
					return reply().code(204);
				}).catch(function (err) {
					return reply(err);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'deleteSeller',
		value: function deleteSeller(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			Promise.all([modals.table_online_seller.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}), modals.table_online_seller_details.update({
				status_id: 3
			}, {
				where: {
					SellerID: request.params.id
				}
			})]).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				return reply(err);
			});
		}
	}, {
		key: 'deleteSellerDetail',
		value: function deleteSellerDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_online_seller_details.update({
					status_id: 3
				}, {
					where: {
						SellerID: request.params.id,
						DetailID: request.params.detailid
					}
				}).then(function () {
					return reply().code(204);
				}).catch(function (err) {
					return reply(err);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'retrieveSeller',
		value: function retrieveSeller(request, reply) {
			modals.table_online_seller.findAll({
				where: { status_id: 1 },
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				return reply(err);
			});
		}
	}, {
		key: 'retrieveSellerById',
		value: function retrieveSellerById(request, reply) {
			Promise.all([modals.table_online_seller.findOne({
				where: {
					ID: request.params.id
				},
				attributes: excludedAttributes
			}), modals.table_online_seller_details.findAll({
				where: {
					status_id: 1,
					SellerID: request.params.id
				}
			})]).then(function (result) {
				var seller = result[0].toJSON();
				seller.Details = result[1];
				reply(seller).code(200);
			}).catch(function (err) {
				reply(err);
			});
		}
	}, {
		key: 'addOfflineSeller',
		value: function addOfflineSeller(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var OwnerName = request.payload.OwnerName;
			var PanNo = request.payload.PanNo;
			var RegNo = request.payload.RegNo;
			var ServiceProvider = request.payload.ServiceProvider;
			var OnBoarded = request.payload.Onboarded;
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
			var Name = request.payload.Name;
			var URL = request.payload.URL;
			var GstinNo = request.payload.GstinNo;
			var Details = request.payload.Details;
			modals.table_offline_seller.findOrCreate({
				where: {
					Name: Name,
					OwnerName: OwnerName,
					HouseNo: HouseNo,
					Street: Street,
					City: City,
					State: State,
					status_id: 1
				},
				defaults: {
					Longitude: Longitude,
					Latitude: Latitude,
					OwnerName: OwnerName,
					GstinNo: GstinNo,
					Details: Details,
					PanNo: PanNo,
					RegNo: RegNo,
					ServiceProvider: ServiceProvider,
					Block: Block,
					Sector: Sector,
					PinCode: PinCode,
					NearBy: NearBy,
					URL: URL,
					OnBoarded: OnBoarded,
					updated_by_user_id: user.userId
				},
				attributes: excludedAttributes
			}).then(function (seller) {
				var detailPromise = [];
				var createdSeller = void 0;
				if (seller[1]) {
					createdSeller = seller[0];
					var sellerId = createdSeller.ID;
					for (var i = 0; i < Details.length; i += 1) {
						detailPromise.push(modals.table_offline_seller_details.create({
							SellerID: sellerId,
							DetailTypeID: Details[i].DetailTypeID,
							DisplayName: Details[i].DisplayName,
							Details: Details[i].Details,
							status_id: 1
						}));
					}
				}

				if (detailPromise.length > 0) {
					Promise.all(detailPromise).then(function (result) {
						createdSeller.Details = result;
						reply(createdSeller).header('SellerID', seller.ID).code(201);
					}).catch(function (err) {
						reply(err);
					});
				} else {
					reply(seller[0]).header('SellerId', seller.ID).code(422);
				}
			});
		}
	}, {
		key: 'addOfflineSellerDetail',
		value: function addOfflineSellerDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var SellerID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Details = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_offline_seller_details.findOrCreate({
					where: {
						DetailTypeID: DetailTypeID,
						DisplayName: DisplayName,
						SellerID: SellerID,
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
		key: 'updateOfflineSeller',
		value: function updateOfflineSeller(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var OwnerName = request.payload.OwnerName;
			var PanNo = request.payload.PanNo;
			var RegNo = request.payload.RegNo;
			var ServiceProvider = request.payload.ServiceProvider;
			var OnBoarded = request.payload.Onboarded;
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
			var Name = request.payload.Name;
			var URL = request.payload.URL;
			var GstinNo = request.payload.GstinNo;
			var Details = request.payload.Details;
			modals.table_offline_seller.update({
				Name: Name,
				URL: URL,
				GstinNo: GstinNo,
				OwnerName: OwnerName,
				PanNo: PanNo,
				RegNo: RegNo,
				ServiceProvider: ServiceProvider,
				OnBoarded: OnBoarded,
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
				var SellerID = request.params.id;
				for (var i = 0; i < Details.length; i += 1) {
					if (Details[i].DetailID) {
						detailPromise.push(modals.table_offline_seller_details.update({
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
						detailPromise.push(modals.table_offline_seller_details.create({
							SellerID: SellerID,
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
						return reply(err);
					});
				} else {
					reply().code(422);
				}
			});
		}
	}, {
		key: 'updateOfflineSellerDetail',
		value: function updateOfflineSellerDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var SellerID = request.params.id;
			var DetailTypeID = request.payload.DetailTypeID;
			var DisplayName = request.payload.DisplayName;
			var Details = request.payload.Details;
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_offline_seller_details.update({
					DetailTypeID: DetailTypeID,
					DisplayName: DisplayName,
					Details: Details
				}, {
					where: {
						SellerID: SellerID,
						DetailID: request.params.detailid
					}
				}).then(function () {
					return reply().code(204);
				}).catch(function (err) {
					return reply(err);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'deleteOfflineSeller',
		value: function deleteOfflineSeller(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			Promise.all([modals.table_offline_seller.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}), modals.table_offline_seller_details.update({
				status_id: 3
			}, {
				where: {
					SellerID: request.params.id
				}
			})]).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				return reply(err);
			});
		}
	}, {
		key: 'deleteOfflineSellerDetail',
		value: function deleteOfflineSellerDetail(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user.accessLevel.toLowerCase() === 'premium') {
				modals.table_offline_seller_details.update({
					status_id: 3
				}, {
					where: {
						SellerID: request.params.id,
						DetailID: request.params.detailid
					}
				}).then(function () {
					return reply().code(204);
				}).catch(function (err) {
					return reply(err);
				});
			} else {
				reply().code(401);
			}
		}
	}, {
		key: 'retrieveOfflineSeller',
		value: function retrieveOfflineSeller(request, reply) {
			modals.table_offline_seller.findAll({
				where: { status_id: 1 },
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				return reply(err);
			});
		}
	}, {
		key: 'retrieveOfflineSellerById',
		value: function retrieveOfflineSellerById(request, reply) {
			Promise.all([modals.table_offline_seller.findOne({
				where: {
					ID: request.params.id
				},
				attributes: excludedAttributes
			}), modals.table_offline_seller_details.findAll({
				where: {
					status_id: 1,
					SellerID: request.params.id
				}
			})]).then(function (result) {
				var seller = result[0].toJSON();
				seller.Details = result[1];
				reply(seller).code(200);
			}).catch(function (err) {
				reply(err);
			});
		}
	}]);

	return SellerController;
}();

module.exports = SellerController;