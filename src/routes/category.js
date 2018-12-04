import ControllerObject from '../api/controllers/category';

export function prepareCategoryRoutes(modal, routesObject, middleware) {
  const initController = new ControllerObject(modal);
  if (initController) {
    routesObject.push({
      method: 'GET',
      path: '/categories',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getCategories,
      },
    });
    routesObject.push({
      method: 'GET',
      path: '/{mode}/categories',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getCategories,
      },
    });
  }
}