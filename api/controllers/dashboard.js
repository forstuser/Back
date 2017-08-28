/**
 * Created by arpit on 7/3/2017.
 */
const shared = require('../../helpers/shared');

const DashboardAdaptor = require('../Adaptors/dashboard');
const EHomeAdaptor = require('../Adaptors/ehome');

let dashboardAdaptor;
let ehomeAdaptor;

class DashboardController {
  constructor(modal) {
    dashboardAdaptor = new DashboardAdaptor(modal);
    ehomeAdaptor = new EHomeAdaptor(modal);
  }

  static getDashboard(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user) {
      reply(dashboardAdaptor.retrieveDashboardResult(user)).code(200);
    } else {
      reply({ message: 'Token Expired or Invalid' }).code(401);
    }
  }

  static getEHome(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user) {
      reply(ehomeAdaptor.prepareEHomeResult(user)).code(200);
    } else {
      reply({ message: 'Token Expired or Invalid' }).code(401);
    }
  }

  static getProductsInCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    reply(ehomeAdaptor
      .prepareProductDetail(user, request.params.id, request.query.categoryid, request.query.pageno))
      .code(200);
  }
}

module.exports = DashboardController;
