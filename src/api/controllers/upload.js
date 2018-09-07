'use strict';

import fileType from 'file-type';
import mime from 'mime-types';
import S3FS from 's3fs';
import config from '../../config/main';
import shared from '../../helpers/shared';
import UserAdaptor from '../Adaptors/user';
import JobAdaptor from '../Adaptors/job';
import AMCAdaptor from '../Adaptors/amcs';
import InsuranceAdaptor from '../Adaptors/insurances';
import WarrantyAdaptor from '../Adaptors/warranties';
import RepairAdaptor from '../Adaptors/repairs';
import PUCAdaptor from '../Adaptors/pucs';
import ProductAdaptor from '../Adaptors/product';
import CategoryAdaptor from '../Adaptors/category';
import RegCertificateAdaptor from '../Adaptors/reg_certificates';
import FuelingAdaptor from '../Adaptors/refueling';
import Promise from 'bluebird';
import Guid from 'guid';
import SellerAdaptor from '../Adaptors/sellers';

const fsImpl = new S3FS(config.AWS.S3.BUCKET, config.AWS.ACCESS_DETAILS);

const ALLOWED_FILE_TYPES = [
  'txt', 'pdf', 'doc', 'docx',
  'rtf', 'xls', 'xlsx', 'png',
  'bmp', 'jpg', 'jpeg', 'heif', 'heic'];

const categoryImageType = ['xxhdpi-small', 'xxhdpi'];

const isFileTypeAllowed = fileTypeData => {
  console.log('FILE TYPE DATA: ' + fileTypeData);
  if (fileTypeData) {
    let filetype = fileTypeData.toString().toLowerCase();
    // console.log(filetype);
    return (ALLOWED_FILE_TYPES.indexOf(filetype) > -1);
  }
  console.log('HERE');
  return false;
};

const isFileTypeAllowedMagicNumber = buffer => {
  console.log('GOT BUFFER');
  const result = fileType(buffer);
  return (ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1);
};

const getTypeFromBuffer = buffer => fileType(buffer);
let modals, userAdaptor, jobAdaptor, amcAdaptor, warrantyAdaptor,
    insuranceAdaptor, repairAdaptor, pucAdaptor, productAdaptor, regCertAdaptor,
    fuelingAdaptor, sellerAdaptor, categoryAdaptor;

class UploadController {
  constructor(modal) {
    modals = modal;
    userAdaptor = new UserAdaptor(modals);
    jobAdaptor = new JobAdaptor(modals);
    amcAdaptor = new AMCAdaptor(modals);
    insuranceAdaptor = new InsuranceAdaptor(modals);
    warrantyAdaptor = new WarrantyAdaptor(modals);
    repairAdaptor = new RepairAdaptor(modals);
    pucAdaptor = new PUCAdaptor(modals);
    productAdaptor = new ProductAdaptor(modals);
    regCertAdaptor = new RegCertificateAdaptor(modals);
    fuelingAdaptor = new FuelingAdaptor(modals);
    sellerAdaptor = new SellerAdaptor(modals);
    categoryAdaptor = new CategoryAdaptor(modals);
  }

  static async uploadUserImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        // forceUpdate: request.pre.forceUpdate
      });
    } else if (request.payload) {
      try {
        let userDetail = await modals.users.findOne(
            {where: {id: user.id || user.ID}});
        userDetail = userDetail.toJSON();
        if (userDetail.image_name) {
          await fsImpl.unlink(userDetail.image_name);
        }

        const fieldNameHere = request.payload.fieldNameHere;
        const fileData = fieldNameHere || request.payload.filesName;

        const name = fileData.hapi.filename;
        const file_type = name.split('.')[name.split('.').length - 1];
        const image_name = `active-${user.id ||
        user.ID}-${new Date().getTime()}.${file_type}`;
        // const file = fs.createReadStream();
        await fsImpl.writeFile(image_name, fileData._data,
            {ContentType: mime.lookup(image_name)});

        await userAdaptor.updateUserDetail({image_name},
            {where: {id: user.id || user.ID}});
        return reply.response({
          status: true,
          message: 'Uploaded Successfully',
        });
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Upload Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response(
          {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadProductImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        // forceUpdate: request.pre.forceUpdate
      });
    } else if (request.payload) {
      let user_id = user.id || user.ID;
      try {
        const productResult = await modals.products.findOne(
            {where: {id: request.params.id, user_id}});
        if (productResult) {
          const file_ref = `${Math.random().toString(36).
              substr(2, 9)}${(user_id).toString(36)}`;
          const productDetail = productResult.toJSON();
          const fieldNameHere = request.payload.fieldNameHere;
          const fileData = fieldNameHere || request.payload.filesName;
          const name = fileData.hapi.filename;
          const file_type = name.split('.')[name.split('.').length - 1];
          const fileName = `${productDetail.id}.${file_type}`;
          const fsImplProduct = new S3FS(
              `${config.AWS.S3.BUCKET}/${config.AWS.S3.PRODUCT_IMAGE}`,
              config.AWS.ACCESS_DETAILS);
          await Promise.try(
              () => fsImplProduct.writeFile(fileName, fileData._data,
                  {ContentType: mime.lookup(fileName)}));

          await productResult.updateAttributes({file_type, file_ref});
          return reply.response({
            status: true,
            message: 'Uploaded Successfully',
            cImageURL: `/consumer/products/${request.params.id}/images/${file_ref}`,
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid Product Id Upload Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user_id} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Upload Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response(
          {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadWearableImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        // forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.payload) {
      try {
        const wearableResult = await modals.wearables.findOne({
          where: {
            id: request.params.id,
            created_by: user.id || user.ID,
          },
        });
        if (wearableResult) {
          const image_code = `${Math.random().toString(36).
              substr(2, 9)}${(user.id || user.ID).toString(36)}`;
          const wearableItem = wearableResult.toJSON();
          const fieldNameHere = request.payload.fieldNameHere;
          const fileData = fieldNameHere || request.payload.filesName;

          const name = fileData.hapi.filename;
          const file_type = name.split('.')[name.split('.').length - 1];
          const image_name = `${wearableItem.id}.${file_type}`;

          const fsImplProduct = new S3FS(
              `${config.AWS.S3.BUCKET}/${config.AWS.S3.WEARABLE_IMAGE}`,
              config.AWS.ACCESS_DETAILS);
          await fsImplProduct.writeFile(image_name, fileData._data,
              {ContentType: mime.lookup(image_name)});

          await wearableResult.updateAttributes({image_name, image_code});
          wearableResult.image_link = `/wearable/${wearableResult.id}/images/${wearableResult.image_code}`;
          return reply.response({
            status: true,
            message: 'Uploaded Successfully',
            wearableResult,
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid Wearable Id Upload Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Upload Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      }
    } else {
      return reply.response(
          {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
      }).code(401);
    } else if (request.payload) {
      try {
        console.log('Request received to upload file by user_id ', user.id ||
            user.ID);
        // if (!request.pre.forceUpdate && request.payload) {
        const fieldNameHere = request.payload.fieldNameHere;
        const fileData = fieldNameHere || request.payload.filesName ||
            request.payload.file;

        let filteredFileData = fileData;
        if (filteredFileData) {
          if (Array.isArray(filteredFileData)) {
            filteredFileData = fileData.filter((datum) => {
              const name = datum.hapi.filename;
              const file_type = (/[.]/.exec(name))
                  ? /[^.]+$/.exec(name) : undefined;
              return file_type && !isFileTypeAllowed(file_type) ? false :
                  !(!file_type && !isFileTypeAllowedMagicNumber(datum._data));
            });
          } else {
            const name = filteredFileData.hapi.filename;
            console.log('\n\n\n', name);
            const file_type = (/[.]/.exec(name)) ?
                /[^.]+$/.exec(name) : undefined;
            // console.log("OUTSIDE FILE ALLOWED: ", file_type);
            if (file_type && !isFileTypeAllowed(file_type)) {
              filteredFileData = [];
            } else if (!file_type &&
                !isFileTypeAllowedMagicNumber(filteredFileData._data)) {
              filteredFileData = [];
            }
          }

          if (filteredFileData.length === 0) {
            console.log('No valid documents in request');
            return reply.response(
                {status: false, message: 'No valid documents in request'});
          }

          if (request.params && request.params.id) {
            console.log(
                `Request received has JOB ID ${request.params.id} to upload file by user_id ${user.id ||
                user.ID}`);
            return await UploadController.retrieveJobCreateCopies(
                {user, fileData, reply, request});
          }

          console.log(
              `Request received to create new job to upload file by user_id ${user.id ||
              user.ID}`);
          return await UploadController.createJobWithCopies(
              {user, fileData: filteredFileData, reply, request});
          // } else {
          // 	reply.response({status: false, message: 'No File', forceUpdate: request.pre.forceUpdate}).code(400);
          // }
        } else {
          return reply.response(
              {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response(
            {status: false, message: 'Unable to upload document'});
      }
    }
  }

  static async uploadSellerFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.payload) {
      try {
        console.log('Request received to upload file by seller id ', user.id);
        // if (!request.pre.forceUpdate && request.payload) {
        const fieldNameHere = request.payload.fieldNameHere;
        let filteredFileData = fieldNameHere || request.payload.filesName ||
            request.payload.file;
        if (filteredFileData) {
          filteredFileData = Array.isArray(filteredFileData) ?
              filteredFileData : [filteredFileData];

          if (filteredFileData.length === 0) {
            console.log('No valid documents in request');
            return reply.response(
                {status: false, message: 'No valid documents in request'});
          }

          filteredFileData = filteredFileData.filter((datum) => {
            const name = datum.hapi.filename;
            const file_type = (/[.]/.exec(name))
                ? /[^.]+$/.exec(name) : undefined;
            return file_type && !isFileTypeAllowed(file_type) ? false :
                !(!file_type && !isFileTypeAllowedMagicNumber(datum._data));
          });
          const {id, type} = request.params || {};
          const {image_types, business_type} = request.query || {};
          console.log(
              `Request received for Shop ID ${request.params.id} to upload file by seller id ${user.id}`);
          return await UploadController.retrieveSellerUpdateDetails(
              {
                user, fileData: filteredFileData, reply, request,
                id, type, image_types, business_type,
              });
        } else {
          return reply.response(
              {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id} is as follow: \n \n ${err}`);

        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response(
            {status: false, message: 'Unable to upload document'});
      }
    }
  }

  static async retrieveJobCreateCopies(parameters) {
    let {user, fileData, reply, request} = parameters;
    const type = request.query ? parseInt(request.query.type || '1') : 1;
    const itemId = request.query ? request.query.itemid : undefined;
    try {
      const result = await jobAdaptor.retrieveJobDetail(request.params.id,
          true);
      console.log(
          `JOB detail is as follow${JSON.stringify({jobResult: result})}`);
      if (Array.isArray(fileData)) {
        console.log(`Request has multiple files`);
        return await UploadController.uploadArrayOfFile({
          requiredDetail: {fileData, user, result, type, itemId}, reply,
        });
      }
      console.log(`Request has single file ${fileData.hapi.filename}`);
      const name = fileData.hapi.filename;
      const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
      if ((fileType && !isFileTypeAllowed(fileType)) || (!fileType &&
          !isFileTypeAllowedMagicNumber(fileData._data))) {
        return reply.response(
            {status: false, message: 'Data Upload Failed'});
      } else {
        return await UploadController.uploadSingleFile({
          requiredDetail: {fileData, result, fileType, user, type, itemId},
          reply,
        });
      }
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
    }
  }

  static async createJobWithCopies(parameters) {
    let {user, fileData, reply, request} = parameters;
    const user_id = user.id || user.ID;
    let user_status = 8, admin_status = 4;
    try {
      const result = await jobAdaptor.createJobs({
        job_id: `${Math.random().toString(36).substr(2, 9)}${(user_id).toString(
            36)}`,
        user_id, updated_by: user_id, uploaded_by: user_id, user_status,
        admin_status, comments: request.query ? request.query.productId ?
            `This job is sent for product id ${request.query.productId}` :
            request.query.productName ?
                `This job is sent for product name ${request.query.productName}` :
                '' : ``,
      });
      const type = request.query ? parseInt(request.query.type || '1') : 1;
      const itemId = request.query ? request.query.itemid : undefined;
      const productId = request.query ? request.query.productid : undefined;
      result.copies = [];
      if (Array.isArray(fileData)) {
        return await UploadController.uploadArrayOfFile({
          requiredDetail: {fileData, user, result, type, itemId, productId},
          reply,
        });
      } else {
        const name = fileData.hapi.filename;
        const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;

        if ((fileType && !isFileTypeAllowed(fileType)) || (!fileType &&
            !isFileTypeAllowedMagicNumber(fileData._data))) {
          return reply.response({status: false, message: 'Data Upload Failed'});
        } else {
          return await UploadController.uploadSingleFile({
            requiredDetail: {
              fileData, result, fileType, user, type,
              itemId, productId,
            }, reply,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
    }
  }

  static async retrieveSellerUpdateDetails(parameters) {
    let {user, fileData, reply, request, id, type, image_types, business_type} = parameters;
    try {
      const seller_data = await sellerAdaptor.retrieveSellerDetail(
          {where: {id, user_id: user.id}});
      if (!seller_data) {
        return reply.response({
          status: false,
          message: 'Shop is not linked with you.',
        });
      }
      console.log(`Request has multiple files`);
      return await UploadController.uploadSellerFileItems({
        requiredDetail: {
          fileData, user, seller_data, type,
          image_types, business_type,
        }, reply, request,
      });
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadSingleFile(parameters) {
    console.log('Single File Upload');
    let {requiredDetail, reply} = parameters;
    const user = requiredDetail.user;
    const fileData = requiredDetail.fileData;
    const jobResult = requiredDetail.result;
    const type = requiredDetail.type;
    let file_type = requiredDetail.fileType;
    const fileTypeData = getTypeFromBuffer(fileData._data);
    file_type = (file_type) ? file_type.toString() : fileTypeData.ext;
    const file_name = `${user.id || user.ID}-${jobResult.copies.length +
    1}.${file_type}`;
    try {
      await fsImpl.writeFile(`jobs/${jobResult.job_id}/${file_name}`,
          fileData._data,
          {ContentType: mime.lookup(file_name) || 'image/jpeg'});
      const job_id = jobResult.id;
      const updated_by = user.id || user.ID;
      const jobCopyDetail = {
        job_id, file_name, type, file_type, status_type: 6, updated_by,
      };
      let copyData = [await jobAdaptor.createJobCopies(jobCopyDetail)];
      await modals.users.findById(updated_by);
      UploadController.notifyTeam(user, jobResult);
      let productItemResult;
      let {productId, category_id, main_category_id, id, cashback_job_id, online_order} = jobResult;
      productId = requiredDetail.productId || productId;
      if (type && productId) {
        productItemResult = await UploadController.createProductItems({
          type,
          jobId: job_id,
          user,
          productId,
          category_id,
          main_category_id,
          online_order,
          cashback_job_id,
          itemId: requiredDetail.itemId,
          copies: copyData.map((copyItem) => ({
            copyId: copyItem.id,
            copyUrl: `/jobs/${job_id}/files/${copyItem.id}`,
            file_type: copyItem.file_type,
            jobId: job_id, copyName: file_name,
          })),
        });
      }
      return await UploadController.uploadResponse(
          {jobResult, copyData, productItemResult, type, reply});
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false, message: 'Upload Failed', err}); //forceUpdate: request.pre.forceUpdate});
    }
  }

  static async uploadArrayOfFile(parameters) {
    console.log('Multiple File Upload');
    try {
      let {requiredDetail, reply} = parameters;
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
        const file_type = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
        const fileTypeData = getTypeFromBuffer(elem._data);
        const fileName = `${user.id || user.ID}-${index +
        1}.${(file_type) ? file_type.toString() : fileTypeData.ext}`;

        fileNames.push(fileName);
        fileTypes.push(file_type);
        fileTypeDataArray.push(fileTypeData);
        // const file = fs.createReadStream();
        return await fsImpl.writeFile(`jobs/${jobResult.job_id}/${fileName}`,
            elem._data,
            {ContentType: mime.lookup(fileName) || 'image/jpeg'});
      });
      const fileResult = await Promise.all(fileUploadPromises);
      const promisedQuery = [];
      const jobPromise = fileResult.map((elem, index) => {
        const jobCopyDetail = {
          job_id: jobResult.id,
          file_name: fileNames[index],
          file_type: (fileTypes[index])
              ? fileTypes[index].toString()
              : fileTypeDataArray[index].ext,
          status_type: 6,
          updated_by: user.id || user.ID,
          type,
        };
        return jobAdaptor.createJobCopies(jobCopyDetail);
      });

      promisedQuery.push(Promise.all(jobPromise));
      promisedQuery.push(modals.users.findById(user.id || user.ID));
      // if (promisedQuery.length === Object.keys(fileData).length) {
      const billResult = await Promise.all(promisedQuery);
      jobCopies = billResult[0];
      UploadController.notifyTeam(user, jobResult);
      let {productId, category_id, main_category_id, id, cashback_job_id} = jobResult;
      productId = requiredDetail.productId || productId;
      let productItemResult;
      if (type && productId) {
        productItemResult = await UploadController.createProductItems({
          type, jobId: id, user, productId, category_id, main_category_id,
          itemId: requiredDetail.itemId, cashback_job_id,
          copies: jobCopies.map((copyItem) => ({
            copyId: copyItem.id,
            copyUrl: `/jobs/${copyItem.job_id}/files/${copyItem.id}`,
            file_type: copyItem.file_type,
            jobId: copyItem.job_id,
            copyName: copyItem.file_name,
          })),
        });
      }
      return await UploadController.uploadResponse({
        jobResult, copyData: jobCopies, productItemResult,
        type, reply,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Upload Failed',
        err: JSON.stringify(err),
        // forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async uploadSellerFileItems(parameters) {
    console.log('Multiple File Upload');
    let {requiredDetail, reply, request} = parameters;
    let {user, fileData, seller_data, type, image_types, business_type} = requiredDetail;
    try {
      const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
      const fileNames = [];
      const indexes = [];
      const fileTypes = [];
      const fileTypeDataArray = [];
      const fileUploadPromises = fileData.map(async (elem, index) => {
        const name = elem.hapi.filename;
        const file_type = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
        const fileTypeData = getTypeFromBuffer(elem._data);
        const file_index = `${Math.random().toString(36).
            substr(2, 9)}${(user.id).toString(36)}`;
        const fileName = `${user.id}-${file_index}.${(file_type) ?
            file_type.toString() : fileTypeData.ext}`;
        indexes.push(file_index);
        fileNames.push(fileName);
        fileTypes.push(file_type);
        fileTypeDataArray.push(fileTypeData);
        // const file = fs.createReadStream();
        return await fsImpl.writeFile(
            `sellers/${seller_data.id}/${seller_image_types[type.toString() ===
            '5' ? 3 : type]}/${fileName}`, elem._data,
            {ContentType: mime.lookup(fileName) || 'image/jpeg'});
      });
      const fileResult = await Promise.all(fileUploadPromises);
      console.log('\n\n\n\n', JSON.stringify({seller_data}));
      let {seller_details} = seller_data;
      seller_details = seller_details || (type.toString() === '1' ?
          {basic_details: {documents: []}} : type.toString() === '2' ?
              {
                basic_details: {documents: []},
                business_details: {documents: []},
              } :
              {
                basic_details: {documents: []},
                business_details: {documents: []},
                assisted_type_images: [],
                offers: [],
              });
      console.log('\n\n\n\n', JSON.stringify({seller_details}));
      const basic_details = seller_details.basic_details || {documents: []};
      const business_details = seller_details.business_details ||
          {documents: []};
      seller_details.assisted_type_images = seller_details.assisted_type_images ||
          [];
      seller_details.offers = seller_details.offers || [];
      basic_details.documents = basic_details.documents || [];
      business_details.documents = business_details.documents || [];
      image_types = (image_types || '').split(',');
      let file_details = [];
      fileResult.forEach((elem, index) => {
        if (type.toString() === '1') {
          basic_details.documents.push({
            file_name: fileNames[index],
            index: indexes[index],
            file_type: (fileTypes[index])
                ? fileTypes[index].toString()
                : fileTypeDataArray[index].ext,
            updated_by: user.id, type,
          });
          seller_details.basic_details = basic_details;
        } else if (type.toString() === '2') {
          business_details.documents.push({
            file_name: fileNames[index],
            index: indexes[index],
            file_type: (fileTypes[index])
                ? fileTypes[index].toString()
                : fileTypeDataArray[index].ext,
            updated_by: user.id, type, image_type: image_types[index],
          });
          business_details.business_type = business_type;
          seller_details.business_details = business_details;
          seller_data.is_onboarded = true;
        } else if (type.toString() === '3') {
          const file_detail = {
            file_name: fileNames[index],
            index: indexes[index],
            file_type: (fileTypes[index])
                ? fileTypes[index].toString()
                : fileTypeDataArray[index].ext,
            updated_by: user.id, type, image_type: image_types[index],
          };
          file_details = file_detail;
          seller_details.assisted_type_images.push(file_detail);
        } else if (type.toString() === '4') {
          const file_detail = {
            file_name: fileNames[index],
            index: indexes[index],
            file_type: (fileTypes[index])
                ? fileTypes[index].toString()
                : fileTypeDataArray[index].ext,
            updated_by: user.id, type, image_type: image_types[index],
          };
          file_details = file_detail;
          seller_details.offers.push(file_detail);
        } else if (type.toString() === '5') {
          const file_detail = {
            file_name: fileNames[index],
            file_type: (fileTypes[index])
                ? fileTypes[index].toString()
                : fileTypeDataArray[index].ext,
            index: indexes[index],
            updated_by: user.id, type, image_type: image_types[index],
          };
          file_details = file_detail;
          seller_details.assisted_type_images.push(file_detail);
        }
      });
      const seller = await sellerAdaptor.retrieveOrUpdateSellerDetail(
          {where: {id: seller_data.id}},
          JSON.parse(JSON.stringify({
            is_onboarded: type.toString() === '2' ? true : undefined,
            seller_details,
          })), false);
      return reply.response(JSON.parse(JSON.stringify({
        status: true, message: 'Upload Successful',
        seller: type.toString() === '1' || type.toString() === '2' ?
            seller : undefined, file_details,
        // forceUpdate: request.pre.forceUpdate
      })));
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Upload Failed',
        err: JSON.stringify(err),
        // forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async uploadResponse(parameters) {
    let {jobResult, copyData, productItemResult, type, reply} = parameters;
    const replyResult = {
      status: true,
      job_id: jobResult.id,
      message: 'Uploaded Successfully',
      billResult: copyData,
    };
    if (productItemResult) {
      replyResult.product = productItemResult[1];
      switch (type) {
        case 2: {
          replyResult.amc = productItemResult[0];
          break;
        }
        case 3: {
          replyResult.insurance = productItemResult[0];
          break;
        }
        case 4: {
          replyResult.repair = productItemResult[0];
          break;
        }
        case 5: {
          replyResult.warranty = productItemResult[0];
          break;
        }
        case 6: {
          replyResult.warranty = productItemResult[0];
          break;
        }
        case 7: {
          replyResult.puc = productItemResult[0];
          break;
        }
        case 8: {
          replyResult.warranty = productItemResult[0];
          break;
        }
        case 9: {
          replyResult.rc = productItemResult[0];
          break;
        }
        case 10: {
          replyResult.fuel_details = productItemResult[0];
          break;
        }
        case 11: {
          replyResult.accessories = productItemResult[0];
          break;
        }
        default : {
          replyResult.product = productItemResult[0];
          break;
        }
      }
    }

    return reply.response(replyResult);
  }

  static async createProductItems(parameters) {
    let {type, jobId: job_id, user, productId: product_id, itemId, copies, category_id, main_category_id, cashback_job_id, online_order} = parameters;
    const productItemPromise = [];
    let user_id = user.id || user.ID;
    switch (type) {
      case 2:
        productItemPromise.push(!itemId ? amcAdaptor.createAMCs({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8,
        }) : amcAdaptor.updateAMCs(itemId, {
          job_id, product_id, user_id, copies,
          updated_by: user_id,
        }));
        break;

      case 3:
        productItemPromise.push(!itemId ? insuranceAdaptor.createInsurances({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8,
        }) : insuranceAdaptor.updateInsurances(itemId, {
          job_id, product_id, copies, user_id,
          updated_by: user_id,
        }));
        break;

      case 4:
        productItemPromise.push(!itemId ? repairAdaptor.createRepairs({
          job_id, product_id, copies, user_id,
          updated_by: user_id, status_type: 8,
        }) : repairAdaptor.updateRepairs(itemId, {
          job_id, product_id, user_id, copies,
          updated_by: user_id,
        }));
        break;
      case 5 :
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8, warranty_type: 1,
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id, product_id, copies, user_id,
          updated_by: user_id, warranty_type: 1,
        }));
        break;

      case 6:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8, warranty_type: 3,
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id, product_id, user_id, copies,
          updated_by: user_id, warranty_type: 3,
        }));
        break;
      case 7:
        productItemPromise.push(!itemId ? pucAdaptor.createPUCs({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8,
        }) : pucAdaptor.updatePUCs(itemId, {
          job_id, copies, product_id, user_id,
          updated_by: user_id,
        }));
        break;
      case 8:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id, product_id, copies, user_id,
          updated_by: user_id, status_type: 8, warranty_type: 2,
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id, product_id, user_id, copies,
          updated_by: user_id, warranty_type: 2,
        }));
        break;
      case 9:
        productItemPromise.push(!itemId ? regCertAdaptor.createRegCerts({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8,
        }) : regCertAdaptor.updateRegCerts(itemId, {
          job_id, product_id, user_id,
          updated_by: user_id, copies,
        }));
        break;
      case 10:
        productItemPromise.push(!itemId ? fuelingAdaptor.createRefuelings({
          job_id, product_id, user_id, copies,
          updated_by: user_id, status_type: 8,
        }) : fuelingAdaptor.updateRefuelings(itemId, {
          job_id, product_id, user_id,
          updated_by: user_id, copies,
        }));
        break;
      case 11:
        productItemPromise.push(!itemId ?
            productAdaptor.createEmptyProduct({
              job_id, ref_id: product_id, user_id, copies, category_id,
              main_category_id, updated_by: user_id, status_type: 8,
            }) :
            productAdaptor.updateProduct(itemId,
                {job_id, user_id, updated_by: user_id, copies}));
        break;
      default:
        productItemPromise.push(productAdaptor.updateProduct(product_id,
            {job_id, user_id, updated_by: user_id, copies}));
        break;
    }

    if (type > 1 && type < 12) {
      productItemPromise.push(productAdaptor.updateProduct(product_id,
          {job_id, user_id, updated_by: user_id}));
    } else if (cashback_job_id) {
      productItemPromise.push(
          jobAdaptor.updateCashBackJobs({
            id: cashback_job_id, jobDetail: JSON.parse(JSON.stringify({
              job_id, user_id, updated_by: user_id,
              copies, admin_status: online_order ? 8 : 2,
              ce_status: online_order ? 4 : undefined,
              ce_id: online_order ? 65 : undefined,
            })),
          }));
    }

    return await Promise.all(productItemPromise);
  }

  static notifyTeam(user, result) {
    if (process.env.NODE_ENV === 'production') {
      notificationAdaptor.sendMailOnUpload(config.MESSAGE,
          'sagar@binbill.com;pranjal@binbill.com;anu.gupta@binbill.com',
          user, result.id);
    }
  }

  static async retrieveFiles(request, reply) {
    if (!request.pre.forceUpdate) {
      let result;
      try {
        result = await modals.jobs.findById(request.params.id, {
          include: [
            {
              model: modals.jobCopies, as: 'copies',
              where: {id: request.params.copyid},
              required: true,
            }],
        });
        if (result) {
          const fileResult = await fsImpl.readFile(
              Guid.isGuid(result.job_id) ? `${result.copies[0].file_name}` :
                  `jobs/${result.job_id}/${result.copies[0].file_name}`);
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${result.bill_copy_name}`);
        } else {
          return reply.response({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate,
          }).code(404);
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} while retrieving image is as follow: \n \n ${err}`);
        try {
          const fileResult = await fsImpl.readFile(
              `jobs/${result.job_id}/${result.copies[0].file_name}`);
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${result.bill_copy_name}`);
        } catch (err) {
          console.log(
              `Error on ${new Date()} while retrieving image is as follow: \n \n ${err}`);

          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: 1,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              err,
            }),
          }).catch((ex) => console.log('error while logging on db,', ex));
          return reply.response({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate,
            err,
          }).code(404);
        }
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }

  }

//Will required to be change if discard is required
  static async deleteFile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
      }).code(401);
    } else {
      try {
        if (!request.pre.forceUpdate) {
          const itemId = request.query && request.query.itemid ?
              request.query.itemid : undefined;

          let [jobData, updateCopyStatus, count, productItemStatus] = await Promise.all(
              [
                modals.jobs.findById(request.params.id, {
                  include: [
                    {model: modals.jobCopies, as: 'copies', required: true}],
                }),
                modals.jobCopies.update(
                    {status_type: 3, updated_by: user.id || user.ID}, {
                      where: {
                        id: request.params.copyid,
                        job_id: request.params.id,
                      },
                    }),
                modals.jobCopies.count({
                  where: {
                    id: {$ne: request.params.copyid},
                    job_id: request.params.id,
                    status_type: {$notIn: [3, 9]},
                  },
                }), itemId ? UploadController.updateOrDeleteProductItems({
                type: parseInt(request.query.type || '1'),
                jobId: request.params.id,
                user, itemId, copyId: request.params.copyid,
              }) : '']);
          let attributes = count > 0 ?
              {
                user_status: 8, admin_status: 4, ce_status: null,
                qe_status: null, updated_by: user.id || user.ID,
              } : {
                user_status: 8, admin_status: 2, ce_status: null,
                qe_status: null, updated_by: user.id || user.ID,
              };

          const jobItem = jobData.toJSON();
          const copiesData = jobItem.copies.find(
              (copyItem) => copyItem.id.toString() ===
                  request.params.copyid.toString());
          if (copiesData) {
            await fsImpl.unlink(copiesData.file_name);
            await fsImpl.unlink(
                `jobs/${jobData[0].job_id}/${copiesData.file_name}`);
          }
          if (jobItem.admin_status !== 5) {
            jobData.updateAttributes(attributes);
          }

          const deletionResponse = {
            status: true,
            message: productItemStatus[0] === true ?
                'Product item deleted successfully' :
                productItemStatus[0] && itemId ?
                    'File deleted successfully from product item' :
                    'File deleted successfully',
            isProductItemDeleted: productItemStatus[0] === true,
            productItemCopiesCount: productItemStatus[0] &&
            productItemStatus[0] !== true ?
                productItemStatus[0].copies.length : 0,
            productItem: productItemStatus[0] && productItemStatus[0] !== true ?
                productItemStatus[0] : undefined,
            forceUpdate: request.pre.forceUpdate,
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
            case 5 :
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
            case 9:
              deletionResponse.rc = deletionResponse.productItem;
              break;
            case 10:
              deletionResponse.fuel_details = deletionResponse.productItem;
              break;
            case 11:
              deletionResponse.accessories = deletionResponse.productItem;
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
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response(
            {status: false, err, forceUpdate: request.pre.forceUpdate});
      }
    }
  }

  static async retrieveSellerImages(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const {id, type, index} = request.params || {};
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const seller_data = await sellerAdaptor.retrieveSellerDetail(
            {where: {id, user_id: user.id}, attributes: ['seller_details']});
        let file_name;
        if (seller_data.seller_details) {
          if (type.toString() === '1') {
            const document = seller_data.seller_details.basic_details.documents[index];
            file_name = (document || {}).file_name;
          } else if (type.toString() === '2') {
            const document = seller_data.seller_details.business_details.documents[index];
            file_name = (document || {}).file_name;
          } else {
            const document = seller_data.seller_details.assisted_type_images.documents[index];
            file_name = (document || {}).file_name;
          }
          if (file_name) {
            const fileResult = await fsImpl.readFile(
                `sellers/${id}/${seller_image_types[type]}/${file_name}`,
                'utf8');

            console.log(fileResult);
            return reply.response(fileResult.Body).
                header('Content-Type', fileResult.ContentType).
                header('Content-Disposition',
                    `attachment; filename=${file_name}`);
          } else {

            return reply.response({
              status: false,
              message: 'Look like there is no more files.',
              forceUpdate: request.pre.forceUpdate,
            });
          }
        } else {

          return reply.response({
            status: false,
            message: 'Look like seller details are not available',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveAssistedTypeImages(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const {id} = request.params || {};
        let file_name = `${id}.png`;
        if (file_name) {
          const fileResult = await fsImpl.readFile(
              `sellers/service_types/${file_name}`,
              'utf8');

          console.log(fileResult);
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${file_name}`);
        } else {
          return reply.response({
            status: false,
            message: 'Look like there is no image for requested id.',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerImagesForConsumer(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const {id, type, index} = request.params || {};
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const seller_data = await sellerAdaptor.retrieveSellerDetail(
            {where: {id}, attributes: ['seller_details']});
        let file_name;
        if (seller_data.seller_details) {
          if (type.toString() === '1') {
            const document = seller_data.seller_details.basic_details.documents[index];
            file_name = (document || {}).file_name;
          } else if (type.toString() === '2') {
            const document = seller_data.seller_details.business_details.documents[index];
            file_name = (document || {}).file_name;
          } else {
            const document = seller_data.seller_details.assisted_type_images.documents[index];
            file_name = (document || {}).file_name;
          }
          if (file_name) {
            const fileResult = await fsImpl.readFile(
                `sellers/${id}/${seller_image_types[type]}/${file_name}`,
                'utf8');

            console.log(fileResult);
            return reply.response(fileResult.Body).
                header('Content-Type', fileResult.ContentType).
                header('Content-Disposition',
                    `attachment; filename=${file_name}`);
          } else {

            return reply.response({
              status: false,
              message: 'Look like there is no more files.',
              forceUpdate: request.pre.forceUpdate,
            });
          }
        } else {

          return reply.response({
            status: false,
            message: 'Look like seller details are not available',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async deleteSellerImages(request, reply) {

    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const {id, type, index} = request.params || {};
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const seller_data = await sellerAdaptor.retrieveSellerDetail(
            {where: {id, user_id: user.id}, attributes: ['seller_details']});
        let file_name;
        if (seller_data.seller_details) {
          if (type.toString() === '1') {
            const document = seller_data.seller_details.basic_details.documents[index];
            file_name = (document || {}).file_name;
          } else if (type.toString() === '2') {
            const document = seller_data.seller_details.business_details.documents[index];
            file_name = (document || {}).file_name;
          } else {
            const document = seller_data.seller_details.assisted_type_images.documents[index];
            file_name = (document || {}).file_name;
          }
          if (file_name) {
            await fsImpl.unlink(
                `sellers/${id}/${seller_image_types[type]}/${file_name}`);
            console.log(file_name);
            if (type.toString() === '1') {
              seller_data.seller_details.basic_details.documents = seller_data.seller_details.basic_details.documents.filter(
                  item => item.file_name !== file_name);
            } else if (type.toString() === '2') {
              seller_data.seller_details.business_details.documents = seller_data.seller_details.business_details.documents.filter(
                  item => item.file_name !== file_name);
            } else {
              seller_data.seller_details.assisted_type_images.documents = seller_data.seller_details.assisted_type_images.documents.filter(
                  item => item.file_name !== file_name);
            }

            return reply.response({
              status: true,
              seller: await sellerAdaptor.retrieveOrUpdateSellerDetail(
                  {where: {id}}, seller_data, false),
            });
          } else {

            return reply.response({
              status: false,
              message: 'Look like there is no more files.',
              forceUpdate: request.pre.forceUpdate,
            });
          }
        } else {

          return reply.response({
            status: false,
            message: 'Look like seller details are not available',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }

  }

  static async deleteSellerDetails(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const {id, type, index} = request.params || {};
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const seller_data = await sellerAdaptor.retrieveSellerDetail(
            {where: {id, user_id: user.id}, attributes: ['seller_details']});
        let file_name;
        if (seller_data.seller_details) {
          const seller_image_update = [];
          if (!type || (type && type.toString() === '1')) {
            seller_data.seller_details.basic_details.documents.forEach(
                document => {
                  file_name = (document || {}).file_name;
                  seller_image_update.push(fsImpl.unlink(
                      `sellers/${id}/${seller_image_types[1]}/${file_name}`));
                });
            seller_data.seller_details.basic_details = undefined;
          }
          if (!type || (type && type.toString() === '2')) {
            seller_data.seller_details.business_details.documents.forEach(
                document => {
                  file_name = (document || {}).file_name;
                  seller_image_update.push(fsImpl.unlink(
                      `sellers/${id}/${seller_image_types[2]}/${file_name}`));
                });
            seller_data.seller_details.business_details = undefined;
          }

          seller_data.seller_details.assisted_type_images.documents.forEach(
              document => {
                file_name = (document || {}).file_name;
                seller_image_update.push(fsImpl.unlink(
                    `sellers/${id}/${seller_image_types[2]}/${file_name}`));
              });
          seller_data.seller_details.assisted_type_images = undefined;

          await Promise.all(seller_image_update);
          seller_data.seller_details.basic_details = null;
          seller_data.seller_details = !type ? {} : seller_data.seller_details;
          return reply.response({
            status: true,
            seller: await sellerAdaptor.retrieveOrUpdateSellerDetail(
                {where: {id}}, seller_data, false),
          });
        } else {

          return reply.response({
            status: false,
            message: 'Look like seller details are not available',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }

  }

  static async updateOrDeleteProductItems(parameters) {
    let {type, jobId, user, itemId, copyId} = parameters;
    const productItemPromise = [];
    const user_id = user.id || user.ID;
    switch (type) {
      case 2:
        productItemPromise.push(amcAdaptor.removeAMCs(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;

      case 3:
        productItemPromise.push(
            insuranceAdaptor.removeInsurances(itemId, copyId,
                {job_id: jobId, user_id, updated_by: user_id}));
        break;

      case 4:
        productItemPromise.push(repairAdaptor.removeRepairs(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      case 5 :
        productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;

      case 6:
        productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      case 7:
        productItemPromise.push(pucAdaptor.removePUCs(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      case 8:
        productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      case 9:
        productItemPromise.push(regCertAdaptor.removeRegCerts(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      case 10:
        productItemPromise.push(fuelingAdaptor.removeRefueling(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      case 11:
        productItemPromise.push(productAdaptor.removeProducts(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
      default:
        productItemPromise.push(productAdaptor.removeProducts(itemId, copyId,
            {job_id: jobId, user_id, updated_by: user_id}));
        break;
    }

    return await Promise.all(productItemPromise);
  }

  static async retrieveCategoryImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.CATEGORY_IMAGE}/${categoryImageType[request.params.type ||
            1]}${request.params.file_type ?
                `/${request.params.file_type}` :
                ''}`, config.AWS.ACCESS_DETAILS);
        const result = await modals.categories.findOne(
            {where: {category_id: request.params.id}});
        const fileResult = await fsImplCategory.readFile(
            result.category_image_name, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${result.category_image_name}`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveOfferCategoryImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.CATEGORY_IMAGE}/offer${request.params.file_type
                ? `/${request.params.file_type}`
                : ''}`, config.AWS.ACCESS_DETAILS);
        let result = await modals.offerCategories.findOne(
            {where: {id: request.params.id}});

        result = result ? result.toJSON() : {};
        const fileResult = await fsImplCategory.readFile(
            result.category_image_name, 'utf8');

        console.log(fileResult);
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${result.category_image_name}`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveAccessoryCategoryImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.CATEGORY_IMAGE}/accessory_parts${request.params.file_type
                ? `/${request.params.file_type}`
                : ''}`, config.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplCategory.readFile(
            `${request.params.id}.png`, 'utf8');

        console.log(fileResult);
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving category image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveProductImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplProduct = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.PRODUCT_IMAGE}${request.params.file_type
                ? `/${request.params.file_type}` : ''}`,
            config.AWS.ACCESS_DETAILS);

        const productResult = await modals.products.findOne(
            {where: {id: request.params.id}});
        if (productResult) {
          const productDetail = productResult.toJSON();
          const fileResult = await fsImplProduct.readFile(
              `${request.params.id}.${productDetail.file_type}`, 'utf8');
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${request.params.id}.${productDetail.file_type}`);
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving product item image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).
            catch((ex) => console.log('error while logging on db,',
                ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveWearableImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplProduct = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.WEARABLE_IMAGE}`,
            config.AWS.ACCESS_DETAILS);
        const wearableResult = await modals.wearables.findOne(
            {where: {id: request.params.id}});
        if (wearableResult) {
          const wearableDetail = wearableResult.toJSON();
          const fileResult = await fsImplProduct.readFile(
              `${wearableDetail.image_name}`, 'utf8');
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${wearableDetail.image_name}`);
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving wearable item image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveCalendarItemImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplCategory = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.CALENDAR_ITEM_IMAGE}${request.params.file_type
                ? `/${request.params.file_type}` : ''}`,
            config.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplCategory.readFile(
            `${request.params.id}.png`,
            'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user while retrieving calendar item image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveBrandImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.BRAND_IMAGE}${request.params.file_type
                ? `/${request.params.file_type}` : ''}`,
            config.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(
            `${request.params.id}.png`, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving brand image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveProviderImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.PROVIDER_IMAGE}${request.params.file_type
                ? `/${request.params.file_type}` : ''}`,
            config.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(
            `${request.params.id}.png`,
            'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving provider image is as follow: \n \n ${err}`);

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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveKnowItemImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.KNOW_ITEM_IMAGE}`,
            config.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(
            `${request.params.id}.png`, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerOfferImages(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const {offer_id, index} = request.params;
        const seller_offer = await sellerAdaptor.retrieveSellerOfferDetail(
            {
              where: {id: offer_id},
              attributes: ['document_details', 'seller_id'],
            });
        const document = !isNaN(index) ?
            (seller_offer || {}).document_details[index] :
            (seller_offer || {}).document_details.find(
                item => item.index && item.index === index);
        let file_name = (document || {}).file_name;
        console.log((`sellers/${(seller_offer ||
            {}).seller_id}/${seller_image_types[4]}/${file_name}`));
        const fileResult = await fsImpl.readFile(
            `sellers/${(seller_offer ||
                {}).seller_id}/${seller_image_types[4]}/${file_name}`, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveAssistedProfile(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const {id} = request.params;
        const assisted_users = await sellerAdaptor.retrieveAssistedServiceUser(
            {where: {id}, attributes: ['profile_image_detail', 'seller_id']});
        const document = (assisted_users || {}).profile_image_detail;
        let file_name = (document || {}).file_name;
        const fileResult = await fsImpl.readFile(
            `sellers/${(assisted_users ||
                {}).seller_id}/${seller_image_types[3]}/${file_name}`, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveAssistedDocument(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const {id, index} = request.params;
        const assisted_users = await sellerAdaptor.retrieveAssistedServiceUser(
            {
              where: {id, document_details: {$contains: [{index}]}},
              attributes: ['document_details', 'seller_id'],
            });
        const document = !isNaN(index) ?
            (assisted_users || {}).document_details[index] :
            (assisted_users || {}).document_details.find(
                item => item.index && item.index === index);
        let file_name = (document || {}).file_name;
        const fileResult = await fsImpl.readFile(
            `sellers/${(assisted_users ||
                {}).seller_id}/${seller_image_types[3]}/${file_name}`, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async uploadSellerOfferImages(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const {offer_id, index} = request.params;
        const seller_offer = await sellerAdaptor.retrieveSellerOfferDetail(
            {
              where: {id: offer_id},
              attributes: ['document_details', 'seller_id'],
            });
        if (seller_offer) {
          (seller_offer || {}).document_details = (seller_offer ||
              {}).document_details && (seller_offer ||
              {}).document_details.length > 0 ? (seller_offer ||
              {}).document_details : [
            {
              file_name: undefined,
              index: 0,
              file_type: undefined,
              updated_by: user.id, type: 1, image_type: 1,
            }];
          let document = seller_offer.document_details[0];
          if (seller_offer.document_details &&
              seller_offer.document_details.length > 0) {
            document = !isNaN(index) ?
                (seller_offer || {}).document_details[index] :
                (seller_offer || {}).document_details.find(
                    item => item.index && item.index === index);
          }
          let file_name = (document || {}).file_name;
          const fieldNameHere = request.payload.fieldNameHere;
          let filteredFileData = fieldNameHere || request.payload.filesName ||
              request.payload.file;
          if (filteredFileData) {
            filteredFileData = Array.isArray(filteredFileData) ?
                filteredFileData : [filteredFileData];

            if (filteredFileData.length === 0) {
              console.log('No valid documents in request');
              return reply.response(
                  {status: false, message: 'No valid documents in request'});
            }

            filteredFileData = filteredFileData.filter((datum) => {
              const name = datum.hapi.filename;
              const file_type = (/[.]/.exec(name))
                  ? /[^.]+$/.exec(name) : undefined;
              return file_type && !isFileTypeAllowed(file_type) ? false :
                  !(!file_type && !isFileTypeAllowedMagicNumber(datum._data));
            });
            const elem = filteredFileData[0];
            const file_index = `${Math.random().toString(36).
                substr(2, 9)}${(user.id).toString(36)}`;
            const name = elem.hapi.filename;
            const file_type = (/[.]/.exec(name)) ?
                /[^.]+$/.exec(name) :
                undefined;
            const fileTypeData = getTypeFromBuffer(elem._data);
            const fileName = `${user.id}-${file_index}.${(file_type) ?
                file_type.toString() : fileTypeData.ext}`;
            document.file_name = document.file_name || fileName;
            document.file_type = document.file_type || file_type;
            await fsImpl.writeFile(
                `sellers/${(seller_offer ||
                    {}).seller_id}/${seller_image_types[4]}/${document.file_name}`,
                elem._data,
                {ContentType: mime.lookup(fileName) || 'image/jpeg'});
            document.index = file_index;
            seller_offer.document_details = (seller_offer.document_details ||
                [document]).length > 0 ?
                (seller_offer.document_details || [document]) :
                [document];
            return reply.response(
                {
                  status: true,
                  offer: await sellerAdaptor.retrieveOrCreateSellerOffers(
                      {id: offer_id}, seller_offer),
                });

          } else {
            return reply.response(
                {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
          }
        } else {
          return reply.response(
              {status: false, message: 'No a valid offer in request'}); //, forceUpdate: request.pre.forceUpdate});
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async uploadSellerAssistedProfile(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const {id, index} = request.params;
        const assisted_user = await sellerAdaptor.retrieveAssistedServiceUser(
            {where: {id}, attributes: ['profile_image_detail', 'seller_id']});
        if (assisted_user) {
          (assisted_user || {}).profile_image_detail = (assisted_user ||
              {}).profile_image_detail || {};
          const document = (assisted_user || {}).profile_image_detail;
          let file_name = (document || {}).file_name;
          const fieldNameHere = request.payload.fieldNameHere;
          let filteredFileData = fieldNameHere || request.payload.filesName ||
              request.payload.file;
          if (filteredFileData) {
            filteredFileData = Array.isArray(filteredFileData) ?
                filteredFileData : [filteredFileData];

            if (filteredFileData.length === 0) {
              console.log('No valid documents in request');
              return reply.response(
                  {status: false, message: 'No valid documents in request'});
            }

            filteredFileData = filteredFileData.filter((datum) => {
              const name = datum.hapi.filename;
              const file_type = (/[.]/.exec(name))
                  ? /[^.]+$/.exec(name) : undefined;
              return file_type && !isFileTypeAllowed(file_type) ? false :
                  !(!file_type && !isFileTypeAllowedMagicNumber(datum._data));
            });
            const elem = filteredFileData[0];
            const file_index = `${Math.random().toString(36).
                substr(2, 9)}${(user.id).toString(36)}`;
            const name = elem.hapi.filename;
            const file_type = (/[.]/.exec(name)) ?
                /[^.]+$/.exec(name) : undefined;
            const fileTypeData = getTypeFromBuffer(elem._data);
            const fileName = `${user.id}-${file_index}.${(file_type) ?
                file_type.toString() : fileTypeData.ext}`;
            file_name = file_name || fileName;
            await fsImpl.writeFile(
                `sellers/${(assisted_user ||
                    {}).seller_id}/${seller_image_types[3]}/${file_name}`,
                elem._data,
                {ContentType: mime.lookup(fileName) || 'image/jpeg'});

            document.index = file_index;

            document.file_name = file_name;
            document.file_type = (file_type) ?
                file_type.toString() :
                fileTypeData.ext;
            document.updated_by = user.id;
            document.type = 5;
            assisted_user.profile_image_detail = assisted_user.profile_image_detail ||
                document;

            return reply.response(
                {
                  status: true,
                  assisted_user: await sellerAdaptor.retrieveOrCreateAssistedServiceUsers(
                      {id}, assisted_user, []),
                });

          } else {
            return reply.response(
                {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
          }
        } else {
          return reply.response(
              {status: false, message: 'No assisted user in request'});
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async uploadSellerAssistedDocuments(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const user = shared.verifyAuthorization(request.headers);
        const seller_image_types = config.SELLER_IMAGE_TYPE.split(',');
        const {id, index} = request.params;
        const assisted_user = await sellerAdaptor.retrieveAssistedServiceUser(
            {
              where: {id},
              attributes: ['document_details', 'seller_id'],
            });
        (assisted_user || {}).document_details = (assisted_user ||
            {}).document_details || [];
        (assisted_user || {}).document_details = (assisted_user ||
            {}).document_details.length > 0 ?
            (assisted_user || {}).document_details : [{}];
        const document = (!isNaN(index) ?
            (assisted_user || {}).document_details[index] :
            (assisted_user || {}).document_details.find(
                item => item.index && item.index === index)) || {};
        let file_name = (document || {}).file_name;
        const fieldNameHere = request.payload.fieldNameHere;
        let filteredFileData = fieldNameHere || request.payload.filesName ||
            request.payload.file;
        if (filteredFileData) {
          filteredFileData = Array.isArray(filteredFileData) ?
              filteredFileData : [filteredFileData];

          if (filteredFileData.length === 0) {
            console.log('No valid documents in request');
            return reply.response(
                {status: false, message: 'No valid documents in request'});
          }

          filteredFileData = filteredFileData.filter((datum) => {
            const name = datum.hapi.filename;
            const file_type = (/[.]/.exec(name))
                ? /[^.]+$/.exec(name) : undefined;
            return file_type && !isFileTypeAllowed(file_type) ? false :
                !(!file_type && !isFileTypeAllowedMagicNumber(datum._data));
          });
          const elem = filteredFileData[0];
          const file_index = `${Math.random().toString(36).
              substr(2, 9)}${(user.id).toString(36)}`;
          const name = elem.hapi.filename;
          let file_type = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
          const fileTypeData = getTypeFromBuffer(elem._data);
          const fileName = `${user.id}-${file_index}.${(file_type) ?
              file_type.toString() : fileTypeData.ext}`;
          file_name = file_name || fileName;
          file_type = (file_type) ?
              file_type.toString() : fileTypeData.ext;
          await fsImpl.writeFile(
              `sellers/${(assisted_user ||
                  {}).seller_id}/${seller_image_types[3]}/${file_name}`,
              elem._data, {ContentType: mime.lookup(fileName) || 'image/jpeg'});
          document.index = file_index;

          document.file_name = file_name;
          document.file_type = file_type;
          document.updated_by = user.id;
          document.type = 3;

          return reply.response(
              {
                status: true,
                assisted_user: await sellerAdaptor.retrieveOrCreateAssistedServiceUsers(
                    {id}, assisted_user, []),
              });

        } else {
          return reply.response(
              {status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
        }
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveOfferBannerImage(request, reply) {
    if (!request.pre.forceUpdate) {
      try {
        const fsImplBrand = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.OFFER_BANNERS}`,
            config.AWS.ACCESS_DETAILS);
        const fileResult = await fsImplBrand.readFile(
            `${request.params.offer_id}.png`, 'utf8');
        return reply.response(fileResult.Body).
            header('Content-Type', fileResult.ContentType).
            header('Content-Disposition',
                `attachment; filename=${request.params.id}.png`);
      } catch (err) {
        console.log(
            `Error on ${new Date()} retrieving fact image is as follow: \n \n ${err}`);
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
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveUserImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
      }).code(401);
    } else {
      if (!request.pre.forceUpdate) {
        try {
          let userData = await userAdaptor.retrieveUserImageNameById(user);
          if (userData.image_name) {
            const fileResult = await fsImpl.readFile(userData.image_name);
            return reply.response(fileResult.Body).
                header('Content-Type', fileResult.ContentType).
                header('Content-Disposition',
                    `attachment; filename=${userData.image_name}`);
          }
          return reply.response({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate,
          }).code(404);
        } catch (err) {
          console.log(
              `Error on ${new Date()} for user ${user.id ||
              user.ID} is as follow: \n \n ${err}`);
          const fsImplUser = new S3FS(
              `${config.AWS.S3.BUCKET}/${config.AWS.S3.USER_IMAGE}`,
              config.AWS.ACCESS_DETAILS);
          try {
            const fileResult = await fsImplUser.readFile(userData.image_name);
            return reply.response(fileResult.Body).
                header('Content-Type', fileResult.ContentType).
                header('Content-Disposition',
                    `attachment; filename=${fileResult.CopyName}`);
          } catch (err) {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n ${JSON.stringify(err.toJSON())}`);

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
                err,
              }),
            }).catch((ex) => console.log('error while logging on db,', ex));
            return reply.response({
              status: false,
              message: 'No Result Found',
              forceUpdate: request.pre.forceUpdate,
            }).code(404);
          }
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }

  static async retrieveUserImageForSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      try {
        const {id} = request.params;
        let userData = await userAdaptor.retrieveUserImageNameById({id});
        if (userData.image_name) {
          const fileResult = await fsImpl.readFile(userData.image_name);
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${userData.image_name}`);
        }

        return reply.response({
          status: false,
          message: 'No Result Found',
          forceUpdate: request.pre.forceUpdate,
        }).code(404);
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        const fsImplUser = new S3FS(
            `${config.AWS.S3.BUCKET}/${config.AWS.S3.USER_IMAGE}`,
            config.AWS.ACCESS_DETAILS);
        try {
          const fileResult = await fsImplUser.readFile(userData.image_name);
          return reply.response(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${fileResult.CopyName}`);
        } catch (err) {
          console.log(
              `Error on ${new Date()} for user ${user.id ||
              user.ID} is as follow: \n ${JSON.stringify(err.toJSON())}`);

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
              err,
            }),
          }).catch((ex) => console.log('error while logging on db,', ex));
          return reply.response({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate,
          }).code(404);
        }
      }
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default UploadController;
