/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');

var modals = void 0;
var excludedAttributes = { exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

var ExclusionInclusionController = function () {
	function ExclusionInclusionController(modal) {
		_classCallCheck(this, ExclusionInclusionController);

		modals = modal;
	}

	// Add Exclusions


	_createClass(ExclusionInclusionController, null, [{
		key: 'addExclusions',
		value: function addExclusions(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var CatID = request.payload.CatID;
			var Name = request.payload.Name;
			modals.table_list_of_exclusions.findOrCreate({
				where: {
					exclusions_name: Name,
					category_id: CatID,
					status_id: 1
				},
				defaults: {
					updated_by_user_id: user.userId
				},
				attributes: excludedAttributes
			}).then(function (exclusionCat) {
				if (exclusionCat[1]) {
					reply(exclusionCat[0]).headers('ExclusionID', exclusionCat[0].exclusions_id).code(201);
				} else {
					reply(exclusionCat[0]).header('ExclusionID', exclusionCat[0].exclusions_id).code(422);
				}
			});
		}

		// Add Inclusions

	}, {
		key: 'addInclusions',
		value: function addInclusions(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var CatID = request.payload.CatID;
			var Name = request.payload.Name;
			modals.table_list_of_inclusions.findOrCreate({
				where: {
					inclusions_name: Name,
					category_id: CatID,
					status_id: 1
				},
				defaults: {
					updated_by_user_id: user.userId
				},
				attributes: excludedAttributes
			}).then(function (inclusionCat) {
				if (inclusionCat[1]) {
					reply(inclusionCat[0]).headers('InclusionID', inclusionCat[0].inclusions_id).code(201);
				} else {
					reply(inclusionCat[0]).header('InclusionID', inclusionCat[0].inclusions_id).code(422);
				}
			});
		}
	}, {
		key: 'updateExclusions',
		value: function updateExclusions(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var CatID = request.payload.CatID;
			var Name = request.payload.Name;
			modals.table_list_of_exclusions.update({
				CatID: CatID,
				Name: Name,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(reply().code(204)).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'updateInclusions',
		value: function updateInclusions(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			var CatID = request.payload.CatID;
			var Name = request.payload.Name;
			modals.table_list_of_inclusions.update({
				CatID: CatID,
				Name: Name,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(reply().code(204)).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'deleteExclusions',
		value: function deleteExclusions(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			modals.table_list_of_exclusions.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'deleteInclusions',
		value: function deleteInclusions(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			modals.table_list_of_inclusions.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					ID: request.params.id
				}
			}).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}

		// Get Exclusions

	}, {
		key: 'retrieveExclusions',
		value: function retrieveExclusions(request, reply) {
			modals.table_list_of_exclusions.findAll({
				where: {
					status_id: 1
				},
				include: [{ model: modals.table_categories, as: 'Categories', attributes: ['Name'] }],
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}

		// Get Inclusions

	}, {
		key: 'retrieveInclusions',
		value: function retrieveInclusions(request, reply) {
			modals.table_list_of_inclusions.findAll({
				where: {
					status_id: 1
				},
				include: [{ model: modals.table_categories, as: 'Categories', attributes: ['Name'] }],
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}]);

	return ExclusionInclusionController;
}();

module.exports = ExclusionInclusionController;