'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareUploadRoutes = prepareUploadRoutes;

var _upload = require('../api/controllers/upload');

var _upload2 = _interopRequireDefault(_upload);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareUploadRoutes(modal, routeObject, middleware) {
  const initController = new _upload2.default(modal);
  if (initController) {
    /*Upload User Image*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/upload/selfie',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadUserImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        }
      }
    });

    /*Upload Product Image*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/products/{id}/images',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadProductImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        }
      }
    });

    /*Upload Wearable Image*/
    routeObject.push({
      method: 'POST',
      path: '/wearable/{id}/images',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadWearableImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        }
      }
    });

    /*Retrieve Wearable Image*/
    routeObject.push({
      method: 'GET',
      path: '/wearable/{id}/images/{image_code}',
      config: {
        handler: _upload2.default.retrieveWearableImage
      }
    });

    /*Retrieve Product Image*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/products/{id}/images',
      config: {
        handler: _upload2.default.retrieveProductImage
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/products/{id}/images/{file_ref}/{file_type}',
      config: {
        handler: _upload2.default.retrieveProductImage
      }
    });

    /*Retrieve Product Image*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/products/{id}/images/{file_ref}',
      config: {
        handler: _upload2.default.retrieveProductImage
      }
    });

    /*Allow user to upload document*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/upload',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/upload/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/sellers/{id}/upload/{type}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadSellerFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/sellers/{id}/upload/{type}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadSellerFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{id}/upload/{type}/images/{index}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _upload2.default.retrieveSellerImages
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/assisted/{id}/images',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _upload2.default.retrieveAssistedTypeImages
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/sellers/{id}/upload/{type}/images/{index}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _upload2.default.retrieveSellerImagesForConsumer
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/sellers/{id}/upload/{type}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _upload2.default.deleteSellerImages
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/sellers/{id}/details',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _upload2.default.deleteSellerDetails
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/sellers/{id}/details/{type}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _upload2.default.deleteSellerDetails
      }
    });

    /*Retrieve user job copies*/
    routeObject.push({
      method: 'GET',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        // auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _upload2.default.retrieveFiles
      }
    });

    /*Allow user to delete job files*/
    routeObject.push({
      method: 'DELETE',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _upload2.default.deleteFile
      }
    });

    /*Retrieve User Image*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/{id}/images/{image_ref}',
      config: {
        // auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _upload2.default.retrieveUserImage
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/customer/{id}/images',
      config: {
        // auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _upload2.default.retrieveUserImageForSeller
      }
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/images/{type}/{file_type}',
      config: {
        handler: _upload2.default.retrieveCategoryImage
      }
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/offer/categories/{id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveOfferCategoryImage
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/offer/categories/{id}/images',
      config: {
        handler: _upload2.default.retrieveOfferCategoryImage
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/offer/{offer_id}/banners',
      config: {
        handler: _upload2.default.retrieveOfferBannerImage
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/offer/{offer_id}/images/{index}',
      config: {
        handler: _upload2.default.retrieveSellerOfferImages
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/offer/{offer_id}/images/{index}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadSellerOfferImages,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/assisted/{id}/profile',
      config: {
        handler: _upload2.default.retrieveAssistedProfile
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/assisted/{id}/documents/{index}',
      config: {
        handler: _upload2.default.retrieveAssistedDocument
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/assisted/{id}/profile/{index}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadSellerAssistedProfile,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/assisted/{id}/documents/{index}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadSellerAssistedDocuments,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/accessory/{id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveAccessoryCategoryImage
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/accessory/{id}/images',
      config: {
        handler: _upload2.default.retrieveAccessoryCategoryImage
      }
    });

    /*Retrieve Category images*/
    routeObject.push({
      method: 'GET',
      path: '/categories/{id}/images/{type}',
      config: {
        handler: _upload2.default.retrieveCategoryImage
      }
    });
    /*Retrieve Calendar Item Image*/
    routeObject.push({
      method: 'GET',
      path: '/calendarservice/{id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveCalendarItemImage
      }
    });

    /*Retrieve Calendar Item Image*/
    routeObject.push({
      method: 'GET',
      path: '/calendarservice/{id}/images',
      config: {
        handler: _upload2.default.retrieveCalendarItemImage
      }
    });
    /*Retrieve Brand images*/
    routeObject.push({
      method: 'GET',
      path: '/brands/{id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveBrandImage
      }
    });

    /*Retrieve Brand images*/
    routeObject.push({
      method: 'GET',
      path: '/brands/{id}/images',
      config: {
        handler: _upload2.default.retrieveBrandImage
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/sku/{id}/images',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src')
        },
        handler: _upload2.default.uploadSKUImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200
        },
        timeout: {
          socket: false
        }
      }
    });

    /*Retrieve SKU images*/
    routeObject.push({
      method: 'GET',
      path: '/skus/{id}/images',
      config: {
        handler: _upload2.default.retrieveSKUImage
      }
    });

    /*Retrieve SKU images*/
    routeObject.push({
      method: 'GET',
      path: '/skus/{id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveSKUImage
      }
    });

    /*Retrieve SKU images*/
    routeObject.push({
      method: 'GET',
      path: '/skus/{id}/measurements/{measurement_id}/images',
      config: {
        handler: _upload2.default.retrieveSKUImage
      }
    });

    /*Retrieve SKU images*/
    routeObject.push({
      method: 'GET',
      path: '/skus/{id}/measurements/{measurement_id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveSKUImage
      }
    });

    /*Retrieve Provider images*/
    routeObject.push({
      method: 'GET',
      path: '/providers/{id}/images/{file_type}',
      config: {
        handler: _upload2.default.retrieveProviderImage
      }
    });

    /*Retrieve Provider images*/
    routeObject.push({
      method: 'GET',
      path: '/providers/{id}/images',
      config: {
        handler: _upload2.default.retrieveProviderImage
      }
    });

    /*Retrieve Know Item images*/
    routeObject.push({
      method: 'GET',
      path: '/knowitem/{id}/images',
      config: {
        handler: _upload2.default.retrieveKnowItemImage
      }
    });
  }
}