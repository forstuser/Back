/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');

var DashboardAdaptor = require('../Adaptors/dashboard');
var EHomeAdaptor = require('../Adaptors/ehome');
var NotificationAdaptor = require('../Adaptors/notification');

var dashboardAdaptor = void 0;
var ehomeAdaptor = void 0;
var notificationAdaptor = void 0;

var DashboardController = function () {
	function DashboardController(modal) {
		_classCallCheck(this, DashboardController);

		dashboardAdaptor = new DashboardAdaptor(modal);
		ehomeAdaptor = new EHomeAdaptor(modal);
		notificationAdaptor = new NotificationAdaptor(modal);
	}

	_createClass(DashboardController, null, [{
		key: 'getDashboard',
		value: function getDashboard(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user && !request.pre.forceUpdate) {
				reply(dashboardAdaptor.retrieveDashboardResult(user, request)).code(200);
			} else if (!user) {
				reply({ message: 'Token Expired or Invalid', forceUpdate: request.pre.forceUpdate }).code(401);
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'getEHome',
		value: function getEHome(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (user && !request.pre.forceUpdate) {
				reply(ehomeAdaptor.prepareEHomeResult(user, request)).code(200);
			} else if (!user) {
				reply({ status: false, message: 'Token Expired or Invalid', forceUpdate: request.pre.forceUpdate }).code(401);
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'getProductsInCategory',
		value: function getProductsInCategory(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({
					status: false,
					message: 'Unauthorized',
					forceUpdate: request.pre.forceUpdate
				});
			} else if (user && !request.pre.forceUpdate) {
				reply(ehomeAdaptor.prepareProductDetail(user, request.params.id, request.query.ctype,
				/* request.query.pageno, */
				request.query.brandids || '[]', request.query.categoryids || '[]', request.query.offlinesellerids || '[]', request.query.onlinesellerids || '[]', request.query.sortby, request.query.searchvalue, request)).code(200);
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'updateNotificationStatus',
		value: function updateNotificationStatus(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({
					status: false,
					message: 'Unauthorized'
				});
			} else {
				//if (user && !request.pre.forceUpdate) {
				notificationAdaptor.updateNotificationStatus(user, request.payload.notificationIds).then(function (count) {
					console.log("UPDATE COUNT: ", count);

					reply({ status: true }).code(201); //, forceUpdate: request.pre.forceUpdate}).code(201);
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reply({ status: false }).code(500); //, forceUpdate: request.pre.forceUpdate}).code(500);
				});
			}
			// } else {
			// 	reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
			// }
		}
	}, {
		key: 'getMailbox',
		value: function getMailbox(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({
					status: false,
					message: 'Unauthorized',
					forceUpdate: request.pre.forceUpdate
				});
			} else if (!request.pre.forceUpdate && user) {
				reply(notificationAdaptor.retrieveNotifications(user, request)).code(200);
			} else {
				reply({ status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate });
			}
		}
	}, {
		key: 'notifyUser',
		value: function notifyUser(request, reply) {
			var payload = request.payload || { userId: '', data: { title: '', description: '' } };
			notificationAdaptor.notifyUser(payload.userId || '', payload.data, reply);
		}
	}]);

	return DashboardController;
}();

module.exports = DashboardController;