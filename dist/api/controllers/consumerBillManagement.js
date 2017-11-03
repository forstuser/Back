/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');

var modals = void 0;
var excludedAttributes = { exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

var BillManagementController = function () {
	function BillManagementController(modal) {
		_classCallCheck(this, BillManagementController);

		modals = modal;
	}

	// Assign Task To CE


	_createClass(BillManagementController, null, [{
		key: 'assignTaskTOCE',
		value: function assignTaskTOCE(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var UserID = request.payload.UserID;
			var BillID = request.payload.BillID;
			var Comments = request.payload.Comments;
			modals.table_cust_executive_tasks.findOrCreate({
				where: {
					user_id: UserID,
					BillID: BillID
				},
				defaults: {
					Comments: Comments,
					updated_by_user_id: user.userId,
					status_id: 6
				},
				attributes: excludedAttributes
			}).then(function (ceTask) {
				if (ceTask[1]) {
					Promise.all([modals.consumerBills.update({
						admin_status: 8,
						updated_by_user_id: user.userId
					}, {
						where: {
							BillID: BillID
						}
					}), modals.table_cust_executive_tasks.delete({
						where: {
							BillID: BillID,
							user_id: {
								$ne: UserID
							}
						}
					})]).then(function () {
						return reply(ceTask[0]).header('TaskID', ceTask[0].ID).code(201);
					}).catch(function (err) {
						console.log({ API_Logs: err });
						reply(err);
					});
				} else {
					modals.table_cust_executive_tasks.update({
						Comments: Comments,
						updated_by_user_id: user.userId,
						status_id: 7
					}, {
						where: {
							ID: ceTask[0].ID
						}
					}).then(function () {
						return reply(ceTask[0]).header('TaskID', ceTask[0].ID).code(204);
					}).catch(function (err) {
						console.log({ API_Logs: err });
						reply(err);
					});
				}
			});
		}

		// Assign Task To QE

	}, {
		key: 'assignTaskTOQE',
		value: function assignTaskTOQE(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var UserID = request.payload.UserID;
			var BillID = request.payload.BillID;
			var Comments = request.payload.Comments;
			modals.table_qual_executive_tasks.findOrCreate({
				where: {
					user_id: UserID,
					BillID: BillID
				},
				defaults: {
					Comments: Comments,
					updated_by_user_id: user.userId,
					status_id: 6
				},
				attributes: excludedAttributes
			}).then(function (qeTask) {
				if (qeTask[1]) {
					reply(qeTask[0]).header('TaskID', qeTask[0].ID).code(201);
				} else {
					reply(qeTask[0]).header('TaskID', qeTask[0].ID).code(422);
				}
			});
		}

		// Assign Task To CE From QE

	}, {
		key: 'qeAssignTaskTOCE',
		value: function qeAssignTaskTOCE(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var UserID = request.payload.UserID;
			var BillID = request.payload.BillID;
			var Comments = request.payload.Comments;
			Promise.all([modals.table_cust_executive_tasks.update({
				Comments: Comments,
				updated_by_user_id: user.userId,
				status_id: 7
			}, {
				where: {
					BillID: BillID,
					user_id: UserID
				}
			}), modals.table_qual_executive_tasks.delete({
				where: {
					BillID: BillID,
					user_id: UserID
				}
			})]).then(function () {
				reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
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
			modals.table_authorized_service_center.update({
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
						detailPromise.push(modals.table_authorized_service_center_details.update({
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
				modals.table_authorized_service_center_details.update({
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
			Promise.all([modals.table_authorized_service_center.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}), modals.table_authorized_service_center_details.update({
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
				modals.table_authorized_service_center_details.update({
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

		// Get Admin Consumer Bills List

	}, {
		key: 'retrieveAdminConsumerBillList',
		value: function retrieveAdminConsumerBillList(request, reply) {
			var Status = request.query.status;
			var includeTables = void 0;
			switch (Status) {
				case '4':
					{
						includeTables = [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }];
						break;
					}
				case '8':
					{
						includeTables = [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }, {
							model: modals.table_cust_executive_tasks,
							as: 'CustomerExecutive',
							attributes: ['status_id', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}]
						}, {
							model: modals.table_qual_executive_tasks,
							as: 'QualityExecutive',
							attributes: ['status_id', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}]
						}];
						break;
					}
				case '5':
					{
						includeTables = [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }, {
							model: modals.table_cust_executive_tasks,
							as: 'CustomerExecutive',
							attributes: ['status_id', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}]
						}, {
							model: modals.table_qual_executive_tasks,
							as: 'QualityExecutive',
							attributes: ['status_id', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}]
						}];
						break;
					}
				default:
					{
						var data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
						return reply(data);
					}
			}

			return modals.consumerBills.findAll({
				where: {
					user_status: {
						$ne: 3
					},
					admin_status: 4
				},
				include: includeTables,
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'retrieveCEBills',
		value: function retrieveCEBills(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var Status = request.query.status;
			var includeTables = void 0;
			var filters = void 0;
			switch (Status) {
				case '4':
					{
						includeTables = [{
							model: modals.consumerBills,
							as: 'ConsumerBill',
							attributes: ['BillDate', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}],
							where: {
								status_id: { $ne: 3 }
							}
						}, { model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }, { model: modals.table_status, as: 'Status', attributes: ['Name'] }];
						filters = { status_id: [6, 7], user_id: user.userId };
						break;
					}
				case '5':
					{
						includeTables = [{
							model: modals.consumerBills,
							as: 'ConsumerBill',
							attributes: ['BillDate', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}]
						}, { model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }, { model: modals.table_status, as: 'Status', attributes: ['Name'] }];
						filters = { status_id: 5, user_id: user.userId };
						break;
					}
				default:
					{
						var data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
						return reply(data);
					}
			}

			return modals.table_cust_executive_tasks.findAll({
				where: filters,
				include: includeTables,
				attributes: excludedAttributes,
				order: ['updated_on', 'DESC']
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'retrieveQEBills',
		value: function retrieveQEBills(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var Status = request.query.status;
			var includeTables = void 0;
			var filters = void 0;
			switch (Status) {
				case '4':
					{
						includeTables = [{
							model: modals.consumerBills,
							as: 'ConsumerBill',
							attributes: ['BillDate', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}],
							where: {
								status_id: { $ne: 3 }
							}
						}, { model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }, { model: modals.table_status, as: 'Status', attributes: ['Name'] }];
						filters = { status_id: [6, 7], user_id: user.userId };
						break;
					}
				case '5':
					{
						includeTables = [{
							model: modals.consumerBills,
							as: 'ConsumerBill',
							attributes: ['BillDate', 'TaskAssignedDate'],
							include: [{
								model: modals.table_users,
								as: 'User',
								attributes: ['Name', 'EmailAddress', 'PhoneNo']
							}]
						}, { model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }, { model: modals.table_status, as: 'Status', attributes: ['Name'] }];
						filters = { status_id: 5, user_id: user.userId };
						break;
					}
				default:
					{
						var data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
						return reply(data);
					}
			}

			return modals.table_qual_executive_tasks.findAll({
				where: filters,
				include: includeTables,
				attributes: excludedAttributes,
				order: ['updated_on', 'DESC']
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}]);

	return BillManagementController;
}();

module.exports = BillManagementController;