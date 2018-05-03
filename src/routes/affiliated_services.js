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

      route.push({
        method: 'GET',
        path: '/cities/{id}/categories',
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
          handler: controller.getAllCategory,
        },
      });

      route.push({
        method: 'GET',
        path: '/cities/{id}/providers',
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
          handler: controller.getAllProviders,
        },

      });

      route.push({
        method: 'GET',
        path: '/childservices/{id}',
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
          handler: controller.getChildServices,
        },

      });
    }
}