/*jshint esversion: 6 */
'use strict';

// create adapter for this controller
import AffiliatedServicesAdaptor from '../Adaptors/affiliatedServices';
import shared from '../../helpers/shared';

let modals;
let affiliatedServicesAdaptor;

export default class affiliatedServicesController {
  constructor(modal) {
    modals = modal;
    affiliatedServicesAdaptor = new AffiliatedServicesAdaptor(modals);
  }

  static getCities(request, reply) {

    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      return affiliatedServicesAdaptor.getCities({
        where: {},
      }).then((cities) => reply({
        status: true,
        cities,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message:'Unable to retrieve all cities data'
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

}