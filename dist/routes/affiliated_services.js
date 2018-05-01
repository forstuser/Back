/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.prepareAffiliatedServiceRoute = prepareAffiliatedServiceRoute;
function prepareAffiliatedServiceRoute(varController, controller, route, appVersionHelper) {

    if (varController) {

        route.push({
            method: 'GET',
            path: '/cities',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: controller.getCities
            }
        });
    }
}