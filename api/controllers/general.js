/*jshint esversion: 6 */
'use strict';

const NotificationAdaptor = require('../Adaptors/notification');

let contactModel;
let modals;

class GeneralController {
	constructor(modal) {
		contactModel = modal.contactUs;
		modals = modal;
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
			console.log({API_Logs: err});
			reply({status: false}).code(500);
		});
	}

    static retrieveFAQs(request, reply) {
        modals.faqs.findAll({
            where: {
                status_id:{
                    $ne: 3
                }
            }
        }).then((faq) => {
            reply({status: true, faq}).code(200);
        }).catch((err) => {
            console.log({API_Logs: err});
            reply({status: false}).code(200);
        });
    }
}

module.exports = GeneralController;