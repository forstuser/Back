import ControllerObject from '../api/controllers/brand';

export function prepareBrandRoutes(modal, routeObject, middleware) {
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {
    // Get brands
    routeObject.push({
      method: 'GET',
      path: '/brands',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getBrands,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/{mode}/brands',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getBrands,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/brandcenter',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getBrandASC,
      },
    });
  }
}