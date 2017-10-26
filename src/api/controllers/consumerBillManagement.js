/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = {exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID']};

class BillManagementController {
	constructor(modal) {
		modals = modal;
	}

	// Assign Task To CE
	static assignTaskTOCE(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const UserID = request.payload.UserID;
		const BillID = request.payload.BillID;
		const Comments = request.payload.Comments;
		modals.table_cust_executive_tasks.findOrCreate({
			where: {
				user_id: UserID,
				BillID
			},
			defaults: {
				Comments,
				updated_by_user_id: user.userId,
				status_id: 6
			},
			attributes: excludedAttributes
		}).then((ceTask) => {
			if (ceTask[1]) {
				Promise.all([modals.consumerBills.update({
					admin_status: 8,
					updated_by_user_id: user.userId
				}, {
					where: {
						BillID
					}
				}),
					modals.table_cust_executive_tasks.delete({
						where: {
							BillID,
							user_id: {
								$ne: UserID
							}
						}
					})]).then(() => reply(ceTask[0]).header('TaskID', ceTask[0].ID).code(201)).catch((err) => {
					console.log({API_Logs: err});
					reply(err);
				});
			} else {
				modals.table_cust_executive_tasks.update({
					Comments,
					updated_by_user_id: user.userId,
					status_id: 7
				}, {
					where: {
						ID: ceTask[0].ID
					}
				}).then(() => reply(ceTask[0]).header('TaskID', ceTask[0].ID).code(204)).catch((err) => {
					console.log({API_Logs: err});
					reply(err);
				});
			}
		});
	}

	// Assign Task To QE
	static assignTaskTOQE(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const UserID = request.payload.UserID;
		const BillID = request.payload.BillID;
		const Comments = request.payload.Comments;
		modals.table_qual_executive_tasks.findOrCreate({
			where: {
				user_id: UserID,
				BillID
			},
			defaults: {
				Comments,
				updated_by_user_id: user.userId,
				status_id: 6
			},
			attributes: excludedAttributes
		}).then((qeTask) => {
			if (qeTask[1]) {
				reply(qeTask[0]).header('TaskID', qeTask[0].ID).code(201);
			} else {
				reply(qeTask[0]).header('TaskID', qeTask[0].ID).code(422);
			}
		});
	}

	// Assign Task To CE From QE
	static qeAssignTaskTOCE(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const UserID = request.payload.UserID;
		const BillID = request.payload.BillID;
		const Comments = request.payload.Comments;
		Promise.all([
			modals.table_cust_executive_tasks.update({
				Comments,
				updated_by_user_id: user.userId,
				status_id: 7
			}, {
				where: {
					BillID,
					user_id: UserID
				}
			}),
			modals.table_qual_executive_tasks.delete({
				where: {
					BillID,
					user_id: UserID
				}
			})]).then(() => {
			reply().code(204);
		}).catch((err) => {
			console.log({API_Logs: err});
			reply(err);
		});
	}

	static updateServiceCenter(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const BrandID = request.payload.BrandID;
		const Name = request.payload.Name;
		const HouseNo = request.payload.HouseNo;
		const Block = request.payload.Block;
		const Street = request.payload.Street;
		const Sector = request.payload.Sector;
		const City = request.payload.City;
		const State = request.payload.State;
		const PinCode = request.payload.PinCode;
		const NearBy = request.payload.NearBy;
		const Latitude = request.payload.Latitude;
		const Longitude = request.payload.Longitude;
		const OpenDays = request.payload.OpenDays;
		const Timings = request.payload.Timings;
		const Details = request.payload.Details;
		modals.table_authorized_service_center.update({
			Name,
			BrandID,
			OpenDays,
			Timings,
			HouseNo,
			Block,
			Street,
			Sector,
			City,
			State,
			PinCode,
			NearBy,
			Latitude,
			Longitude,
			updated_by_user_id: user.userId
		}, {
			where: {
				ID: request.params.id
			}
		}).then(() => {
			const detailPromise = [];
			const CenterID = request.params.id;
			for (let i = 0; i < Details.length; i += 1) {
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
						CenterID,
						DetailTypeID: Details[i].DetailTypeID,
						DisplayName: Details[i].DisplayName,
						Detail: Details[i].Details,
						status_id: 1
					}));
				}
			}

			if (detailPromise.length > 0) {
				Promise.all(detailPromise).then(() => reply().code(204)).catch((err) => {
					console.log({API_Logs: err});
					reply(err);
				});
			} else {
				reply().code(422);
			}
		});
	}

	static updateServiceCenterDetail(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const CenterID = request.params.id;
		const DetailTypeID = request.payload.DetailTypeID;
		const DisplayName = request.payload.DisplayName;
		const Detail = request.payload.Details;
		if (user.accessLevel.toLowerCase() === 'premium') {
			modals.table_authorized_service_center_details.update({
				DetailTypeID,
				DisplayName,
				Detail
			}, {
				where: {
					CenterID,
					DetailID: request.params.detailid
				}
			}).then(() => reply().code(204)).catch((err) => {
				console.log({API_Logs: err});
				reply(err);
			});
		} else {
			reply().code(401);
		}
	}

	static deleteServiceCenter(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
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
		})]).then(() => reply().code(204)).catch((err) => {
			console.log({API_Logs: err});
			reply(err);
		});
	}

	static deleteServiceCenterDetail(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user.accessLevel.toLowerCase() === 'premium') {
			modals.table_authorized_service_center_details.update({
				status_id: 3
			}, {
				where: {
					CenterID: request.params.id,
					DetailID: request.params.detailid
				}
			}).then(() => reply().code(204)).catch((err) => {
				console.log({API_Logs: err});
				reply(err);
			});
		} else {
			reply().code(401);
		}
	}

	// Get Admin Consumer Bills List
	static retrieveAdminConsumerBillList(request, reply) {
		const Status = request.query.status;
		let includeTables;
		switch (Status) {
			case '4': {
				includeTables = [
					{model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo']}
				];
				break;
			}
			case '8': {
				includeTables = [
					{model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo']},
					{
						model: modals.table_cust_executive_tasks,
						as: 'CustomerExecutive',
						attributes: ['status_id', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}]
					},
					{
						model: modals.table_qual_executive_tasks,
						as: 'QualityExecutive',
						attributes: ['status_id', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}]
					}
				];
				break;
			}
			case '5': {
				includeTables = [
					{model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo']},
					{
						model: modals.table_cust_executive_tasks,
						as: 'CustomerExecutive',
						attributes: ['status_id', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}]
					},
					{
						model: modals.table_qual_executive_tasks,
						as: 'QualityExecutive',
						attributes: ['status_id', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}]
					}
				];
				break;
			}
			default: {
				const data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
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
		}).then((result) => {
			reply(result).code(200);
		}).catch((err) => {
			console.log({API_Logs: err});
			reply(err);
		});
	}

	static retrieveCEBills(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const Status = request.query.status;
		let includeTables;
		let filters;
		switch (Status) {
			case '4': {
				includeTables = [
					{
						model: modals.consumerBills,
						as: 'ConsumerBill',
						attributes: ['BillDate', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}],
						where: {
							status_id: {$ne: 3}
						}
					},
					{model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo']},
					{model: modals.table_status, as: 'Status', attributes: ['Name']}
				];
				filters = {status_id: [6, 7], user_id: user.userId};
				break;
			}
			case '5': {
				includeTables = [
					{
						model: modals.consumerBills,
						as: 'ConsumerBill',
						attributes: ['BillDate', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}]
					},
					{model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo']},
					{model: modals.table_status, as: 'Status', attributes: ['Name']}
				];
				filters = {status_id: 5, user_id: user.userId};
				break;
			}
			default: {
				const data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
				return reply(data);
			}
		}

		return modals.table_cust_executive_tasks.findAll({
			where: filters,
			include: includeTables,
			attributes: excludedAttributes,
			order: ['updated_on', 'DESC']
		}).then((result) => {
			reply(result).code(200);
		}).catch((err) => {
			console.log({API_Logs: err});
			reply(err);
		});
	}

	static retrieveQEBills(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		const Status = request.query.status;
		let includeTables;
		let filters;
		switch (Status) {
			case '4': {
				includeTables = [
					{
						model: modals.consumerBills,
						as: 'ConsumerBill',
						attributes: ['BillDate', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}],
						where: {
							status_id: {$ne: 3}
						}
					},
					{model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo']},
					{model: modals.table_status, as: 'Status', attributes: ['Name']}
				];
				filters = {status_id: [6, 7], user_id: user.userId};
				break;
			}
			case '5': {
				includeTables = [
					{
						model: modals.consumerBills,
						as: 'ConsumerBill',
						attributes: ['BillDate', 'TaskAssignedDate'],
						include: [{
							model: modals.table_users,
							as: 'User',
							attributes: ['Name', 'EmailAddress', 'PhoneNo']
						}]
					},
					{model: modals.table_users, as: 'Admin', attributes: ['Name', 'EmailAddress', 'PhoneNo']},
					{model: modals.table_status, as: 'Status', attributes: ['Name']}
				];
				filters = {status_id: 5, user_id: user.userId};
				break;
			}
			default: {
				const data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
				return reply(data);
			}
		}

		return modals.table_qual_executive_tasks.findAll({
			where: filters,
			include: includeTables,
			attributes: excludedAttributes,
			order: ['updated_on', 'DESC']
		}).then((result) => {
			reply(result).code(200);
		}).catch((err) => {
			console.log({API_Logs: err});
			reply(err);
		});
	}
}

module.exports = BillManagementController;
