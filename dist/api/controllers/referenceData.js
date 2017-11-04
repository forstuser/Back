/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modals = void 0;
var excludedAttributes = { exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

var ReferenceDataController = function () {
	function ReferenceDataController(modal) {
		_classCallCheck(this, ReferenceDataController);

		modals = modal;
	}

	// Add Exclusions


	_createClass(ReferenceDataController, null, [{
		key: 'addColors',
		value: function addColors(request, reply) {
			var Name = request.payload.Name;
			modals.table_color.findOrCreate({
				where: {
					Name: Name,
					status_id: 1
				}
			}).then(function (color) {
				if (color[1]) {
					reply(color[0]).headers('ColorID', color[0].ID).code(201);
				} else {
					reply(color[0]).header('ColorID', color[0].ID).code(422);
				}
			});
		}
	}, {
		key: 'updateColors',
		value: function updateColors(request, reply) {
			var Name = request.payload.Name;
			modals.table_color.update({
				Name: Name
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
		key: 'deleteColors',
		value: function deleteColors(request, reply) {
			modals.table_color.update({
				status_id: 3
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
		key: 'retrieveColors',
		value: function retrieveColors(request, reply) {
			modals.table_color.findAll({
				where: {
					status_id: 1
				},
				attributes: excludedAttributes
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'retrieveUserTypes',
		value: function retrieveUserTypes(request, reply) {
			var user = _shared2.default.verifyAuthorization(request.headers);
			var userFilter = void 0;
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
			}).then(function (result) {
				if (result.length > 0) {
					reply(result).code(200);
				} else {
					reply().code(404);
				}
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}

		// Get Inclusions

	}, {
		key: 'retrieveColorsById',
		value: function retrieveColorsById(request, reply) {
			modals.table_list_of_inclusions.findAll({
				where: {
					status_id: 1,
					ID: request.params.id
				}
			}).then(function (result) {
				reply(result).code(200);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}]);

	return ReferenceDataController;
}();

exports.default = ReferenceDataController;