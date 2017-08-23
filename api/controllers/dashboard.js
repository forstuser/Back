/**
 * Created by arpit on 7/3/2017.
 */
const shared = require('../../helpers/shared');

const DashboardAdaptor = require('../Adaptors/dashboard');

let dashboardAdaptor;

class DashboardController {
  constructor(modal) {
    dashboardAdaptor = new DashboardAdaptor(modal);
  }

  static getDashboard(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user) {
      reply(dashboardAdaptor.retrieveDashboardResult(user)).code(200);
    } else {
      reply({ message: 'Token Expired or Invalid' }).code(401);
    }
  }
}

module.exports = DashboardController;
