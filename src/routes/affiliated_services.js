/*jshint esversion: 6 */
'use strict';

//affiliate service route
export function prepareAffiliatedServiceRoute (varController, controller, route, appVersionHelper) {

    if (varController) {

        route.push({
            method: 'GET',
            path: '/cities',
            config: {
                auth: 'jwt',
                pre: [
                    {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
                    {
                        method: appVersionHelper.updateUserActiveStatus,
                        assign: 'userExist',
                    },
                ],
                handler: controller.getCities,
            },
        });

        route.push({
          method: 'GET',
          path:'/cities/{id}/services',
          config: {
            auth: 'jwt',
            pre : [
              {
                method : appVersionHelper.checkAppVersion,
                assign: 'forceUpdate'
              },
              {
                method: appVersionHelper.updateUserActiveStatus,
                assign: 'userExist'
              },
            ],
            handler : controller.getServices,
          }
        });



    }
}