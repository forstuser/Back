/*jshint esversion: 6 */
'use strict';

//accessoryRoute
export function accessoryRoute(
    varController, controller, route, appVersionHelper) {

  if (varController) {

    route.push({
      method: 'POST',
      path: '/booking/cancel',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.cancelBooking,
        validate: {
          payload: {
            'caseId': joi.number().required(),
            'reasonType': joi.number().min(1).max(7),
            'reason': joi.string().allow(null),
          },
        },
      },
    });

  }
}