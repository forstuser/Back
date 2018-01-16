'use strict';

import fileType from 'file-type';
import mime from 'mime-types';
import S3FS from 's3fs';
import config from '../../config/main';
import shared from '../../helpers/shared';
import notificationAdaptor from '../Adaptors/notification';
import UserAdaptor from '../Adaptors/user';
import JobAdaptor from '../Adaptors/job';
import AMCAdaptor from '../Adaptors/amcs';
import InsuranceAdaptor from '../Adaptors/insurances';
import WarrantyAdaptor from '../Adaptors/warranties';
import RepairAdaptor from '../Adaptors/repairs';
import PUCAdaptor from '../Adaptors/pucs';
import ProductAdaptor from '../Adaptors/product';
import Guid from 'guid';

const fsImpl = new S3FS(config.AWS.S3.BUCKET, config.AWS.ACCESS_DETAILS);

const ALLOWED_FILE_TYPES = [
  'txt',
  'pdf',
  'doc',
  'docx',
  'rtf',
  'xls',
  'xlsx',
  'png',
  'bmp',
  'jpg',
  'jpeg'];

const categoryImageType = ['xxhdpi', 'xxhdpi-small'];

const isFileTypeAllowed = function(fileTypeData) {
  // console.log("FILE TYPE DATA: " + fileTypeData);
  if (fileTypeData) {
    let filetype = fileTypeData.toString().toLowerCase();
    // console.log(filetype);
    return (ALLOWED_FILE_TYPES.indexOf(filetype) > -1);
  }
  console.log('HERE');
  return false;
};

const isFileTypeAllowedMagicNumber = function(buffer) {
  // console.log("GOT BUFFER");
  const result = fileType(buffer);
  return (ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1);
};

const getTypeFromBuffer = function(buffer) {
  return fileType(buffer);
};
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
    userAdaptor = new UserAdaptor(modals);
    jobAdaptor = new JobAdaptor(modals);
    amcAdaptor = new AMCAdaptor(modals);
    insuranceAdaptor = new InsuranceAdaptor(modals);
    warrantyAdaptor = new WarrantyAdaptor(modals);
    repairAdaptor = new RepairAdaptor(modals);
    pucAdaptor = new PUCAdaptor(modals);
    productAdaptor = new ProductAdaptor(modals);
  }

  static uploadUserImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        // forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.payload) {
      const fieldNameHere = request.payload.fieldNameHere;
      const fileData = fieldNameHere || request.payload.filesName;

      const name = fileData.hapi.filename;
      const fileType = name.split('.')[name.split('.').length - 1];
      const fileName = `active-${user.id ||
      user.ID}-${new Date().getTime()}.${fileType}`;
      // const file = fs.createReadStream();
      return fsImpl.writeFile(fileName, fileData._data,
          {ContentType: mime.lookup(fileName)}).then((fileResult) => {

        return userAdaptor.updateUserDetail({
          image_name: fileName,
        }, {
          where: {
            id: user.id || user.ID,
          },
        });
      }).then(() => {
        return reply({
          status: true,
          message: 'Uploaded Successfully',
        });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Upload Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      });
    } else {
      return reply({status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
    }
  }

  static uploadFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
      }).code(401);
    } else if (request.payload) {
      // if (!request.pre.forceUpdate && request.payload) {
      const fieldNameHere = request.payload.fieldNameHere;
      const fileData = fieldNameHere || request.payload.filesName ||
          request.payload.file;

      let filteredFileData = fileData;
      // console.log("BEFORE FILTERING: ", filteredFileData);
      if (filteredFileData) {
        if (Array.isArray(filteredFileData)) {
          filteredFileData = fileData.filter((datum) => {
            const name = datum.hapi.filename;
            const fileType = (/[.]/.exec(name))
                ? /[^.]+$/.exec(name)
                : undefined;
            if (fileType && !isFileTypeAllowed(fileType)) {
              return false;
            } else if (!fileType &&
                !isFileTypeAllowedMagicNumber(datum._data)) {
              return false;
            }

            return true;
          });
        } else {
          const name = filteredFileData.hapi.filename;
          const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
          // console.log("OUTSIDE FILE ALLOWED: ", fileType);
          if (fileType && !isFileTypeAllowed(fileType)) {
            filteredFileData = [];
          } else if (!fileType &&
              !isFileTypeAllowedMagicNumber(filteredFileData._data)) {
            filteredFileData = [];
          }
        }

        if (filteredFileData.length === 0) {
          console.log('No valid documents in request');
          return reply(
              {status: false, message: 'No valid documents in request'});
        } else {
          if (request.params && request.params.id) {
            return UploadController.retrieveJobCreateCopies({
              user,
              fileData,
              reply,
              request,
            }).catch((err) => {
              console.log(
                  `Error on ${new Date()} for user ${user.id ||
                  user.ID} is as follow: \n \n ${err}`);
              return reply(
                  {status: false, message: 'Unable to upload document'});
            });
          }

          return UploadController.createJobWithCopies({
            user,
            fileData: filteredFileData,
            reply,
            request,
          }).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
            return reply(
                {status: false, message: 'Unable to upload document'});
          });
        }
        // } else {
        // 	reply({status: false, message: 'No File', forceUpdate: request.pre.forceUpdate}).code(400);
        // }
      } else {
        return reply({status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
      }
    }
  }

  static retrieveJobCreateCopies(parameters) {
    let {user, fileData, reply, request} = parameters;
    return jobAdaptor.retrieveJobDetail(request.params.id).then((jobResult) => {
      if (Array.isArray(fileData)) {
        return UploadController.uploadArrayOfFile({
          requiredDetail: {
            fileData,
            user,
            result: jobResult,
            type: request.query ? parseInt(request.query.type || '1') : 1,
            itemId: request.query ? request.query.itemid : undefined,
          }, reply,
        });
      } else {
        const name = fileData.hapi.filename;
        const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
        // console.log("OUTSIDE FILE ALLOWED: ", fileType);
        if (fileType && !isFileTypeAllowed(fileType)) {
          return reply({status: false, message: 'Data Upload Failed'});
        } else if (!fileType && !isFileTypeAllowedMagicNumber(fileData._data)) {
          return reply({status: false, message: 'Data Upload Failed'});
        } else {
          return UploadController.uploadSingleFile({
            requiredDetail: {
              fileData,
              result: jobResult,
              fileType,
              user,
              type: request.query ? parseInt(request.query.type || '1') : 1,
              itemId: request.query ? request.query.itemid : undefined,
            }, reply,
          });
        }
      }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
    });
  }

  static createJobWithCopies(parameters) {
    let {user, fileData, reply, request} = parameters;
    return jobAdaptor.createJobs({
      job_id: `${Math.random().toString(36).substr(2, 9)}${(user.id ||
          user.ID).toString(
          36)}`,
      user_id: user.id || user.ID,
      updated_by: user.id || user.ID,
      uploaded_by: user.id || user.ID,
      user_status: 8,
      admin_status: 4,
      comments: request.query ?
          request.query.productId ?
              `This job is sent for product id ${request.query.productId}` :
              request.query.productName ?
                  `This job is sent for product name ${request.query.productName}` :
                  '' :
          ``,
    }).then((jobResult) => {
      if (Array.isArray(fileData)) {
        return UploadController.uploadArrayOfFile({
          requiredDetail: {
            fileData,
            user,
            result: jobResult,
            type: request.query ? request.query.type || 1 : 1,
          }, reply,
        });
      } else {
        const name = fileData.hapi.filename;
        const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
        // console.log("OUTSIDE FILE ALLOWED: ", fileType);
        if (fileType && !isFileTypeAllowed(fileType)) {
          return reply({status: false, message: 'Data Upload Failed'});
        } else if (!fileType && !isFileTypeAllowedMagicNumber(fileData._data)) {
          return reply({status: false, message: 'Data Upload Failed'});
        } else {
          return UploadController.uploadSingleFile({
            requiredDetail: {
              fileData, result: jobResult, fileType,
              user, type: request.query ? request.query.type || 1 : 1,
            }, reply,
          });
        }
      }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
    });
  }

  static uploadSingleFile(parameters) {
    console.log('Single File Upload');
    let {requiredDetail, reply} = parameters;
    const user = requiredDetail.user;
    const fileData = requiredDetail.fileData;
    const jobResult = requiredDetail.result;
    const type = requiredDetail.type;
    const fileType = requiredDetail.fileType;
    const fileTypeData = getTypeFromBuffer(fileData._data);
    const fileName = `${user.id || user.ID}-1.${(fileType)
        ? fileType.toString()
        : fileTypeData.ext}`;

    return fsImpl.writeFile(`jobs/${jobResult.job_id}/${fileName}`,
        fileData._data,
        {ContentType: mime.lookup(fileName)}).then((fileResult) => {
      const jobCopyDetail = {
        job_id: jobResult.id,
        file_name: fileName,
        file_type: (fileType)
            ? fileType.toString()
            : fileTypeData.ext,
        status_type: 6,
        updated_by: user.id || user.ID,
        type,
      };
      let copyData;
      return jobAdaptor.createJobCopies(jobCopyDetail).then((copyResult) => {
        copyData = [copyResult];
        return modals.users.findById(user.id || user.ID);
      }).then((userResult) => {
        if (userResult.email) {
          UploadController.mailUserForJob(userResult, user);
        }

        UploadController.notifyTeam(user, jobResult);

        if (type && jobResult.productId) {
          return UploadController.createProductItems({
            type,
            jobId: jobResult.id,
            user,
            productId: jobResult.productId,
            itemId: requiredDetail.itemId,
            copies: copyData.map((copyItem) => ({
              copyId: copyItem.id,
              copyUrl: `/jobs/${copyItem.job_id}/files/${copyItem.id}`,
              file_type: copyItem.file_type,
              jobId: copyItem.job_id,
              copyName: copyItem.file_name,
            })),
          });
        }

        return undefined;
      }).then((productItemResult) => {
        return UploadController.uploadResponse(jobResult, copyData,
            productItemResult, type,
            reply);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Data Update Failed',
          err,
          // forceUpdate: request.pre.forceUpdate
        });
      });
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false, message: 'Upload Failed', err}); //forceUpdate: request.pre.forceUpdate});
    });
  }

  static uploadArrayOfFile(parameters) {
    console.log('Multiple File Upload');
    let {requiredDetail, reply} = parameters;
    let jobCopies;
    const fileNames = [];
    const fileTypes = [];
    const fileTypeDataArray = [];
    const user = requiredDetail.user;
    const fileData = requiredDetail.fileData;
    const jobResult = requiredDetail.result;
    const type = requiredDetail.type;
    const fileUploadPromises = fileData.map((elem, index) => {
      const name = elem.hapi.filename;
      const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
      const fileTypeData = getTypeFromBuffer(elem._data);
      const fileName = `${user.id || user.ID}-${index +
      1}.${(fileType)
          ? fileType.toString()
          : fileTypeData.ext}`;

      fileNames.push(fileName);
      fileTypes.push(fileType);
      fileTypeDataArray.push(fileTypeData);
      // const file = fs.createReadStream();
      return fsImpl.writeFile(`jobs/${jobResult.job_id}/${fileName}`,
          elem._data,
          {ContentType: mime.lookup(fileName)});
    });
    Promise.all(fileUploadPromises).then((fileResult) => {
      const promisedQuery = fileResult.map((elem, index) => {
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

      promisedQuery.push(modals.users.findById(user.id || user.ID));
      // if (promisedQuery.length === Object.keys(fileData).length) {
      return Promise.all(promisedQuery);
      // }
    }).then(billResult => {
      jobCopies = billResult.splice(billResult.length - 1, 1);
      const userResult = billResult[billResult.length - 1];
      if (userResult.email) {
        UploadController.mailUserForJob(userResult, user);
      }

      UploadController.notifyTeam(user, jobResult);
      if (type && jobResult.productId) {
        return UploadController.createProductItems({
          type,
          jobId: jobResult.id,
          user,
          itemId: requiredDetail.itemId,
          productId: jobResult.productId,
          copies: jobCopies.map((copyItem) => ({
            copyId: copyItem.id,
            copyUrl: `/jobs/${copyItem.job_id}/files/${copyItem.id}`,
            file_type: copyItem.file_type,
            jobId: copyItem.job_id,
            copyName: copyItem.file_name,
          })),
        });
      }

      return undefined;
    }).then((productItemResult) => {
      return UploadController.uploadResponse(jobResult, jobCopies,
          productItemResult, type, reply);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({
        status: false,
        message: 'Upload Failed',
        err: JSON.stringify(err),
        // forceUpdate: request.pre.forceUpdate
      }).code(500);
    });
  }

  static uploadResponse(jobResult, copyData, productItemResult, type, reply) {
    const replyResult = {
      status: true,
      job_id: jobResult.id,
      message: 'Uploaded Successfully',
      billResult: copyData,
      // forceUpdate: request.pre.forceUpdate
    };
    if (productItemResult) {
      if (type === 2) {
        replyResult.amc = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else if (type === 3) {
        replyResult.insurance = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else if (type === 4) {
        replyResult.repair = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else if (type === 5) {
        replyResult.warranty = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else if (type === 6) {
        replyResult.warranty = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else if (type === 7) {
        replyResult.puc = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else if (type === 8) {
        replyResult.warranty = productItemResult[0];
        replyResult.product = productItemResult[1];
      } else {
        replyResult.product = productItemResult[0];
      }
    }

    return reply(replyResult);
  }

  static createProductItems(parameters) {
    let {type, jobId, user, productId, itemId, copies} = parameters;
    const productItemPromise = [];
    switch (type) {
      case 2:
        productItemPromise.push(!itemId ? amcAdaptor.createAMCs({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }) : amcAdaptor.updateAMCs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }));
        break;

      case 3:
        productItemPromise.push(!itemId ? insuranceAdaptor.createInsurances({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }) : insuranceAdaptor.updateInsurances(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }));
        break;

      case 4:
        productItemPromise.push(!itemId ? repairAdaptor.createRepairs({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }) : repairAdaptor.updateRepairs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }));
        break;
      case 5 :
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          warranty_type: 1,
          copies,
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          warranty_type: 1,
          copies,
        }));
        break;

      case 6:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          warranty_type: 3,
          copies,
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          warranty_type: 3,
          copies,
        }));
        break;
      case 7:
        productItemPromise.push(!itemId ? pucAdaptor.createPUCs({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }) : pucAdaptor.updatePUCs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }));
        break;
      case 8:
        productItemPromise.push(!itemId ? warrantyAdaptor.createWarranties({
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          warranty_type: 2,
          copies,
        }) : warrantyAdaptor.updateWarranties(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          warranty_type: 2,
          copies,
        }));
        break;
      default:
        productItemPromise.push(productAdaptor.updateProduct(productId, {
          job_id: jobId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          status_type: 11,
          copies,
        }));
        break;
    }

    if (type > 1 && type < 8) {
      productItemPromise.push(productAdaptor.updateProduct(productId, {
        job_id: jobId,
        user_id: user.id || user.ID,
        updated_by: user.id || user.ID,
        status_type: 11,
      }));
    }

    return Promise.all(productItemPromise);
  }

  static mailUserForJob(userResult, user) {
    modals.jobs.count({
      where: {
        uploaded_by: userResult.id || userResult.ID,
      },
    }).then((billCount) => {
      if (billCount === 1) {
        notificationAdaptor.sendMailOnDifferentSteps(
            'It’s good to see you start building your eHome',
            userResult.email, userResult, 2);
      } else {
        notificationAdaptor.sendMailOnDifferentSteps(
            'We have received your bill, soon it will be available in your eHome',
            userResult.email, userResult, 3);
      }
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n ${JSON.stringify(
              err)} \n email is ${userResult.email}`);
    });
  }

  static notifyTeam(user, result) {
    if (process.env.NODE_ENV === 'production') {
      notificationAdaptor.sendMailOnUpload(
          config.MESSAGE,
          'sagar@binbill.com;pranjal@binbill.com;anu.gupta@binbill.com',
          user, result.id);
    }
  }

  static retrieveFiles(request, reply) {
    /* const user = shared.verifyAuthorization(request.headers);
     if (!request.pre.userExist) {
        reply({
          status: false,
          message: 'Unauthorized',
        });
     } else {*/
    if (!request.pre.forceUpdate) {
      modals.jobs.findById(request.params.id, {
        include: [
          {
            model: modals.jobCopies,
            as: 'copies',
            where: {
              id: request.params.copyid,
            },
            required: true,
          }],
      }).then((result) => {
        if (result) {
          fsImpl.readFile(
              Guid.isGuid(result.job_id) ?
                  `${result.copies[0].file_name}` :
                  `jobs/${result.job_id}/${result.copies[0].file_name}`).
              then(fileResult => {
                return reply(fileResult.Body).
                    header('Content-Type', fileResult.ContentType).
                    header('Content-Disposition',
                        `attachment; filename=${result.bill_copy_name}`);
              }).
              catch((err) => {
                console.log(
                    `Error on ${new Date()} for user ${user.id ||
                    user.ID} is as follow: \n \n ${err}`);
                return reply({
                  status: false,
                  message: 'No Result Found',
                  forceUpdate: request.pre.forceUpdate,
                  err,
                }).code(404);
              });
        } else {
          return reply({
            status: false,
            message: 'No Result Found',
            forceUpdate: request.pre.forceUpdate,
          }).code(404);
        }
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply(
            {status: false, err, forceUpdate: request.pre.forceUpdate});
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
    // }
  }

  static deleteFile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
      }).code(401);
    } else {
      if (!request.pre.forceUpdate) {
        const itemId = request.query && request.query.itemid ?
            request.query.itemid :
            undefined;

        Promise.all([
          modals.jobs.findById(request.params.id, {
            include: [
              {
                model: modals.jobCopies,
                as: 'copies',
                required: true,
              }],
          }),
          modals.jobCopies.destroy({
            where: {
              id: request.params.copyid,
              job_id: request.params.id,
            },
          }),
          modals.jobCopies.count({
            where: {
              id: {
                $ne: request.params.copyid,
              },
              job_id: request.params.id,
              status_type: {
                $notIn: [3, 9],
              },
            },
          }),
          itemId ?
              UploadController.updateOrDeleteProductItems({
                type: parseInt(request.query.type || '1'),
                jobId: request.params.id,
                user,
                itemId,
                copyId: request.params.copyid,
              }) :
              '']).then((result) => {
          const count = result[2];
          const attributes = count > 0 ? {
            user_status: 8,
            admin_status: 4,
            ce_status: null,
            qe_status: null,
            updated_by: user.id || user.ID,
          } : {
            user_status: 3,
            admin_status: 3,
            ce_status: 3,
            qe_status: 3,
            updated_by: user.id || user.ID,
          };
          const copiesData = result[0].copies.find(
              (copyItem) => copyItem.id.toString() ===
                  request.params.copyid.toString());
          if (copiesData) {
            fsImpl.rmdirp(
                Guid.isGuid(result[0].job_id) ?
                    `${copiesData.file_name}` :
                    `jobs/${result[0].job_id}/${copiesData.file_name}`);
          }

          result[0].updateAttributes(attributes);
          return reply({
            status: true,
            message: 'File deleted successfully',
            forceUpdate: request.pre.forceUpdate,
          });
        }).catch((err) => {
          console.log(
              `Error on ${new Date()} for user ${user.id ||
              user.ID} is as follow: \n \n ${err}`);
          return reply(
              {status: false, err, forceUpdate: request.pre.forceUpdate});
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }

  static updateOrDeleteProductItems(parameters) {
    let {type, jobId, user, itemId, copyId} = parameters;
    const productItemPromise = [];
    switch (type) {
      case 2:
        productItemPromise.push(amcAdaptor.removeAMCs(itemId, copyId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
        }));
        break;

      case 3:
        productItemPromise.push(
            insuranceAdaptor.removeInsurances(itemId, copyId, {
              job_id: jobId,
              product_id: productId,
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
            }));
        break;

      case 4:
        productItemPromise.push(repairAdaptor.removeRepairs(itemId, copyId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
        }));
        break;
      case 5 :
        productItemPromise.push(
            warrantyAdaptor.removeWarranties(itemId, copyId, {
              job_id: jobId,
              product_id: productId,
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
            }));
        break;

      case 6:
        productItemPromise.push(
            warrantyAdaptor.removeWarranties(itemId, copyId, {
              job_id: jobId,
              product_id: productId,
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
            }));
        break;
      case 7:
        productItemPromise.push(pucAdaptor.removePUCs(itemId, {
          job_id: jobId,
          product_id: productId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
        }));
        break;
      case 8:
        productItemPromise.push(
            warrantyAdaptor.removeWarranties(itemId, copyId, {
              job_id: jobId,
              product_id: productId,
              user_id: user.id || user.ID,
              updated_by: user.id || user.ID,
            }));
        break;
      default:
        productItemPromise.push(productAdaptor.removeProducts(itemId, copyId, {
          job_id: jobId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
        }));
        break;
    }

    if (type > 1 && type < 8) {
      productItemPromise.push(productAdaptor.removeProducts(itemId, copyId, {
        job_id: jobId,
        user_id: user.id || user.ID,
        updated_by: user.id || user.ID,
      }));
    }

    return Promise.all(productItemPromise);
  }

  static retrieveCategoryImage(request, reply) {
    if (!request.pre.forceUpdate) {
      const fsImplCategory = new S3FS(
          `${config.AWS.S3.BUCKET}/${config.AWS.S3.CATEGORY_IMAGE}/${categoryImageType[request.params.type ||
          0]}`, config.AWS.ACCESS_DETAILS);
      modals.categories.findOne({
        where: {
          category_id: request.params.id,
        },
      }).then((result) => {
        fsImplCategory.readFile(result.category_image_name, 'utf8').
            then(fileResult => reply(fileResult.Body).
                header('Content-Type', fileResult.ContentType).
                header('Content-Disposition',
                    `attachment; filename=${result.CopyName}`)).
            catch((err) => {
              console.log(
                  `Error on ${new Date()} for user ${user.id ||
                  user.ID} is as follow: \n \n ${err}`);
              reply({
                status: false,
                message: 'Unable to retrieve image',
                err,
                forceUpdate: request.pre.forceUpdate,
              });
            });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        reply({
          status: false,
          message: 'Unable to retrieve image',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveBrandImage(request, reply) {
    if (!request.pre.forceUpdate) {
      const fsImplBrand = new S3FS(
          `${config.AWS.S3.BUCKET}/${config.AWS.S3.BRAND_IMAGE}`,
          config.AWS.ACCESS_DETAILS);
      fsImplBrand.readFile(`${request.params.id}.png`, 'utf8').
          then(fileResult => reply(fileResult.Body).
              header('Content-Type', fileResult.ContentType).
              header('Content-Disposition',
                  `attachment; filename=${result.CopyName}`)).
          catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
            reply({
              status: false,
              message: 'Unable to retrieve image',
              err,
              forceUpdate: request.pre.forceUpdate,
            });
          });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveUserImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
      }).code(401);
    } else {
      if (!request.pre.forceUpdate) {
        let userData;
        return userAdaptor.retrieveUserImageNameById(user).
            then((userDetail) => {
              userData = userDetail;
              return fsImpl.readFile(userDetail.image_name);
            }).
            then((fileResult) => {
              return reply(fileResult.Body).
                  header('Content-Type', fileResult.ContentType).
                  header('Content-Disposition',
                      `attachment; filename=${fileResult.CopyName}`);
            }).
            catch((err) => {
              console.log(
                  `Error on ${new Date()} for user ${user.id ||
                  user.ID} is as follow: \n \n ${err}`);
              const fsImplUser = new S3FS(
                  `${config.AWS.S3.BUCKET}/${config.AWS.S3.USER_IMAGE}`,
                  config.AWS.ACCESS_DETAILS);
              return fsImplUser.readFile(userData.image_name).
                  then((fileResult) => {
                    return reply(fileResult.Body).
                        header('Content-Type', fileResult.ContentType).
                        header('Content-Disposition',
                            `attachment; filename=${fileResult.CopyName}`);
                  }).
                  catch((err) => {
                    console.log(
                        `Error on ${new Date()} for user ${user.id ||
                        user.ID} is as follow: \n ${JSON.stringify(
                            err.toJSON())}`);
                    return reply({
                      status: false,
                      message: 'No Result Found',
                      forceUpdate: request.pre.forceUpdate,
                    }).code(404);
                  });
            });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }
}

export default UploadController;
