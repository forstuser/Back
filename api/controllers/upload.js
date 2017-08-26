/* eslint-disable no-loop-func,no-underscore-dangle */
const uuid = require('uuid');
const S3FS = require('s3fs');
const mime = require('mime-types');

const fsImpl = new S3FS('binbillbucket', {
  accessKeyId: 'AKIAJWC3NVWYOO6YFVVQ',
  secretAccessKey: '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',
  region: 'ap-south-1'
});

const fsImplUser = new S3FS('binbillbucket/userimages', {
  accessKeyId: 'AKIAJWC3NVWYOO6YFVVQ',
  secretAccessKey: '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',
  region: 'ap-south-1'
});

const shared = require('../../helpers/shared');

let modals;

class UploadController {
  constructor(modal) {
    modals = modal;
  }

  static uploadUserImage(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.payload) {
      const fieldNameHere = request.payload.fieldNameHere;
      const fileData = fieldNameHere || request.payload.filesName;

      const name = fileData.hapi.filename;
      const fileType = name.split('.')[name.split('.').length - 1];
      const fileName = `${user.ID}-${new Date().getTime()}.${fileType}`;
      // const file = fs.createReadStream();
      fsImplUser.writeFile(fileName, fileData._data, { ContentType: mime.lookup(fileName) })
        .then((fileResult) => {
          const ret = {
            user_id: user.ID,
            user_image_name: fileName,
            user_image_type: fileType,
            status_id: 1,
            updated_by_user_id: user.ID,
            uploaded_by_id: user.ID
          };

          console.log(fileResult);
          modals.userImages.findOrCreate({
            where: {
              user_id: user.ID
            },
            defaults: ret
          }).then((userResult) => {
            if (!userResult[1]) {
              userResult[0].updateAttributes({ user_image_name: fileName,
                user_image_type: fileType,
                status_id: 1,
                updated_by_user_id: user.ID,
                uploaded_by_id: user.ID
              });
            }

            reply({
              status: true,
              message: 'Uploaded Successfully',
              userResult: userResult[0]
            });
          }).catch((err) => {
            reply({ status: false, message: 'Upload Failed', err });
          });
        }).catch(err => reply({ status: false, message: 'Upload Failed', err }));
    } else {
      reply({ message: 'Invalid OTP' }).code(401);
    }
  }

  static uploadFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.payload) {
      const fieldNameHere = request.payload.fieldNameHere;
      const fileData = fieldNameHere || request.payload.filesName;
      UploadController.uploadFileGeneric(user, fileData, reply);
    }
  }

  static uploadFileGeneric(user, fileData, reply) {
    const promisedQuery = [];
    return modals.consumerBills.create({
      bill_reference_id: uuid.v4(),
      user_id: user.ID,
      updated_by_user_id: user.ID,
      uploaded_by: user.ID,
      user_status: 8,
      admin_status: 4
    }).then((result) => {
      if (Array.isArray(fileData)) {
        for (let i = 0; i < Object.keys(fileData).length; i += 1) {
          if (Object.prototype.hasOwnProperty.call(fileData, i)) {
            const name = fileData[i].hapi.filename;
            const fileType = name.split('.')[name.split('.').length - 1];
            const fileName = `${user.userId}-${result.bill_id}-${new Date().getTime()}.${fileType}`;
            // const file = fs.createReadStream();
            fsImpl.writeFile(fileName, fileData[i]._data, { ContentType: mime.lookup(fileName) })
              .then((fileResult) => {
                const ret = {
                  bill_id: result.bill_id,
                  bill_copy_name: fileName,
                  bill_copy_type: fileType,
                  status_id: 6,
                  updated_by_user_id: user.ID,
                  uploaded_by_id: user.ID
                };

                console.log(fileResult);
                promisedQuery.push(modals.billCopies.create(ret));


                if (promisedQuery.length === Object.keys(fileData).length) {
                  Promise.all(promisedQuery)
                    .then(reply).catch((err) => {
                      reply({ status: false, message: 'Upload Failed', err });
                    });
                }
              }).catch(err => reply({ status: false, message: 'Upload Failed', err: JSON.stringify(err) }).code(500));
          }
        }
      } else {
        const name = fileData.hapi.filename;
        const fileType = name.split('.')[name.split('.').length - 1];
        const fileName = `${user.ID}-${result.bill_id}-${new Date().getTime()}.${fileType}`;
        // const file = fs.createReadStream();
        fsImpl.writeFile(fileName, fileData._data, { ContentType: mime.lookup(fileName) })
          .then((fileResult) => {
            const ret = {
              bill_id: result.bill_id,
              bill_copy_name: fileName,
              bill_copy_type: fileType,
              status_id: 6,
              updated_by_user_id: user.ID,
              uploaded_by_id: user.ID
            };

            console.log(fileResult);
            modals.billCopies.create(ret)
              .then(billResult => reply({
                status: true,
                message: 'Uploaded Successfully',
                billResult
              })).catch((err) => {
                reply({ status: false, message: 'Upload Failed', err });
              });
          }).catch(err => reply({ status: false, message: 'Upload Failed', err }));
      }
    }).catch((err) => {
      reply({ status: false, message: 'Upload Failed', err });
    });
  }

  static retrieveFiles(request, reply) {
    modals.billCopies.findOne({
      where: {
        bill_copy_id: request.params.id
      },
      attributes: { exclude: ['BillID'] }
    }).then((result) => {
      fsImpl.readFile(result.bill_copy_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.bill_copy_name}`)).catch(reply);
    }).catch((err) => {
      reply(err);
    });
  }

  static deleteFile(request, reply) {
    modals.billCopies.update({
      status_id: 3
    }, {
      where: {
        bill_copy_id: request.params.id
      },
      attributes: { exclude: ['BillID'] }
    }).then(() => {
      reply({ status: true, message: 'File deleted successfully' }).code(204);
    }).catch((err) => {
      reply({ status: false, err });
    });
  }

  static retrieveUserImage(request, reply) {
    modals.userImages.findOne({
      where: {
        user_image_id: request.params.id
      }
    }).then((result) => {
      fsImplUser.readFile(result.user_image_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.CopyName}`)).catch((err) => {
        reply({
          status: false,
          message: 'Unable to retrieve image',
          err
        });
      });
    }).catch((err) => {
      reply({
        status: false,
        message: 'Unable to retrieve image',
        err
      });
    });
  }
}

module.exports = UploadController;
