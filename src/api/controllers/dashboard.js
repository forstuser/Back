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
let modals;

class DashboardController {
  constructor(modal) {
    dashboardAdaptor = new DashboardAdaptor(modal);
    eHomeAdaptor = new EHomeAdaptor(modal);
    notificationAdaptor = new NotificationAdaptor(modal);
    userAdaptor = new UserAdaptor(modal);
    modals = modal;
  }

  static async getDashboard(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response(
          await dashboardAdaptor.retrieveDashboardResult(user, request));
    } else if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getEHome(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const language = request.language;
    console.log(language);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response(
          await eHomeAdaptor.prepareEHomeResult(user, request, language)).
          code(200);
    } else if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getProductsInCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response(
          await eHomeAdaptor.prepareProductDetail({
            user,
            masterCategoryId: request.params.id,
            ctype: request.query.subCategoryId,
            brandIds: (request.query.brandids || '[]').split('[')[1].split(
                ']')[0].split(',').filter(Boolean),
            categoryIds: (request.query.categoryids ||
                '[]').split('[')[1].split(']')[0].split(',').filter(Boolean),
            offlineSellerIds: (request.query.offlinesellerids || '[]').split(
                '[')[1].split(']')[0].split(',').filter(Boolean),
            onlineSellerIds: (request.query.onlinesellerids || '[]').split(
                '[')[1].split(']')[0].split(',').filter(Boolean),
            sortBy: request.query.sortby,
            searchValue: request.query.searchvalue,
            request,
          })).code(200);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateNotificationStatus(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return notificationAdaptor.updateNotificationStatus(user,
          request.payload.notificationIds).then(() => {
        return reply.response({status: true}).code(201); //, forceUpdate: request.pre.forceUpdate}).code(201);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({status: false}).code(500); //, forceUpdate: request.pre.forceUpdate}).code(500);
      });
    }
  }

  static async getMailbox(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else if (!request.pre.forceUpdate && user) {
      return reply.response(
          await notificationAdaptor.retrieveNotifications(user, request)).
          code(200);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static notifyUser(request, reply) {
    const payload = request.payload ||
        {userId: '', data: {title: '', description: ''}};
    notificationAdaptor.notifyUser(payload.userId || '', payload.data, reply);
  }
}

export default DashboardController;
