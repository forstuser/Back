/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

const DashboardAdaptor = require('../Adaptors/dashboard');
const EHomeAdaptor = require('../Adaptors/ehome');
const NotificationAdaptor = require('../Adaptors/notification');

let dashboardAdaptor;
let ehomeAdaptor;
let notificationAdaptor;

class DashboardController {
	constructor(modal) {
		dashboardAdaptor = new DashboardAdaptor(modal);
		ehomeAdaptor = new EHomeAdaptor(modal);
		notificationAdaptor = new NotificationAdaptor(modal);
	}

	static getDashboard(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
			reply(dashboardAdaptor.retrieveDashboardResult(user, request)).code(200);
		} else if (!user) {
			reply({message: 'Token Expired or Invalid', forceUpdate: request.pre.forceUpdate}).code(401);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static getEHome(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
			reply(ehomeAdaptor.prepareEHomeResult(user, request)).code(200);
		} else if (!user) {
			reply({status: false, message: 'Token Expired or Invalid', forceUpdate: request.pre.forceUpdate}).code(401);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static getProductsInCategory(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			reply(ehomeAdaptor
				.prepareProductDetail(user, request.params.id, request.query.ctype,
					/* request.query.pageno, */
					request.query.brandids || '[]', request.query.categoryids || '[]', request.query.offlinesellerids || '[]',
					request.query.onlinesellerids || '[]', request.query.sortby, request.query.searchvalue, request))
				.code(200);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static updateNotificationStatus(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized'
			});
		} else if (user && !request.pre.forceUpdate) {
			notificationAdaptor.updateNotificationStatus(user, request.payload.notificationIds).then((count) => {
				console.log("UPDATE COUNT: ", count);

				reply({status: true, forceUpdate: request.pre.forceUpdate}).code(201);
			}).catch((err) => {
				reply({status: false, forceUpdate: request.pre.forceUpdate}).code(500);
			});
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static getMailbox(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (!request.pre.forceUpdate && user) {
			reply(notificationAdaptor.retrieveNotifications(user, request))
				.code(200);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static notifyUser(request, reply) {
		const payload = request.payload || {userId: '', data: {title: '', description: ''}};
		notificationAdaptor.notifyUser(payload.userId || '', payload.data, reply);
	}
}

module.exports = DashboardController;
