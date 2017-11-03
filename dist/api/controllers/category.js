/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');

var modals = void 0;
var excludedAttributes = { exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id'] };

var CategoryController = function () {
	function CategoryController(modal) {
		_classCallCheck(this, CategoryController);

		modals = modal;
	}

	_createClass(CategoryController, null, [{
		key: 'addCategory',
		value: function addCategory(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			modals.table_categories.findOrCreate({
				where: {
					category_name: request.payload.Name,
					status_id: 1,
					ref_id: request.payload.RefID
				},
				defaults: {
					category_level: request.payload.Level,
					updated_by_user_id: user.ID,
					category_name: request.payload.Name,
					status_id: 1,
					ref_id: request.payload.RefID
				},
				attributes: excludedAttributes,
				order: [['category_name', 'ASC']]
			}).then(function (category) {
				if (category[1]) {
					return reply(category[0]).header('categoryId', category.category_id).code(201);
				}

				return reply(category[0]).header('categoryId', category.category_id).code(422);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'updateCategory',
		value: function updateCategory(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			modals.table_categories.update({
				category_level: request.payload.Level,
				updated_by_user_id: user.ID,
				category_name: request.payload.Name,
				status_id: 1,
				ref_id: request.payload.RefID
			}, {
				where: {
					category_id: request.params.id
				}
			}).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'deleteCategory',
		value: function deleteCategory(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			modals.table_categories.update({
				status_id: 3,
				updated_by_user_id: user.userId
			}, {
				where: {
					category_id: request.params.id
				}
			}).then(function () {
				return reply().code(204);
			}).catch(function (err) {
				console.log({ API_Logs: err });
				reply(err);
			});
		}
	}, {
		key: 'retrieveCategory',
		value: function retrieveCategory(request, reply) {
			modals.table_categories.findAll({
				where: {
					$or: [{ status_id: 1 }, {
						$and: [{ status_id: 1 }, { ref_id: shared.verifyParameters(request.query, 'refid', '') }]
					}, {
						$and: [{ status_id: 1 }, { category_level: shared.verifyParameters(request.query, 'level', '') }]
					}]
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
		key: 'retrieveCategoryById',
		value: function retrieveCategoryById(request, reply) {
			modals.table_categories.findOne({
				where: {
					category_id: request.params.id
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
		key: 'getCategories',
		value: function getCategories(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({ status: false, message: "Unauthorized", forceUpdate: request.pre.forceUpdate });
			} else if (!request.pre.forceUpdate) {
				// const includes = [{
				// 		modal: modals.authorizedServiceCenter,
				// 		as: 'center',
				// 		where: {brand_id: request.query.brandid},
				// 		attributes: []
				// }];
				//
				// if (request.query.brandid) {
				// 	includes.push({
				// 		model: modals.brandDetails,
				// 		as: 'details',
				// 		where: {
				// 			status_id: {
				// 				$ne: 3
				// 			},
				// 			brand_id: request.query.brandid
				// 		},
				// 		attributes: [],
				// 		required: true
				// 	});
				// }

				// return modals.categories.findAll({
				// 	where: {
				// 		status_id: {
				// 			$ne: 3
				// 		}
				// 	},
				// 	include: includes,
				// 	attributes: [['category_id', 'id'], ['display_id', 'cType'], ['category_name', 'name']],
				// 	order: ['category_name']
				// })

				var condition = void 0;

				if (request.query.brandid) {
					condition = '= ' + request.query.brandid;
				} else {
					condition = "IS NOT NULL";
				}

				return modals.sequelize.query('SELECT category_id, category_name from table_categories where category_id in (SELECT DISTINCT category_id from table_authorized_service_center_details where center_id in (SELECT center_id from table_authorized_service_center where brand_id ' + condition + ')) order by category_name;').then(function (results) {
					if (results.length === 0) {
						reply({ status: true, categories: [], forceUpdate: request.pre.forceUpdate });
					} else {
						reply({ status: true, categories: results[0], forceUpdate: request.pre.forceUpdate });
					}
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reply({ status: false, message: "ISE" });
				});
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}]);

	return CategoryController;
}();

module.exports = CategoryController;