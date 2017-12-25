/*jshint esversion: 6 */
'use strict';

import NotificationAdaptor from '../Adaptors/notification';
import EHomeAdaptor from '../Adaptors/ehome';
import DashboardAdaptor from '../Adaptors/dashboard';
import UserAdaptor from '../Adaptors/user';
import shared from '../../helpers/shared';

let dashboardAdaptor;
let eHomeAdaptor;
let notificationAdaptor;
let userAdaptor;

class DashboardController {
	constructor(modal) {
		dashboardAdaptor = new DashboardAdaptor(modal);
    eHomeAdaptor = new EHomeAdaptor(modal);
		notificationAdaptor = new NotificationAdaptor(modal);
    userAdaptor = new UserAdaptor(modal);
	}

	static getDashboard(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
      return userAdaptor.isUserValid(user).then((isValid) => {
        if (isValid) {
          return reply(dashboardAdaptor.retrieveDashboardResult(user, request)).
              code(200);
        }

        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      });
		} else if (!user) {
      return reply({
        status: false,
        message: 'Token Expired or Invalid',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
		} else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
		}
	}

	static getEHome(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (user && !request.pre.forceUpdate) {
      return userAdaptor.isUserValid(user).then((isValid) => {
        if (isValid) {
          return reply(eHomeAdaptor.prepareEHomeResult(user, request)).
              code(200);
        }

        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      });
		} else if (!user) {
      return reply({
        status: false,
        message: 'Token Expired or Invalid',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
		} else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
		}
	}

	static getProductsInCategory(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
      return reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
      return userAdaptor.isUserValid(user).then((isValid) => {
        if (isValid) {
          return reply(
              eHomeAdaptor.prepareProductDetail(user, request.params.id,
          request.query.subCategoryId,
					/* request.query.pageno, */
					request.query.brandids || '[]', request.query.categoryids || '[]', request.query.offlinesellerids || '[]',
					request.query.onlinesellerids || '[]', request.query.sortby, request.query.searchvalue, request))
				.code(200);
        }

        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      });
		} else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
		}
	}

	static updateNotificationStatus(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
      return reply({
				status: false,
				message: 'Unauthorized'
			});
		} else { //if (user && !request.pre.forceUpdate) {
      return userAdaptor.isUserValid(user).then((isValid) => {
        if (isValid) {
          return notificationAdaptor.updateNotificationStatus(user,
              request.payload.notificationIds).then((count) => {

            return reply({status: true}).code(201); //, forceUpdate: request.pre.forceUpdate}).code(201);
          }).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
            return reply({status: false}).code(500); //, forceUpdate: request.pre.forceUpdate}).code(500);
          });
        }

        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      });
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

      return userAdaptor.isUserValid(user).then((isValid) => {
        if (isValid) {
          return reply(
              notificationAdaptor.retrieveNotifications(user, request)).
              code(200);
        }

        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.mobile_no} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Token Expired or Invalid',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      });
		} else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
		}
	}

	static notifyUser(request, reply) {
		const payload = request.payload || {userId: '', data: {title: '', description: ''}};
		notificationAdaptor.notifyUser(payload.userId || '', payload.data, reply);
	}
}

export default DashboardController;
