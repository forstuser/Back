'use strict';

import fileType from 'file-type';
import mime from 'mime-types';
import S3FS from 's3fs';
import config from '../../config/main';
import shared from '../../helpers/shared';
import notificationAdaptor from '../Adaptors/notification';
import UserAdaptor from '../Adaptors/user';

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

class UploadController {
  constructor(modal) {
    modals = modal;
    userAdaptor = new UserAdaptor(modals);
  }

  static uploadUserImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        // forceUpdate: request.pre.forceUpdate
      });
    } else if (request.payload) {
      const fieldNameHere = request.payload.fieldNameHere;
      const fileData = fieldNameHere || request.payload.filesName;

      const name = fileData.hapi.filename;
      const fileType = name.split('.')[name.split('.').length - 1];
      const fileName = `active-${user.id}-${new Date().getTime()}.${fileType}`;
      // const file = fs.createReadStream();
      return fsImpl.writeFile(fileName, fileData._data,
          {ContentType: mime.lookup(fileName)}).then((fileResult) => {

        console.log(fileResult);
        return userAdaptor.updateUserDetail({
          image_name: fileName,
        }, {
          where: {
            id: user.id,
          },
        });
      }).then(() => {
        return reply({
          status: true,
          message: 'Uploaded Successfully',
        });
      }).catch((err) => {
        console.log({API_Logs: err});
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
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
      });
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
          UploadController.uploadFileGeneric(user, filteredFileData, reply,
              request);
        }
        // } else {
        // 	reply({status: false, message: 'No File', forceUpdate: request.pre.forceUpdate}).code(400);
        // }
      } else {
        return reply({status: false, message: 'No documents in request'}); //, forceUpdate: request.pre.forceUpdate});
      }
    }
  }

  static uploadFileGeneric(user, fileData, reply, request) {
    console.log(
        `${Math.random().toString(36).substr(2, 9)}${user.id.toString(36)}`);
    return modals.jobs.create({
      job_id: `${Math.random().toString(36).substr(2, 9)}${user.id.toString(
          36)}`,
      user_id: user.id,
      updated_by: user.id,
      uploaded_by: user.id,
      user_status: 8,
      admin_status: 4,
    }).then((result) => {
      if (Array.isArray(fileData)) {
        const fileNames = [];
        const fileTypes = [];
        const fileTypeDataArray = [];
        const fileUploadPromises = fileData.map((elem, index) => {
          const name = elem.hapi.filename;
          const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
          const fileTypeData = getTypeFromBuffer(elem._data);
          const fileName = `${user.id}-${index +
          1}.${(fileType)
              ? fileType.toString()
              : fileTypeData.ext}`;

          fileNames.push(fileName);
          fileTypes.push(fileType);
          fileTypeDataArray.push(fileTypeData);
          // const file = fs.createReadStream();
          return fsImpl.writeFile(`jobs/${result.job_id}/${fileName}`,
              elem._data,
              {ContentType: mime.lookup(fileName)});
        });
        Promise.all(fileUploadPromises).then((fileResult) => {
          const promisedQuery = fileResult.map((elem, index) => {
            const ret = {
              job_id: result.id,
              file_name: fileNames[index],
              file_type: (fileTypes[index])
                  ? fileTypes[index].toString()
                  : fileTypeDataArray[index].ext,
              status_type: 6,
              updated_by: user.id,
            };
            return modals.jobCopies.create(ret);
          });

          // if (promisedQuery.length === Object.keys(fileData).length) {
          return Promise.all(promisedQuery);
          // }
        }).then(billResult => {
          if (user.email) {
            modals.jobs.count({
              where: {
                uploaded_by: user.id,
              },
            }).then((billCount) => {
              if (billCount === 1) {
                notificationAdaptor.sendMailOnDifferentSteps(
                    'It’s good to see you start building your eHome',
                    user.email, user, 2);
              } else {
                notificationAdaptor.sendMailOnDifferentSteps(
                    'We have received your bill, soon it will be available in your eHome',
                    user.email, user, 3);
              }
            });
          }

          return reply({
            status: true,
            message: 'Uploaded Successfully',
            billResult,
            // forceUpdate: request.pre.forceUpdate
          });
        }).catch((err) => {
          console.log({API_Logs: err});
          return reply({
            status: false,
            message: 'Upload Failed',
            err: JSON.stringify(err),
            // forceUpdate: request.pre.forceUpdate
          }).code(500);
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
          const fileTypeData = getTypeFromBuffer(fileData._data);
          result.updateAttributes({
            file_types: [fileType],
          });
          const fileName = `${user.id}-1.${(fileType)
              ? fileType.toString()
              : fileTypeData.ext}`;

          fsImpl.writeFile(`jobs/${result.job_id}/${fileName}`, fileData._data,
              {ContentType: mime.lookup(fileName)}).then((fileResult) => {
            const ret = {
              job_id: result.id,
              file_name: fileName,
              file_type: (fileType)
                  ? fileType.toString()
                  : fileTypeData.ext,
              status_type: 6,
              updated_by: user.id,
            };

            console.log(fileResult);
            modals.jobCopies.create(ret).then(() => {
              if (user.email) {
                modals.jobs.count({
                  where: {
                    uploaded_by: user.id,
                  },
                }).then((billCount) => {
                  if (billCount === 1) {
                    notificationAdaptor.sendMailOnDifferentSteps(
                        'It’s good to see you start building your eHome',
                        user.email, user, 2);
                  } else {
                    notificationAdaptor.sendMailOnDifferentSteps(
                        'We have received your bill, soon it will be available in your eHome',
                        user.email, user, 3);
                  }
                });
              }
              return reply({
                status: true,
                message: 'Uploaded Successfully',
                // forceUpdate: request.pre.forceUpdate
              });
            }).catch((err) => {
              console.log({API_Logs: err});
              return reply({
                status: false,
                message: 'Data Update Failed',
                err,
                // forceUpdate: request.pre.forceUpdate
              });
            });
          }).catch((err) => {
            console.log({API_Logs: err});
            return reply({status: false, message: 'Upload Failed', err}); //forceUpdate: request.pre.forceUpdate});
          });
        }
      }
    }).catch((err) => {
      console.log('ERR', err);
      return reply({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
    });
  }

  static retrieveFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    /* if (!user) {
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
                `jobs/${result.job_id}/${result.copies[0].file_name}`).
                then(fileResult => {
                  reply(fileResult.Body).
                      header('Content-Type', fileResult.ContentType).
                      header('Content-Disposition',
                          `attachment; filename=${result.bill_copy_name}`);
                }).
                catch((err) => {
                  console.log({API_Logs: err});
                  reply({
                    status: false,
                    message: 'No Result Found',
                    forceUpdate: request.pre.forceUpdate,
                    err,
                  }).code(404);
                });
          } else {
            reply({
              status: false,
              message: 'No Result Found',
              forceUpdate: request.pre.forceUpdate,
            }).code(404);
          }
        }).catch((err) => {
          console.log({API_Logs: err});
          reply({status: false, err, forceUpdate: request.pre.forceUpdate});
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    /*}*/
  }

  static deleteFile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
      });
    } else {
      if (!request.pre.forceUpdate) {
        Promise.all([
          modals.jobs.findById(request.params.id),
          modals.jobCopies.update({
            status_type: 3,
            updated_by: user.id,
          }, {
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
          })]).then((result) => {
          const count = result[2];
          const attributes = count > 0 ? {
            job_id: `${Math.random().
                toString(36).
                substr(2, 9)}${user.id.toString(
                36)}`,
            user_status: 8,
            admin_status: 4,
            updated_by: user.id,
          } : {
            user_status: 3,
            admin_status: 3,
            updated_by: user.id,
          };
          result[0].updateAttributes(attributes);
          reply({
            status: true,
            message: 'File deleted successfully',
            forceUpdate: request.pre.forceUpdate,
          });
        }).catch((err) => {
          console.log({API_Logs: err});
          reply({status: false, err, forceUpdate: request.pre.forceUpdate});
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
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
              console.log({API_Logs: err});
              reply({
                status: false,
                message: 'Unable to retrieve image',
                err,
                forceUpdate: request.pre.forceUpdate,
              });
            });
      }).catch((err) => {
        console.log({API_Logs: err});
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
    if (!user) {
      return reply({
        status: false,
        message: 'Unauthorized',
      });
    } else {
      if (!request.pre.forceUpdate) {
        return userAdaptor.retrieveUserImageNameById(user).
            then((userDetail) => {
              return fsImpl.readFile(userDetail.image_name);
            }).
            then((fileResult) => {
              return reply(fileResult.Body).
                  header('Content-Type', fileResult.ContentType).
                  header('Content-Disposition',
                      `attachment; filename=${fileResult.CopyName}`);
            }).
            catch((err) => {
              console.log({API_Logs: err});
              return reply({
                status: false,
                message: 'No Result Found',
                forceUpdate: request.pre.forceUpdate,
              }).code(404);
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
