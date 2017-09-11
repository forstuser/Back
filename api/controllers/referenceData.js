/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = {exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID']};

class ReferenceDataController {
	constructor(modal) {
		modals = modal;
	}

	// Add Exclusions
	static addColors(request, reply) {
		const Name = request.payload.Name;
		modals.table_color.findOrCreate({
			where: {
				Name,
				status_id: 1
			}
		}).then((color) => {
			if (color[1]) {
				reply(color[0]).headers('ColorID', color[0].ID).code(201);
			} else {
				reply(color[0]).header('ColorID', color[0].ID).code(422);
			}
		});
	}

	static updateColors(request, reply) {
		const Name = request.payload.Name;
		modals.table_color.update({
			Name
		}, {
			where: {
				ID: request.params.id
			}
		}).then(reply().code(204)).catch(err => reply(err));
	}

	static deleteColors(request, reply) {
		modals.table_color.update({
			status_id: 3
		}, {
			where: {
				ID: request.params.id
			}
		}).then(() => reply().code(204)).catch(err => reply(err));
	}

	static retrieveColors(request, reply) {
		modals.table_color.findAll({
			where: {
				status_id: 1
			},
			attributes: excludedAttributes
		}).then((result) => {
			reply(result).code(200);
		}).catch((err) => {
			reply(err);
		});
	}

	static retrieveUserTypes(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		let userFilter;
		if (user.UserTypeID === 2) {
			userFilter = [3, 4, 6];
		} else if (user.UserTypeID === 1) {
			userFilter = [2, 3, 4, 6];
		} else {
			userFilter = 0;
		}

		modals.user_type_name.findAll({
			where: {
				ID: userFilter
			},
			attributes: excludedAttributes
		}).then((result) => {
			if (result.length > 0) {
				reply(result).code(200);
			} else {
				reply().code(404);
			}
		}).catch((err) => {
			reply(err);
		});
	}

	// Get Inclusions
	static retrieveColorsById(request, reply) {
		modals.table_list_of_inclusions.findAll({
			where: {
				status_id: 1,
				ID: request.params.id
			}
		}).then((result) => {
			reply(result).code(200);
		}).catch((err) => {
			reply(err);
		});
	}
}

module.exports = ReferenceDataController;
