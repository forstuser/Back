/**
 * Created by arpit on 7/3/2017.
 */
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
        if (user) {
            reply(dashboardAdaptor.retrieveDashboardResult(user)).code(200);
        } else {
            reply({message: 'Token Expired or Invalid'}).code(401);
        }
    }

    static getEHome(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (user) {
            reply(ehomeAdaptor.prepareEHomeResult(user)).code(200);
        } else {
            reply({message: 'Token Expired or Invalid'}).code(401);
        }
    }

    static getProductsInCategory(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            reply(ehomeAdaptor
                .prepareProductDetail(user, request.params.id, request.query.ctype,
                    /* request.query.pageno, */
                    request.query.brandids || '[]', request.query.categoryids || '[]', request.query.offlinesellerids || '[]',
                    request.query.onlinesellerids || '[]', request.query.sortby, request.query.searchvalue))
                .code(200);
        }
    }

    static updateNotificationStatus(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            notificationAdaptor.updateNotificationStatus(user, request.payload.notificationIds).then((count) => {
                console.log("UPDATE COUNT: ", count);

                reply({status: true}).code(201);
            }).catch((err) => {
                reply({status: false}).code(500);
            });
        }
    }

    static getMailbox(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            reply(notificationAdaptor.retrieveNotifications(user, request.query.pageno))
                .code(200);
        }
    }

    static notifyUser(request, reply) {
        const payload = request.payload || {userId: '', data: {title: '', description: ''}};
        notificationAdaptor.notifyUser(payload.userId || '', payload.data, reply);
    }
}

module.exports = DashboardController;
