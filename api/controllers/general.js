/*jshint esversion: 6 */
'use strict';

const NotificationAdaptor = require('../Adaptors/notification');

let contactModel;

class GeneralController {
	constructor(modal) {
		contactModel = modal.contactUs;
	}

	static contactUs(request, reply) {
        NotificationAdaptor.sendLinkOnMessage(request.payload.phone);
		contactModel.create({
			name: request.payload.name,
			phone: request.payload.phone,
			email: request.payload.email,
			message: request.payload.message
		}).then((data) => {
			reply({status: true}).code(201);
		}).catch((err) => {
			console.log(err);
			reply({status: false}).code(500);
		});
	}
}

module.exports = GeneralController;