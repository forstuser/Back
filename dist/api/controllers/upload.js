'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fileType = require('file-type');

var _fileType2 = _interopRequireDefault(_fileType);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _s3fs = require('s3fs');

var _s3fs2 = _interopRequireDefault(_s3fs);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _job = require('../Adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _amcs = require('../Adaptors/amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _insurances = require('../Adaptors/insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _warranties = require('../Adaptors/warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _repairs = require('../Adaptors/repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _pucs = require('../Adaptors/pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fsImpl = new _s3fs2.default(_main2.default.AWS.S3.BUCKET, _main2.default.AWS.ACCESS_DETAILS);

const ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'rtf', 'xls', 'xlsx', 'png', 'bmp', 'jpg', 'jpeg', 'heif', 'heic'];

const categoryImageType = ['xxhdpi-small', 'xxhdpi'];

const isFileTypeAllowed = fileTypeData => {
  console.log('FILE TYPE DATA: ' + fileTypeData);
  if (fileTypeData) {
    let filetype = fileTypeData.toString().toLowerCase();
    // console.log(filetype);
    return ALLOWED_FILE_TYPES.indexOf(filetype) > -1;
  }
  console.log('HERE');
  return false;
};

const isFileTypeAllowedMagicNumber = buffer => {
  console.log('GOT BUFFER');
  const result = (0, _fileType2.default)(buffer);
  return ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1;
};

const getTypeFromBuffer = buffer => (0, _fileType2.default)(buffer);
let modals;
let userAdaptor;
let jobAdaptor;
let amcAdaptor;
let warrantyAdaptor;
let insuranceAdaptor;
let repairAdaptor;
let pucAdaptor;
let productAdaptor;

class UploadController {
  constructor(modal) {
    modals = modal;
    userAdaptor = new _user2.default(modals);
    jobAdaptor = new _job2.default(modals);
    amcAdaptor = new _amcs2.default(modals);
    insuranceAdaptor = new _insurances2.default(modals);
    warrantyAdaptor = new _warranties2.default(modals);
    repairAdaptor = new _repairs2.default(modals);
    pucAdaptor = new _pucs2.default(modals);
    productAdaptor = new _product2.default(modals);
  }

  static async uploadUserImage(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized'
        // forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.payload) {
      try {
        let userDetail = await modals.users.findOne({
          where: {
            id: user.id || user.ID
          }
        });
        userDetail = userDetail.toJSON();
        await fsImpl.unlink(userDetail.image_name);
        const fieldNameHere = request.payload.fieldNameHere;
        const fileData = fieldNameHere || request.payload.filesName;

        const name = fileData.hapi.filename;
        const file_type = name.split('.')[name.split('.').length - 1];
        const image_name = `active-${user.id || user.ID}-${new Date().getTime()}.${file_type}`;
        // const file = fs.createReadStream();
        await fsImpl.writeFile(image_name, fileData._data, { ContentType: _mimeTypes2.default.lookup(image_name) });

        await userAdaptor.updateUserDetail({ image_name }, { where: { id: user.id || user.ID } });
        return reply.response({
          status: true,
          message: 'Uploaded Successfully'
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Upload Failed',
          err
          // forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadProductImage(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized'
        // forceUpdate: request.pre.forceUpdate
      });
    } else if (request.payload) {
      try {
        const productResult = await modals.products.findOne({
          where: {
            id: request.params.id,
            user_id: user.id || user.ID
          }
        });
        if (productResult) {
          const file_ref = `${Math.random().toString(36).substr(2, 9)}${(user.id || user.ID).toString(36)}`;
          const productDetail = productResult.toJSON();
          const fieldNameHere = request.payload.fieldNameHere;
          const fileData = fieldNameHere || request.payload.filesName;
          const name = fileData.hapi.filename;
          const file_type = name.split('.')[name.split('.').length - 1];
          const fileName = `${productDetail.id}.${file_type}`;
          const fsImplProduct = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.PRODUCT_IMAGE}`, _main2.default.AWS.ACCESS_DETAILS);
          await fsImplProduct.writeFile(fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) });

          await productResult.updateAttributes({ file_type, file_ref });
          return reply.response({
            status: true,
            message: 'Uploaded Successfully',
            cImageURL: `/consumer/products/${request.params.id}/images/${file_ref}`
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid Product Id Upload Failed',
          err
          // forceUpdate: request.pre.forceUpdate
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Upload Failed',
          err
          // forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadWearableImage(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized'
        // forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.payload) {
      try {
        const wearableResult = await modals.wearables.findOne({
          where: {
            id: request.params.id,
            created_by: user.id || user.ID
          }
        });
        if (wearableResult) {
          const image_code = `${Math.random().toString(36).substr(2, 9)}${(user.id || user.ID).toString(36)}`;
          const wearableItem = wearableResult.toJSON();
          const fieldNameHere = request.payload.fieldNameHere;
          const fileData = fieldNameHere || request.payload.filesName;

          const name = fileData.hapi.filename;
          const file_type = name.split('.')[name.split('.').length - 1];
          const image_name = `${wearableItem.id}.${file_type}`;

          const fsImplProduct = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.WEARABLE_IMAGE}`, _main2.default.AWS.ACCESS_DETAILS);
          await fsImplProduct.writeFile(image_name, fileData._data, { ContentType: _mimeTypes2.default.lookup(image_name) });

          await wearableResult.updateAttributes({ image_name, image_code });
          wearableResult.image_link = `/wearable/${wearableResult.id}/images/${wearableResult.image_code}`;
          return reply.response({
            status: true,
            message: 'Uploaded Successfully',
            wearableResult
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid Wearable Id Upload Failed',
          err
          // forceUpdate: request.pre.forceUpdate
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Upload Failed',
          err
          // forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadFiles(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized'
      }).code(401);
    } else if (request.payload) {
      try {
        console.log('Request received to upload file by user_id ', user.id || user.ID);
        // if (!request.pre.forceUpdate && request.payload) {
        const fieldNameHere = request.payload.fieldNameHere;
        const fileData = fieldNameHere || request.payload.filesName || request.payload.file;

        let filteredFileData = fileData;
        if (filteredFileData) {
          if (Array.isArray(filteredFileData)) {
            filteredFileData = fileData.filter(datum => {
              const name = datum.hapi.filename;
              const file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
              if (file_type && !isFileTypeAllowed(file_type)) {
                return false;
              } else if (!file_type && !isFileTypeAllowedMagicNumber(datum._data)) {
                return false;
              }

              return true;
            });
          } else {
            const name = filteredFileData.hapi.filename;
            console.log('\n\n\n', name);
            const file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
            // console.log("OUTSIDE FILE ALLOWED: ", file_type);
            if (file_type && !isFileTypeAllowed(file_type)) {
              filteredFileData = [];
            } else if (!file_type && !isFileTypeAllowedMagicNumber(filteredFileData._data)) {
              filteredFileData = [];
            }
          }

          if (filteredFileData.length === 0) {
            console.log('No valid documents in request');
            return reply.response({ status: false, message: 'No valid documents in request' });
          } else {
            if (request.params && request.params.id) {
              console.log(`Request received has JOB ID ${request.params.id} to upload file by user_id ${user.id || user.ID}`);
              return await UploadController.retrieveJobCreateCopies({ user, fileData, reply, request });
            }

            console.log(`Request received to create new job to upload file by user_id ${user.id || user.ID}`);
            return await UploadController.createJobWithCopies({ user, fileData: filteredFileData, reply, request });
          }
          // } else {
          // 	reply.response({status: false, message: 'No File', forceUpdate: request.pre.forceUpdate}).code(400);
          // }
        } else {
          return reply.response({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
        }
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({ status: false, message: 'Unable to upload document' });
      }
    }
  }

  static async retrieveJobCreateCopies(parameters) {
    let { user, fileData, reply, request } = parameters;
    const type = request.query ? parseInt(request.query.type || '1') : 1;
    const itemId = request.query ? request.query.itemid : undefined;
    try {
      const result = await jobAdaptor.retrieveJobDetail(request.params.id, true);
      console.log(`JOB detail is as follow${JSON.stringify({ jobResult: result })}`);
      if (Array.isArray(fileData)) {
        console.log(`Request has multiple files`);
        return await UploadController.uploadArrayOfFile({
          requiredDetail: { fileData, user, result, type, itemId }, reply
        });
      } else {
        console.log(`Request has single file ${fileData.hapi.filename}`);
        const name = fileData.hapi.filename;
        const fileType = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
        if (fileType && !isFileTypeAllowed(fileType) || !fileType && !isFileTypeAllowedMagicNumber(fileData._data)) {
          return reply.response({ status: false, message: 'Data Upload Failed' });
        } else {
          return await UploadController.uploadSingleFile({
            requiredDetail: { fileData, result, fileType, user, type, itemId },
            reply
          });
        }
      }
    } catch (err) {
      console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({ status: false, message: 'Upload Failed', err }); // , forceUpdate: request.pre.forceUpdate});
    }
  }

  static async createJobWithCopies(parameters) {
    let { user, fileData, reply, request } = parameters;
    const user_id = user.id || user.ID;
    let user_status = 8,
        admin_status = 4;
    try {
      const result = await jobAdaptor.createJobs({
        job_id: `${Math.random().toString(36).substr(2, 9)}${user_id.toString(36)}`,
        user_id, updated_by: user_id, uploaded_by: user_id, user_status,
        admin_status, comments: request.query ? request.query.productId ? `This job is sent for product id ${request.query.productId}` : request.query.productName ? `This job is sent for product name ${request.query.productName}` : '' : ``
      });
      const type = request.query ? parseInt(request.query.type || '1') : 1;
      const itemId = request.query ? request.query.itemid : undefined;
      const productId = request.query ? request.query.productid : undefined;
      result.copies = [];
      if (Array.isArray(fileData)) {
        return await UploadController.uploadArrayOfFile({
          requiredDetail: { fileData, user, result, type, itemId, productId },
          reply
        });
      } else {
        const name = fileData.hapi.filename;
        const fileType = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;

        if (fileType && !isFileTypeAllowed(fileType) || !fileType && !isFileTypeAllowedMagicNumber(fileData._data)) {
          return reply.response({ status: false, message: 'Data Upload Failed' });
        } else {
          return await UploadController.uploadSingleFile({
            requiredDetail: {
              fileData, result, fileType, user, type,
              itemId, productId
            }, reply
          });
        }
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({ status: false, message: 'Upload Failed', err }); // , forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadSingleFile(parameters) {
    console.log('Single File Upload');
    let { requiredDetail, reply } = parameters;
    const user = requiredDetail.user;
    const fileData = requiredDetail.fileData;
    const jobResult = requiredDetail.result;
    const type = requiredDetail.type;
    let file_type = requiredDetail.fileType;
    const fileTypeData = getTypeFromBuffer(fileData._data);
    file_type = file_type ? file_type.toString() : fileTypeData.ext;
    const file_name = `${user.id || user.ID}-${jobResult.copies.length + 1}.${file_type}`;
    try {
      await fsImpl.writeFile(`jobs/${jobResult.job_id}/${file_name}`, fileData._data, { ContentType: _mimeTypes2.default.lookup(file_name) || 'image/jpeg' });
      const job_id = jobResult.id;
      const updated_by = user.id || user.ID;
      const jobCopyDetail = {
        job_id, file_name, type, file_type, status_type: 6, updated_by
      };
      let copyData = [await jobAdaptor.createJobCopies(jobCopyDetail)];
      await modals.users.findById(updated_by);
      UploadController.notifyTeam(user, jobResult);
      let productItemResult;
      const productId = requiredDetail.productId || jobResult.productId;
      if (type && productId) {
        productItemResult = UploadController.createProductItems({
          type, jobId: job_id, user, productId,
          itemId: requiredDetail.itemId, copies: copyData.map(copyItem => ({
            copyId: copyItem.id,
            copyUrl: `/jobs/${job_id}/files/${copyItem.id}`,
            file_type: copyItem.file_type,
            jobId: job_id, copyName: file_name
          }))
        });
      }
      return await UploadController.uploadResponse({
        jobResult: jobResult,
        copyData: copyData,
        productItemResult: productItemResult,
        type: type,
        reply: reply
      });
    } catch (err) {
      console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({ status: false, message: 'Upload Failed', err }); //forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadArrayOfFile(parameters) {
    console.log('Multiple File Upload');
    try {
      let { requiredDetail, reply } = parameters;
      let jobCopies;
      const fileNames = [];
      const fileTypes = [];
      const fileTypeDataArray = [];
      const user = requiredDetail.user;
      const fileData = requiredDetail.fileData;
      const jobResult = requiredDetail.result;
      const type = requiredDetail.type;
      const fileUploadPromises = fileData.map(async (elem, index) => {
        index = jobResult.copies.length + index;
        const name = elem.hapi.filename;
        const file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
        const fileTypeData = getTypeFromBuffer(elem._data);
        const fileName = `${user.id || user.ID}-${index + 1}.${file_type ? file_type.toString() : fileTypeData.ext}`;

        fileNames.push(fileName);
        fileTypes.push(file_type);
        fileTypeDataArray.push(fileTypeData);
        // const file = fs.createReadStream();
        return await fsImpl.writeFile(`jobs/${jobResult.job_id}/${fileName}`, elem._data, { ContentType: _mimeTypes2.default.lookup(fileName) || 'image/jpeg' });
      });
      const fileResult = await Promise.all(fileUploadPromises);
      const promisedQuery = [];
      const jobPromise = fileResult.map((elem, index) => {
        const jobCopyDetail = {
          job_id: jobResult.id,
          file_name: fileNames[index],
          file_type: fileTypes[index] ? fileTypes[index].toString() : fileTypeDataArray[index].ext,
          status_type: 6,
          updated_by: user.id || user.ID,
          type
        };
        return jobAdaptor.createJobCopies(jobCopyDetail);
      });

      promisedQuery.push(Promise.all(jobPromise));
      promisedQuery.push(modals.users.findById(user.id || user.ID));
      // if (promisedQuery.length === Object.keys(fileData).length) {
      const billResult = await Promise.all(promisedQuery);
      jobCopies = billResult[0];
      const userResult = billResult[billResult.length - 1];

      UploadController.notifyTeam(user, jobResult);
      const productId = requiredDetail.productId || jobResult.productId;
      let productItemResult;
      if (type && productId) {
        productItemResult = await UploadController.createProductItems({
          type, jobId: jobResult.id, user, productId,
          itemId: requiredDetail.itemId, copies: jobCopies.map(copyItem => ({
            copyId: copyItem.id,
            copyUrl: `/jobs/${copyItem.job_id}/files/${copyItem.id}`,
            file_type: copyItem.file_type,
            jobId: copyItem.job_id,
            copyName: copyItem.file_name
          }))
        });
      }
      return await UploadController.uploadResponse({
        jobResult: jobResult,
        copyData: jobCopies,
        productItemResult: productItemResult,
        type: type,
        reply: reply
      });
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Upload Failed',
        err: JSON.stringify(err)
        // forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async uploadResponse(parameters) {
    let { jobResult, copyData, productItemResult, type, reply } = parameters;
    const replyResult = {
      status: true,
      job_id: jobResult.id,
      message: 'Uploaded Successfully',
      billResult: copyData
    };
    if (productItemResult) {
      replyResult.product = productItemResult[1];
      switch (type) {
        case 2:
          {
            replyResult.amc = productItemResult[0];
            break;
          }
        case 3:
          {
            replyResult.insurance = productItemResult[0];
            break;
          }
        case 4:
          {
            replyResult.repair = productItemResult[0];
            break;
          }
        case 5:
          {
            replyResult.warranty = productItemResult[0];
            break;
          }
        case 6:
          {
            replyResult.warranty = productItemResult[0];
            break;
          }
        case 7:
          {
            replyResult.puc = productItemResult[0];
            break;
          }
        case 8:
          {
            replyResult.warranty = productItemResult[0];
            break;
          }
        default:
          {
            replyResult.product = productItemResult[0];
            break;
          }
      }
    }

    return reply.response(replyResult);
  }

  static async createProductItems(parameters) {
    let { type, jobId, user, productId, itemId, copies } = parameters;
    const productItemPromise = [];
    switch (type) {
      case 2:
        productItemPromise.push(!itemId ? amcAdaptor.createAMCs({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          copies
        }) : amcAdaptor.updateAMCs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          copies
        }));
        break;

      case 3:
        productItemPromise.push(!itemId ? insuranceAdaptor.createInsurances({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          copies
        }) : insuranceAdaptor.updateInsurances(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          copies
        }));
        break;

      case 4:
        productItemPromise.push(!itemId ? repairAdaptor.createRepairs({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          copies
        }) : repairAdaptor.updateRepairs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          copies
        }));
        break;
      case 5:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          warranty_type: 1,
          copies
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          warranty_type: 1,
          copies
        }));
        break;

      case 6:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          warranty_type: 3,
          copies
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          warranty_type: 3,
          copies
        }));
        break;
      case 7:
        productItemPromise.push(!itemId ? pucAdaptor.createPUCs({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          copies
        }) : pucAdaptor.updatePUCs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          copies
        }));
        break;
      case 8:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 8,
          warranty_type: 2,
          copies
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          warranty_type: 2,
          copies
        }));
        break;
      default:
        productItemPromise.push(productAdaptor.updateProduct(productId, {
          job_id: jobId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          copies
        }));
        break;
    }

    if (type > 1 && type < 8) {
      productItemPromise.push(productAdaptor.updateProduct(productId, {
        job_id: jobId,
        user_id: user.id || user.ID,
        updated_by: user.id || user.ID
      }));
    }

    return Promise.all(productItemPromise);
  }

  static notifyTeam(user, result) {
    if (process.env.NODE_ENV === 'production') {
      notificationAdaptor.sendMailOnUpload(_main2.default.MESSAGE, 'sagar@binbill.com;pranjal@binbill.com;anu.gupta@binbill.com', user, result.id);
    }
  }

  static async retrieveFiles(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const result = await modals.jobs.findById(request.params.id, {
          include: [{
            model: modals.jobCopies, as: 'copies',
            where: { id: request.params.copyid },
            required: true
          }]
        });
        if (result) {
          const fileResult = await fsImpl.readFile(Guid.isGuid(result.job_id) ? `${result.copies[0].file_name}` : `jobs/${result.job_id}/${result.copies[0].file_name}`);
          return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.bill_copy_name}`);
        } else {
          return reply.response({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate
          }).code(404);
        }
      } catch (err) {
        console.log(`Error on ${new Date()} while retrieving image is as follow: \n \n ${err}`);
        try {
          const fileResult = await fsImpl.readFile(`jobs/${result.job_id}/${result.copies[0].file_name}`);
          return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.bill_copy_name}`);
        } catch (err) {
          console.log(`Error on ${new Date()} while retrieving image is as follow: \n \n ${err}`);

          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: 1,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              err
            })
          }).catch(ex => console.log('error while logging on db,', ex));
          return reply.response({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate,
            err
          }).code(404);
        }
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  //Will required to be change if discard is required
  static async deleteFile(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized'
      }).code(401);
    } else {
      try {
        if (!request.pre.forceUpdate) {
          const itemId = request.query && request.query.itemid ? request.query.itemid : undefined;

          let [jobData, updateCopyStatus, count, productItemStatus] = await Promise.all([modals.jobs.findById(request.params.id, {
            include: [{ model: modals.jobCopies, as: 'copies', required: true }]
          }), modals.jobCopies.update({ status_type: 3, updated_by: user.id || user.ID }, {
            where: {
              id: request.params.copyid,
              job_id: request.params.id
            }
          }), modals.jobCopies.count({
            where: {
              id: { $ne: request.params.copyid },
              job_id: request.params.id,
              status_type: { $notIn: [3, 9] }
            }
          }), itemId ? UploadController.updateOrDeleteProductItems({
            type: parseInt(request.query.type || '1'),
            jobId: request.params.id,
            user, itemId, copyId: request.params.copyid
          }) : '']);
          let attributes = count > 0 ? {
            user_status: 8, admin_status: 4, ce_status: null,
            qe_status: null, updated_by: user.id || user.ID
          } : {
            user_status: 8, admin_status: 2, ce_status: null,
            qe_status: null, updated_by: user.id || user.ID
          };

          const jobItem = jobData.toJSON();
          const copiesData = jobItem.copies.find(copyItem => copyItem.id.toString() === request.params.copyid.toString());
          if (copiesData) {
            await fsImpl.unlink(copiesData.file_name);
            await fsImpl.unlink(`jobs/${result[0].job_id}/${copiesData.file_name}`);
          }
          if (jobItem.admin_status !== 5) {
            jobData.updateAttributes(attributes);
          }

          const deletionResponse = {
            status: true,
            message: productItemStatus[0] === true ? 'Product item deleted successfully' : productItemStatus[0] && itemId ? 'File deleted successfully from product item' : 'File deleted successfully',
            isProductItemDeleted: productItemStatus[0] === true,
            productItemCopiesCount: productItemStatus[0] && productItemStatus[0] !== true ? productItemStatus[0].copies.length : 0,
            productItem: productItemStatus[0] && productItemStatus[0] !== true ? productItemStatus[0] : undefined,
            forceUpdate: request.pre.forceUpdate
          };

          switch (parseInt(request.query.type || '1')) {
            case 2:
              deletionResponse.amc = deletionResponse.productItem;
              break;

            case 3:
              deletionResponse.insurance = deletionResponse.productItem;
              break;

            case 4:
              deletionResponse.repair = deletionResponse.productItem;
              break;
            case 5:
              deletionResponse.warranty = deletionResponse.productItem;
              break;

            case 6:
              deletionResponse.warranty = deletionResponse.productItem;
              break;
            case 7:
              deletionResponse.puc = deletionResponse.productItem;
              break;
            case 8:
              deletionResponse.warranty = deletionResponse.productItem;
              break;
            default:
              deletionResponse.product = deletionResponse.productItem;
              break;
          }

          return reply.response(deletionResponse);
        } else {
          return reply.response({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({ status: false, err, forceUpdate: request.pre.forceUpdate });
      }
    }
  }

  static async updateOrDeleteProductItems(parameters) {
    let { type, jobId, user, itemId, copyId } = parameters;
    const productItemPromise = [];
    const user_id = user.id || user.ID;
    switch (type) {
      case 2:
        productItemPromise.push(amcAdaptor.removeAMCs(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;

      case 3:
        productItemPromise.push(insuranceAdaptor.removeInsurances(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;

      case 4:
        productItemPromise.push(repairAdaptor.removeRepairs(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;
      case 5:
        productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;

      case 6:
        productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;
      case 7:
        productItemPromise.push(pucAdaptor.removePUCs(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;
      case 8:
        productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;
      default:
        productItemPromise.push(productAdaptor.removeProducts(itemId, copyId, { job_id: jobId, user_id, updated_by: user_id }));
        break;
    }

    return Promise.all(productItemPromise);
  }

  static async retrieveCategoryImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.CATEGORY_IMAGE}/${categoryImageType[request.params.type || 1]}${request.params.file_type ? `/${request.params.file_type}` : ''}`, _main2.default.AWS.ACCESS_DETAILS);
        const result = await modals.categories.findOne({ where: { category_id: request.params.id } });
        const fileResult = await fsImplCategory.readFile(result.category_image_name, 'utf8');
        return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.category_image_name}`);
      } catch (err) {
        console.log(`Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveOfferCategoryImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.CATEGORY_IMAGE}/offer${request.params.file_type ? `/${request.params.file_type}` : ''}`, _main2.default.AWS.ACCESS_DETAILS);
        let result = await modals.offerCategories.findOne({
          where: {
            id: request.params.id
          }
        });

        result = result ? result.toJSON() : {};
        const fileResult = await fsImplCategory.readFile(result.category_image_name, 'utf8');

        console.log(fileResult);
        return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.category_image_name}`);
      } catch (err) {
        console.log(`Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveProductImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplProduct = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.PRODUCT_IMAGE}${request.params.file_type ? `/${request.params.file_type}` : ''}`, _main2.default.AWS.ACCESS_DETAILS);

        const productResult = await modals.products.findOne({ where: { id: request.params.id } });
        if (productResult) {
          const productDetail = productResult.toJSON();
          const fileResult = await fsImplProduct.readFile(`${request.params.id}.${productDetail.file_type}`, 'utf8');
          return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${request.params.id}.${productDetail.file_type}`);
        }
      } catch (err) {
        console.log(`Error on ${new Date()} for user while retrieving product item image is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveWearableImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplProduct = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.WEARABLE_IMAGE}`, _main2.default.AWS.ACCESS_DETAILS);
        const wearableResult = await modals.wearables.findOne({ where: { id: request.params.id } });
        if (wearableResult) {
          const wearableDetail = wearableResult.toJSON();
          const fileResult = await fsImplProduct.readFile(`${wearableDetail.image_name}`, 'utf8');
          return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${wearableDetail.image_name}`);
        }
      } catch (err) {
        console.log(`Error on ${new Date()} for user while retrieving wearable item image is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveCalendarItemImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.CALENDAR_ITEM_IMAGE}${request.params.file_type ? `/${request.params.file_type}` : ''}`, _main2.default.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplCategory.readFile(`${request.params.id}.png`, 'utf8');
        return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(`Error on ${new Date()} for user while retrieving calendar item image is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveBrandImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.BRAND_IMAGE}${request.params.file_type ? `/${request.params.file_type}` : ''}`, _main2.default.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(`${request.params.id}.png`, 'utf8');
        return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(`Error on ${new Date()} retrieving brand image is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveProviderImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.PROVIDER_IMAGE}${request.params.file_type ? `/${request.params.file_type}` : ''}`, _main2.default.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(`${request.params.id}.png`, 'utf8');
        return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(`Error on ${new Date()} retrieving provider image is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveKnowItemImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.KNOW_ITEM_IMAGE}`, _main2.default.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(`${request.params.id}.png`, 'utf8');
        return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(`Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveUserImage(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized'
      }).code(401);
    } else {
      if (!request.pre.forceUpdate) {
        try {
          let userData = await userAdaptor.retrieveUserImageNameById(user);
          const fileResult = await fsImpl.readFile(userData.image_name);
          return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${userData.image_name}`);
        } catch (err) {
          console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
          const fsImplUser = new _s3fs2.default(`${_main2.default.AWS.S3.BUCKET}/${_main2.default.AWS.S3.USER_IMAGE}`, _main2.default.AWS.ACCESS_DETAILS);
          try {
            const fileResult = await fsImplUser.readFile(userData.image_name);
            return reply.response(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${fileResult.CopyName}`);
          } catch (err) {
            console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n ${JSON.stringify(err.toJSON())}`);

            modals.logs.create({
              api_action: request.method,
              api_path: request.url.pathname,
              log_type: 2,
              user_id: user.id || user.ID,
              log_content: JSON.stringify({
                params: request.params,
                query: request.query,
                headers: request.headers,
                payload: request.payload,
                err
              })
            }).catch(ex => console.log('error while logging on db,', ex));
            return reply.response({
              status: false,
              message: 'No Result Found',
              forceUpdate: request.pre.forceUpdate
            }).code(404);
          }
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }
}

exports.default = UploadController;