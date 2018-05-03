/*jshint esversion: 6 */
'use strict';

// affiliate service controller
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
          message: 'Unable to retrieve all cities data',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getAllCategory(request, reply) {

    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      return affiliatedServicesAdaptor.getAllCategory({
        city_id: request.params.id,
      }).then((categories) => reply({
        status: true,
        categories,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        console.log(err);
        return reply({
          status: false,
          message: 'Unable to retrieve all cities data',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getServices(request, reply) {

    //const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return affiliatedServicesAdaptor.getServices(
          {city_id: request.params.id}).then((services) => reply({
        status: true,
        services,
      }));
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getAllProviders(request, reply) {

    //  const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return affiliatedServicesAdaptor.getAllProviders(
          {city_id: request.params.id}).then((providers) => reply({
        status: true,
        providers,
      })).catch(console.log);
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getChildServices(request, reply) {

    // const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return affiliatedServicesAdaptor.getChildServices({
        ref_id: request.params.id,
      }).then((childServices) => reply({
        status: true,
        childServices,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        console.log(err);
        return reply({
          status: false,
          message: 'Unable to retrieve childServices data',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

// use this function template below to write controllers

  // static functionName(request, reply) {
  //
  //   const user = shared.verifyAuthorization(request.headers);
  //   if (request.pre.userExist && !request.pre.forceUpdate) {
  //
  //   } else {
  //     return shared.preValidation(request.pre, reply);
  //   }
  // }
}