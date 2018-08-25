import ControllerObject from '../api/controllers/upload';
import Path from 'path';

export function prepareUploadRoutes(modal, routeObject, middleware) {
  const initController = new ControllerObject(modal);
  if (initController) {
    /*Upload User Image*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/upload/selfie',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadUserImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
      },
    });

    /*Upload Product Image*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/products/{id}/images',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadProductImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
      },
    });

    /*Upload Wearable Image*/
    routeObject.push({
      method: 'POST',
      path: '/wearable/{id}/images',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadWearableImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
      },
    });

    /*Retrieve Wearable Image*/
    routeObject.push({
      method: 'GET',
      path: '/wearable/{id}/images/{image_code}',
      config: {
        handler: ControllerObject.retrieveWearableImage,
      },
    });

    /*Retrieve Product Image*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/products/{id}/images',
      config: {
        handler: ControllerObject.retrieveProductImage,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/products/{id}/images/{file_ref}/{file_type}',
      config: {
        handler: ControllerObject.retrieveProductImage,
      },
    });

    /*Retrieve Product Image*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/products/{id}/images/{file_ref}',
      config: {
        handler: ControllerObject.retrieveProductImage,
      },
    });

    /*Allow user to upload document*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/upload',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
        timeout: {
          socket: false,
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/upload/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
        timeout: {
          socket: false,
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/sellers/{id}/upload/{type}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadSellerFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
        timeout: {
          socket: false,
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{id}/upload/{type}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: ControllerObject.retrieveSellerImages,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/sellers/{id}/upload/{type}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: ControllerObject.retrieveSellerImagesForConsumer,
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/sellers/{id}/upload/{type}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: ControllerObject.deleteSellerImages,
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/sellers/{id}/details',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: ControllerObject.deleteSellerDetails,
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/sellers/{id}/details/{type}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: ControllerObject.deleteSellerDetails,
      },
    });

    /*Retrieve user job copies*/
    routeObject.push({
      method: 'GET',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        // auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveFiles,
      },
    });

    /*Allow user to delete job files*/
    routeObject.push({
      method: 'DELETE',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deleteFile,
      },
    });

    /*Retrieve User Image*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/{id}/images/{image_ref}',
      config: {
        // auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUserImage,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/customer/{id}/images',
      config: {
        // auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUserImageForSeller,
      },
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/images/{type}/{file_type}',
      config: {
        handler: ControllerObject.retrieveCategoryImage,
      },
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/offer/categories/{id}/images/{file_type}',
      config: {
        handler: ControllerObject.retrieveOfferCategoryImage,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/offer/categories/{id}/images',
      config: {
        handler: ControllerObject.retrieveOfferCategoryImage,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/offer/{offer_id}/banners',
      config: {
        handler: ControllerObject.retrieveOfferBannerImage,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/offer/{offer_id}/images/{index}',
      config: {
        handler: ControllerObject.retrieveSellerOfferImages,
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/offer/{offer_id}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: ControllerObject.uploadSellerOfferImages,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
        timeout: {
          socket: false,
        },
      },
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/accessory/{id}/images/{file_type}',
      config: {
        handler: ControllerObject.retrieveAccessoryCategoryImage,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/accessory/{id}/images',
      config: {
        handler: ControllerObject.retrieveAccessoryCategoryImage,
      },
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/images/{type}',
      config: {
        handler: ControllerObject.retrieveCategoryImage,
      },
    });
    /*Retrieve Calendar Item Image*/
    routeObject.push({
      method: 'GET',
      path: '/calendarservice/{id}/images/{file_type}',
      config: {
        handler: ControllerObject.retrieveCalendarItemImage,
      },
    });

    /*Retrieve Calendar Item Image*/
    routeObject.push({
      method: 'GET',
      path: '/calendarservice/{id}/images',
      config: {
        handler: ControllerObject.retrieveCalendarItemImage,
      },
    });
    /*Retrieve Brand images*/
    routeObject.push({
      method: 'GET',
      path: '/brands/{id}/images/{file_type}',
      config: {
        handler: ControllerObject.retrieveBrandImage,
      },
    });

    /*Retrieve Brand images*/
    routeObject.push({
      method: 'GET',
      path: '/brands/{id}/images',
      config: {
        handler: ControllerObject.retrieveBrandImage,
      },
    });

    /*Retrieve Provider images*/
    routeObject.push({
      method: 'GET',
      path: '/providers/{id}/images/{file_type}',
      config: {
        handler: ControllerObject.retrieveProviderImage,
      },
    });

    /*Retrieve Provider images*/
    routeObject.push({
      method: 'GET',
      path: '/providers/{id}/images',
      config: {
        handler: ControllerObject.retrieveProviderImage,
      },
    });

    /*Retrieve Know Item images*/
    routeObject.push({
      method: 'GET',
      path: '/knowitem/{id}/images',
      config: {
        handler: ControllerObject.retrieveKnowItemImage,
      },
    });
  }
}