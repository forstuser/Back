'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

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

var _guid = require('guid');

var _guid2 = _interopRequireDefault(_guid);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fsImpl = new _s3fs2.default(_main2.default.AWS.S3.BUCKET, _main2.default.AWS.ACCESS_DETAILS);

var ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'rtf', 'xls', 'xlsx', 'png', 'bmp', 'jpg', 'jpeg', 'heif', 'heic'];

var categoryImageType = ['xxhdpi', 'xxhdpi-small'];

var isFileTypeAllowed = function isFileTypeAllowed(fileTypeData) {
  console.log('FILE TYPE DATA: ' + fileTypeData);
  if (fileTypeData) {
    var filetype = fileTypeData.toString().toLowerCase();
    // console.log(filetype);
    return ALLOWED_FILE_TYPES.indexOf(filetype) > -1;
  }
  console.log('HERE');
  return false;
};

var isFileTypeAllowedMagicNumber = function isFileTypeAllowedMagicNumber(buffer) {
  console.log('GOT BUFFER');
  var result = (0, _fileType2.default)(buffer);
  return ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1;
};

var getTypeFromBuffer = function getTypeFromBuffer(buffer) {
  return (0, _fileType2.default)(buffer);
};
var modals = void 0;
var userAdaptor = void 0;
var jobAdaptor = void 0;
var amcAdaptor = void 0;
var warrantyAdaptor = void 0;
var insuranceAdaptor = void 0;
var repairAdaptor = void 0;
var pucAdaptor = void 0;
var productAdaptor = void 0;

var UploadController = function () {
  function UploadController(modal) {
    _classCallCheck(this, UploadController);

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

  _createClass(UploadController, null, [{
    key: 'uploadUserImage',
    value: function uploadUserImage(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized'
          // forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else if (request.payload) {
        return modals.users.findOne({
          where: {
            id: user.id || user.ID
          }
        }).then(function (userResult) {
          var userDetail = userResult.toJSON();
          fsImpl.unlink(userDetail.image_name).catch(function (err) {
            console.log('Error while deleting ' + userDetail.image_name + ' on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          });
          var fieldNameHere = request.payload.fieldNameHere;
          var fileData = fieldNameHere || request.payload.filesName;

          var name = fileData.hapi.filename;
          var file_type = name.split('.')[name.split('.').length - 1];
          var fileName = 'active-' + (user.id || user.ID) + '-' + new Date().getTime() + '.' + file_type;
          // const file = fs.createReadStream();
          return fsImpl.writeFile(fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) }).then(function (fileResult) {

            return userAdaptor.updateUserDetail({
              image_name: fileName
            }, {
              where: {
                id: user.id || user.ID
              }
            });
          }).then(function () {
            return reply({
              status: true,
              message: 'Uploaded Successfully'
            });
          }).catch(function (err) {
            console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
            return reply({
              status: false,
              message: 'Upload Failed',
              err: err
              // forceUpdate: request.pre.forceUpdate
            });
          });
        });
      } else {
        return reply({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
      }
    }
  }, {
    key: 'uploadProductImage',
    value: function uploadProductImage(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized'
          // forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else if (request.payload) {
        return modals.products.findOne({
          where: {
            id: request.params.id,
            user_id: user.id || user.ID
          }
        }).then(function (productResult) {
          if (productResult) {
            var productDetail = productResult.toJSON();
            var fieldNameHere = request.payload.fieldNameHere;
            var fileData = fieldNameHere || request.payload.filesName;

            var name = fileData.hapi.filename;
            var file_type = name.split('.')[name.split('.').length - 1];
            var fileName = productDetail.id + '.' + file_type;
            // const file = fs.createReadStream();

            var fsImplProduct = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.PRODUCT_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
            return _bluebird2.default.try(function () {
              return fsImplProduct.writeFile(fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) });
            }).then(function () {

              return productResult.updateAttributes({ file_type: file_type });
            }).then(function () {
              return reply({
                status: true,
                message: 'Uploaded Successfully'
              });
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
              return reply({
                status: false,
                message: 'Upload Failed',
                err: err
                // forceUpdate: request.pre.forceUpdate
              });
            });
          }

          return reply({
            status: false,
            message: 'Invalid Product Id Upload Failed',
            err: err
            // forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        return reply({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
      }
    }
  }, {
    key: 'uploadFiles',
    value: function uploadFiles(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized'
        }).code(401);
      } else if (request.payload) {
        console.log('Request received to upload file by user_id ', user.id || user.ID);
        // if (!request.pre.forceUpdate && request.payload) {
        var fieldNameHere = request.payload.fieldNameHere;
        var fileData = fieldNameHere || request.payload.filesName || request.payload.file;

        var filteredFileData = fileData;
        if (filteredFileData) {
          if (Array.isArray(filteredFileData)) {
            filteredFileData = fileData.filter(function (datum) {
              var name = datum.hapi.filename;
              var file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
              if (file_type && !isFileTypeAllowed(file_type)) {
                return false;
              } else if (!file_type && !isFileTypeAllowedMagicNumber(datum._data)) {
                return false;
              }

              return true;
            });
          } else {
            var name = filteredFileData.hapi.filename;
            console.log('\n\n\n', name);
            var file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
            // console.log("OUTSIDE FILE ALLOWED: ", file_type);
            if (file_type && !isFileTypeAllowed(file_type)) {
              filteredFileData = [];
            } else if (!file_type && !isFileTypeAllowedMagicNumber(filteredFileData._data)) {
              filteredFileData = [];
            }
          }

          if (filteredFileData.length === 0) {
            console.log('No valid documents in request');
            return reply({ status: false, message: 'No valid documents in request' });
          } else {
            if (request.params && request.params.id) {
              console.log('Request received has JOB ID ' + request.params.id + ' to upload file by user_id ' + (user.id || user.ID));
              return UploadController.retrieveJobCreateCopies({
                user: user,
                fileData: fileData,
                reply: reply,
                request: request
              }).catch(function (err) {
                console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
                return reply({ status: false, message: 'Unable to upload document' });
              });
            }

            console.log('Request received to create new job to upload file by user_id ' + (user.id || user.ID));
            return UploadController.createJobWithCopies({
              user: user,
              fileData: filteredFileData,
              reply: reply,
              request: request
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
              return reply({ status: false, message: 'Unable to upload document' });
            });
          }
          // } else {
          // 	reply({status: false, message: 'No File', forceUpdate: request.pre.forceUpdate}).code(400);
          // }
        } else {
          return reply({ status: false, message: 'No documents in request' }); //, forceUpdate: request.pre.forceUpdate});
        }
      }
    }
  }, {
    key: 'retrieveJobCreateCopies',
    value: function retrieveJobCreateCopies(parameters) {
      var user = parameters.user,
          fileData = parameters.fileData,
          reply = parameters.reply,
          request = parameters.request;

      return jobAdaptor.retrieveJobDetail(request.params.id, true).then(function (jobResult) {
        console.log('JOB detail is as follow' + JSON.stringify({ jobResult: jobResult }));
        if (Array.isArray(fileData)) {
          console.log('Request has multiple files');
          return UploadController.uploadArrayOfFile({
            requiredDetail: {
              fileData: fileData,
              user: user,
              result: jobResult,
              type: request.query ? parseInt(request.query.type || '1') : 1,
              itemId: request.query ? request.query.itemid : undefined
            }, reply: reply
          });
        } else {
          console.log('Request has single file ' + fileData.hapi.filename);
          var name = fileData.hapi.filename;
          var file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
          // console.log("OUTSIDE FILE ALLOWED: ", file_type);
          if (file_type && !isFileTypeAllowed(file_type)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else if (!file_type && !isFileTypeAllowedMagicNumber(fileData._data)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else {
            return UploadController.uploadSingleFile({
              requiredDetail: {
                fileData: fileData,
                result: jobResult,
                fileType: file_type,
                user: user,
                type: request.query ? parseInt(request.query.type || '1') : 1,
                itemId: request.query ? request.query.itemid : undefined
              }, reply: reply
            });
          }
        }
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false, message: 'Upload Failed', err: err }); // , forceUpdate: request.pre.forceUpdate});
      });
    }
  }, {
    key: 'createJobWithCopies',
    value: function createJobWithCopies(parameters) {
      var user = parameters.user,
          fileData = parameters.fileData,
          reply = parameters.reply,
          request = parameters.request;

      return jobAdaptor.createJobs({
        job_id: '' + Math.random().toString(36).substr(2, 9) + (user.id || user.ID).toString(36),
        user_id: user.id || user.ID,
        updated_by: user.id || user.ID,
        uploaded_by: user.id || user.ID,
        user_status: 8,
        admin_status: 4,
        comments: request.query ? request.query.productId ? 'This job is sent for product id ' + request.query.productId : request.query.productName ? 'This job is sent for product name ' + request.query.productName : '' : ''
      }).then(function (jobResult) {
        jobResult.copies = [];
        if (Array.isArray(fileData)) {
          return UploadController.uploadArrayOfFile({
            requiredDetail: {
              fileData: fileData,
              user: user,
              result: jobResult,
              type: request.query ? parseInt(request.query.type || '1') : 1,
              itemId: request.query ? request.query.itemid : undefined,
              productId: request.query ? request.query.productid : undefined
            }, reply: reply
          });
        } else {
          var name = fileData.hapi.filename;
          var file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
          // console.log("OUTSIDE FILE ALLOWED: ", file_type);
          if (file_type && !isFileTypeAllowed(file_type)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else if (!file_type && !isFileTypeAllowedMagicNumber(fileData._data)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else {
            return UploadController.uploadSingleFile({
              requiredDetail: {
                fileData: fileData, result: jobResult, fileType: file_type,
                user: user, type: request.query ? request.query.type || 1 : 1,
                itemId: request.query ? request.query.itemid : undefined,
                productId: request.query ? request.query.productid : undefined
              }, reply: reply
            });
          }
        }
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false, message: 'Upload Failed', err: err }); // , forceUpdate: request.pre.forceUpdate});
      });
    }
  }, {
    key: 'uploadSingleFile',
    value: function uploadSingleFile(parameters) {
      console.log('Single File Upload');
      var requiredDetail = parameters.requiredDetail,
          reply = parameters.reply;

      var user = requiredDetail.user;
      var fileData = requiredDetail.fileData;
      var jobResult = requiredDetail.result;
      var type = requiredDetail.type;
      var file_type = requiredDetail.fileType;
      var fileTypeData = getTypeFromBuffer(fileData._data);
      var fileName = (user.id || user.ID) + '-' + (jobResult.copies.length + 1) + '.' + (file_type ? file_type.toString() : fileTypeData.ext);
      console.log(_mimeTypes2.default.lookup(fileName));
      return fsImpl.writeFile('jobs/' + jobResult.job_id + '/' + fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) || 'image/jpeg' }).then(function (fileResult) {
        var jobCopyDetail = {
          job_id: jobResult.id,
          file_name: fileName,
          file_type: file_type ? file_type.toString() : fileTypeData.ext,
          status_type: 6,
          updated_by: user.id || user.ID,
          type: type
        };
        var copyData = void 0;
        return jobAdaptor.createJobCopies(jobCopyDetail).then(function (copyResult) {
          copyData = [copyResult];
          return modals.users.findById(user.id || user.ID);
        }).then(function () {
          UploadController.notifyTeam(user, jobResult);

          if (type && (requiredDetail.productId || jobResult.productId)) {
            return UploadController.createProductItems({
              type: type,
              jobId: jobResult.id,
              user: user,
              productId: requiredDetail.productId || jobResult.productId,
              itemId: requiredDetail.itemId,
              copies: copyData.map(function (copyItem) {
                return {
                  copyId: copyItem.id,
                  copyUrl: '/jobs/' + copyItem.job_id + '/files/' + copyItem.id,
                  file_type: copyItem.file_type,
                  jobId: copyItem.job_id,
                  copyName: copyItem.file_name
                };
              })
            });
          }

          return undefined;
        }).then(function (productItemResult) {
          return UploadController.uploadResponse(jobResult, copyData, productItemResult, type, reply);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Data Update Failed',
            err: err
            // forceUpdate: request.pre.forceUpdate
          });
        });
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false, message: 'Upload Failed', err: err }); //forceUpdate: request.pre.forceUpdate});
      });
    }
  }, {
    key: 'uploadArrayOfFile',
    value: function uploadArrayOfFile(parameters) {
      console.log('Multiple File Upload');
      var requiredDetail = parameters.requiredDetail,
          reply = parameters.reply;

      var jobCopies = void 0;
      var fileNames = [];
      var fileTypes = [];
      var fileTypeDataArray = [];
      var user = requiredDetail.user;
      var fileData = requiredDetail.fileData;
      var jobResult = requiredDetail.result;
      var type = requiredDetail.type;
      var fileUploadPromises = fileData.map(function (elem, index) {
        index = jobResult.copies.length + index;
        var name = elem.hapi.filename;
        var file_type = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
        var fileTypeData = getTypeFromBuffer(elem._data);
        var fileName = (user.id || user.ID) + '-' + (index + 1) + '.' + (file_type ? file_type.toString() : fileTypeData.ext);

        fileNames.push(fileName);
        fileTypes.push(file_type);
        fileTypeDataArray.push(fileTypeData);
        // const file = fs.createReadStream();
        return fsImpl.writeFile('jobs/' + jobResult.job_id + '/' + fileName, elem._data, { ContentType: _mimeTypes2.default.lookup(fileName) || 'image/jpeg' });
      });
      _bluebird2.default.all(fileUploadPromises).then(function (fileResult) {
        var promisedQuery = [];
        var jobPromise = fileResult.map(function (elem, index) {
          var jobCopyDetail = {
            job_id: jobResult.id,
            file_name: fileNames[index],
            file_type: fileTypes[index] ? fileTypes[index].toString() : fileTypeDataArray[index].ext,
            status_type: 6,
            updated_by: user.id || user.ID,
            type: type
          };
          return jobAdaptor.createJobCopies(jobCopyDetail);
        });

        promisedQuery.push(_bluebird2.default.all(jobPromise));
        promisedQuery.push(modals.users.findById(user.id || user.ID));
        // if (promisedQuery.length === Object.keys(fileData).length) {
        return _bluebird2.default.all(promisedQuery);
        // }
      }).then(function (billResult) {
        jobCopies = billResult[0];
        var userResult = billResult[billResult.length - 1];

        UploadController.notifyTeam(user, jobResult);

        if (type && (requiredDetail.productId || jobResult.productId)) {
          return UploadController.createProductItems({
            type: type,
            jobId: jobResult.id,
            user: user,
            productId: requiredDetail.productId || jobResult.productId,
            itemId: requiredDetail.itemId,
            copies: jobCopies.map(function (copyItem) {
              return {
                copyId: copyItem.id,
                copyUrl: '/jobs/' + copyItem.job_id + '/files/' + copyItem.id,
                file_type: copyItem.file_type,
                jobId: copyItem.job_id,
                copyName: copyItem.file_name
              };
            })
          });
        }

        return undefined;
      }).then(function (productItemResult) {
        return UploadController.uploadResponse(jobResult, jobCopies, productItemResult, type, reply);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({
          status: false,
          message: 'Upload Failed',
          err: JSON.stringify(err)
          // forceUpdate: request.pre.forceUpdate
        }).code(500);
      });
    }
  }, {
    key: 'uploadResponse',
    value: function uploadResponse(jobResult, copyData, productItemResult, type, reply) {
      var replyResult = {
        status: true,
        job_id: jobResult.id,
        message: 'Uploaded Successfully',
        billResult: copyData
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
  }, {
    key: 'createProductItems',
    value: function createProductItems(parameters) {
      var type = parameters.type,
          jobId = parameters.jobId,
          user = parameters.user,
          productId = parameters.productId,
          itemId = parameters.itemId,
          copies = parameters.copies;

      var productItemPromise = [];
      switch (type) {
        case 2:
          productItemPromise.push(!itemId ? amcAdaptor.createAMCs({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies
          }) : amcAdaptor.updateAMCs(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies
          }));
          break;

        case 3:
          productItemPromise.push(!itemId ? insuranceAdaptor.createInsurances({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies
          }) : insuranceAdaptor.updateInsurances(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies
          }));
          break;

        case 4:
          productItemPromise.push(!itemId ? repairAdaptor.createRepairs({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies
          }) : repairAdaptor.updateRepairs(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies
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
            copies: copies
          }) : warrantyAdaptor.updateWarranties(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            warranty_type: 1,
            copies: copies
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
            copies: copies
          }) : warrantyAdaptor.updateWarranties(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            warranty_type: 3,
            copies: copies
          }));
          break;
        case 7:
          productItemPromise.push(!itemId ? pucAdaptor.createPUCs({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies
          }) : pucAdaptor.updatePUCs(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies
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
            copies: copies
          }) : warrantyAdaptor.updateWarranties(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            warranty_type: 2,
            copies: copies
          }));
          break;
        default:
          productItemPromise.push(productAdaptor.updateProduct(productId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies
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

      return _bluebird2.default.all(productItemPromise);
    }
  }, {
    key: 'mailUserForJob',
    value: function mailUserForJob(userResult, user) {
      modals.jobs.count({
        where: {
          uploaded_by: userResult.id || userResult.ID
        }
      }).then(function (billCount) {
        if (billCount === 1) {
          _notification2.default.sendMailOnDifferentSteps('It’s good to see you start building your eHome', userResult.email, userResult, 2);
        } else {
          _notification2.default.sendMailOnDifferentSteps('We have received your bill, soon it will be available in your eHome', userResult.email, userResult, 3);
        }
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n ' + JSON.stringify(err) + ' \n email is ' + userResult.email);
      });
    }
  }, {
    key: 'notifyTeam',
    value: function notifyTeam(user, result) {
      if (process.env.NODE_ENV === 'production') {
        _notification2.default.sendMailOnUpload(_main2.default.MESSAGE, 'sagar@binbill.com;pranjal@binbill.com;anu.gupta@binbill.com', user, result.id);
      }
    }
  }, {
    key: 'retrieveFiles',
    value: function retrieveFiles(request, reply) {
      /* const user = shared.verifyAuthorization(request.headers);
       if (!request.pre.userExist) {
          reply({
            status: false,
            message: 'Unauthorized',
          });
       } else {*/
      if (!request.pre.forceUpdate) {
        modals.jobs.findById(request.params.id, {
          include: [{
            model: modals.jobCopies,
            as: 'copies',
            where: {
              id: request.params.copyid
            },
            required: true
          }]
        }).then(function (result) {
          if (result) {
            fsImpl.readFile(_guid2.default.isGuid(result.job_id) ? '' + result.copies[0].file_name : 'jobs/' + result.job_id + '/' + result.copies[0].file_name).then(function (fileResult) {
              return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.bill_copy_name);
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' while retrieving image is as follow: \n \n ' + err);
              return fsImpl.readFile('jobs/' + result.job_id + '/' + result.copies[0].file_name).then(function (fileResult) {
                return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.bill_copy_name);
              }).catch(function (err) {
                console.log('Error on ' + new Date() + ' while retrieving image is as follow: \n \n ' + err);
                return reply({
                  status: false,
                  message: 'No Result Found',
                  forceUpdate: request.pre.forceUpdate,
                  err: err
                }).code(404);
              });
            });
          } else {
            return reply({
              status: false,
              message: 'No Result Found',
              forceUpdate: request.pre.forceUpdate
            }).code(404);
          }
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({ status: false, err: err, forceUpdate: request.pre.forceUpdate });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
      // }
    }

    //Will required to be change if discard is required

  }, {
    key: 'deleteFile',
    value: function deleteFile(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized'
        }).code(401);
      } else {
        if (!request.pre.forceUpdate) {
          var itemId = request.query && request.query.itemid ? request.query.itemid : undefined;

          _bluebird2.default.all([modals.jobs.findById(request.params.id, {
            include: [{
              model: modals.jobCopies,
              as: 'copies',
              required: true
            }]
          }), modals.jobCopies.update({
            status_type: 3,
            updated_by: user.id || user.ID
          }, {
            where: {
              id: request.params.copyid,
              job_id: request.params.id
            }
          }), modals.jobCopies.count({
            where: {
              id: {
                $ne: request.params.copyid
              },
              job_id: request.params.id,
              status_type: {
                $notIn: [3, 9]
              }
            }
          }), itemId ? UploadController.updateOrDeleteProductItems({
            type: parseInt(request.query.type || '1'),
            jobId: request.params.id,
            user: user,
            itemId: itemId,
            copyId: request.params.copyid
          }) : '']).then(function (result) {
            var count = result[2];
            var attributes = count > 0 ? {
              user_status: 8,
              admin_status: 4,
              ce_status: null,
              qe_status: null,
              updated_by: user.id || user.ID
            } : {
              user_status: 8,
              admin_status: 2,
              ce_status: null,
              qe_status: null,
              updated_by: user.id || user.ID
            };
            var copiesData = result[0].copies.find(function (copyItem) {
              return copyItem.id.toString() === request.params.copyid.toString();
            });
            if (copiesData) {
              fsImpl.unlink(copiesData.file_name).catch(function (err) {
                console.log('Error while deleting ' + copiesData.file_name + ' on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
              });
              fsImpl.unlink('jobs/' + result[0].job_id + '/' + copiesData.file_name).catch(function (err) {
                console.log('Error while deleting jobs/' + result[0].job_id + '/' + copiesData.file_name + ' on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
              });
            }
            var jobItem = result[0].toJSON();
            if (jobItem.admin_status !== 5) {
              result[0].updateAttributes(attributes);
            }

            var deletionResponse = {
              status: true,
              message: result[3][0] === true ? 'Product item deleted successfully' : result[3][0] && itemId ? 'File deleted successfully from product item' : 'File deleted successfully',
              isProductItemDeleted: result[3][0] === true,
              productItemCopiesCount: result[3][0] && result[3][0] !== true ? result[3][0].copies.length : 0,
              productItem: result[3][0] && result[3][0] !== true ? result[3][0] : undefined,
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

            return reply(deletionResponse);
          }).catch(function (err) {
            console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
            return reply({ status: false, err: err, forceUpdate: request.pre.forceUpdate });
          });
        } else {
          return reply({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate
          });
        }
      }
    }
  }, {
    key: 'updateOrDeleteProductItems',
    value: function updateOrDeleteProductItems(parameters) {
      var type = parameters.type,
          jobId = parameters.jobId,
          user = parameters.user,
          itemId = parameters.itemId,
          copyId = parameters.copyId;

      var productItemPromise = [];
      switch (type) {
        case 2:
          productItemPromise.push(amcAdaptor.removeAMCs(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;

        case 3:
          productItemPromise.push(insuranceAdaptor.removeInsurances(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;

        case 4:
          productItemPromise.push(repairAdaptor.removeRepairs(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;
        case 5:
          productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;

        case 6:
          productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;
        case 7:
          productItemPromise.push(pucAdaptor.removePUCs(itemId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;
        case 8:
          productItemPromise.push(warrantyAdaptor.removeWarranties(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;
        default:
          productItemPromise.push(productAdaptor.removeProducts(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID
          }));
          break;
      }

      return _bluebird2.default.all(productItemPromise);
    }
  }, {
    key: 'retrieveCategoryImage',
    value: function retrieveCategoryImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplCategory = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.CATEGORY_IMAGE + '/' + categoryImageType[request.params.type || 0], _main2.default.AWS.ACCESS_DETAILS);
        modals.categories.findOne({
          where: {
            category_id: request.params.id
          }
        }).then(function (result) {
          return fsImplCategory.readFile(result.category_image_name, 'utf8').then(function (fileResult) {
            return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.CopyName);
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user while retrieving category image is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Unable to retrieve image',
            err: err,
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveProductImage',
    value: function retrieveProductImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplProduct = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.PRODUCT_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
        return modals.products.findOne({
          where: {
            id: request.params.id
          }
        }).then(function (productResult) {
          if (productResult) {
            var productDetail = productResult.toJSON();
            return fsImplProduct.readFile(request.params.id + '.' + productDetail.file_type, 'utf8').then(function (fileResult) {
              return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + request.params.id + '.' + productDetail.file_type);
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' for user while retrieving product item image is as follow: \n \n ' + err);
              return reply({
                status: false,
                message: 'Unable to retrieve image',
                err: err,
                forceUpdate: request.pre.forceUpdate
              });
            });
          }
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveCalendarItemImage',
    value: function retrieveCalendarItemImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplCategory = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.CALENDAR_ITEM_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
        return fsImplCategory.readFile(request.params.id + '.png', 'utf8').then(function (fileResult) {
          return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + request.params.id + '.png');
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user while retrieving calendar item image is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Unable to retrieve image',
            err: err,
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveBrandImage',
    value: function retrieveBrandImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplBrand = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.BRAND_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
        fsImplBrand.readFile(request.params.id + '.png', 'utf8').then(function (fileResult) {
          return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + request.params.id + '.png');
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' retrieving brand image is as follow: \n \n ' + err);
          reply({
            status: false,
            message: 'Unable to retrieve image',
            err: err,
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveProviderImage',
    value: function retrieveProviderImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplBrand = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.PROVIDER_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
        fsImplBrand.readFile(request.params.id + '.png', 'utf8').then(function (fileResult) {
          return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + request.params.id + '.png');
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' retrieving provider image is as follow: \n \n ' + err);
          reply({
            status: false,
            message: 'Unable to retrieve image',
            err: err,
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveKnowItemImage',
    value: function retrieveKnowItemImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplBrand = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.KNOW_ITEM_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
        fsImplBrand.readFile(request.params.id + '.png', 'utf8').then(function (fileResult) {
          return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + request.params.id + '.png');
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' retrieving fact image is as follow: \n \n ' + err);
          reply({
            status: false,
            message: 'Unable to retrieve image',
            err: err,
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveUserImage',
    value: function retrieveUserImage(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized'
        }).code(401);
      } else {
        if (!request.pre.forceUpdate) {
          var userData = void 0;
          return userAdaptor.retrieveUserImageNameById(user).then(function (userDetail) {
            userData = userDetail;
            return fsImpl.readFile(userDetail.image_name);
          }).then(function (fileResult) {
            return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + fileResult.CopyName);
          }).catch(function (err) {
            console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
            var fsImplUser = new _s3fs2.default(_main2.default.AWS.S3.BUCKET + '/' + _main2.default.AWS.S3.USER_IMAGE, _main2.default.AWS.ACCESS_DETAILS);
            return fsImplUser.readFile(userData.image_name).then(function (fileResult) {
              return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + fileResult.CopyName);
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n ' + JSON.stringify(err.toJSON()));
              return reply({
                status: false,
                message: 'No Result Found',
                forceUpdate: request.pre.forceUpdate
              }).code(404);
            });
          });
        } else {
          return reply({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate
          });
        }
      }
    }
  }]);

  return UploadController;
}();

exports.default = UploadController;