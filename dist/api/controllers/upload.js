'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fileType5 = require('file-type');

var _fileType6 = _interopRequireDefault(_fileType5);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fsImpl = new _s3fs2.default(_main2.default.AWS.S3.BUCKET, _main2.default.AWS.ACCESS_DETAILS);

var ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'rtf', 'xls', 'xlsx', 'png', 'bmp', 'jpg', 'jpeg'];

var categoryImageType = ['xxhdpi', 'xxhdpi-small'];

var isFileTypeAllowed = function isFileTypeAllowed(fileTypeData) {
  // console.log("FILE TYPE DATA: " + fileTypeData);
  if (fileTypeData) {
    var filetype = fileTypeData.toString().toLowerCase();
    // console.log(filetype);
    return ALLOWED_FILE_TYPES.indexOf(filetype) > -1;
  }
  console.log('HERE');
  return false;
};

var isFileTypeAllowedMagicNumber = function isFileTypeAllowedMagicNumber(buffer) {
  // console.log("GOT BUFFER");
  var result = (0, _fileType6.default)(buffer);
  return ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1;
};

var getTypeFromBuffer = function getTypeFromBuffer(buffer) {
  return (0, _fileType6.default)(buffer);
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
        var fieldNameHere = request.payload.fieldNameHere;
        var fileData = fieldNameHere || request.payload.filesName;

        var name = fileData.hapi.filename;
        var _fileType = name.split('.')[name.split('.').length - 1];
        var fileName = 'active-' + (user.id || user.ID) + '-' + new Date().getTime() + '.' + _fileType;
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
        // if (!request.pre.forceUpdate && request.payload) {
        var fieldNameHere = request.payload.fieldNameHere;
        var fileData = fieldNameHere || request.payload.filesName || request.payload.file;

        var filteredFileData = fileData;
        // console.log("BEFORE FILTERING: ", filteredFileData);
        if (filteredFileData) {
          if (Array.isArray(filteredFileData)) {
            filteredFileData = fileData.filter(function (datum) {
              var name = datum.hapi.filename;
              var fileType = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
              if (fileType && !isFileTypeAllowed(fileType)) {
                return false;
              } else if (!fileType && !isFileTypeAllowedMagicNumber(datum._data)) {
                return false;
              }

              return true;
            });
          } else {
            var name = filteredFileData.hapi.filename;
            var _fileType2 = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
            // console.log("OUTSIDE FILE ALLOWED: ", fileType);
            if (_fileType2 && !isFileTypeAllowed(_fileType2)) {
              filteredFileData = [];
            } else if (!_fileType2 && !isFileTypeAllowedMagicNumber(filteredFileData._data)) {
              filteredFileData = [];
            }
          }

          if (filteredFileData.length === 0) {
            console.log('No valid documents in request');
            return reply({ status: false, message: 'No valid documents in request' });
          } else {
            if (request.params && request.params.id) {
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

      return jobAdaptor.retrieveJobDetail(request.params.id, true).
          then(function(jobResult) {
        if (Array.isArray(fileData)) {
          return UploadController.uploadArrayOfFile({
            requiredDetail: {
              fileData: fileData,
              user: user,
              result: jobResult,
              type: request.query ? parseInt(request.query.type || '1') : 1,
              itemId: request.query ? request.query.itemid : undefined,
            }, reply: reply
          });
        } else {
          var name = fileData.hapi.filename;
          var _fileType3 = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
          // console.log("OUTSIDE FILE ALLOWED: ", fileType);
          if (_fileType3 && !isFileTypeAllowed(_fileType3)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else if (!_fileType3 && !isFileTypeAllowedMagicNumber(fileData._data)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else {
            return UploadController.uploadSingleFile({
              requiredDetail: {
                fileData: fileData,
                result: jobResult,
                fileType: _fileType3,
                user: user,
                type: request.query ? parseInt(request.query.type || '1') : 1,
                itemId: request.query ? request.query.itemid : undefined,
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
        if (Array.isArray(fileData)) {
          return UploadController.uploadArrayOfFile({
            requiredDetail: {
              fileData: fileData,
              user: user,
              result: jobResult,
              type: request.query ? request.query.type || 1 : 1,
              itemId: request.query ? request.query.itemid : undefined,
              productId: request.query ? request.query.productid : undefined,
            }, reply: reply
          });
        } else {
          var name = fileData.hapi.filename;
          var _fileType4 = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
          // console.log("OUTSIDE FILE ALLOWED: ", fileType);
          if (_fileType4 && !isFileTypeAllowed(_fileType4)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else if (!_fileType4 && !isFileTypeAllowedMagicNumber(fileData._data)) {
            return reply({ status: false, message: 'Data Upload Failed' });
          } else {
            return UploadController.uploadSingleFile({
              requiredDetail: {
                fileData: fileData, result: jobResult, fileType: _fileType4,
                user: user, type: request.query ? request.query.type || 1 : 1,
                itemId: request.query ? request.query.itemid : undefined,
                productId: request.query ? request.query.productid : undefined,
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
      var fileType = requiredDetail.fileType;
      var fileTypeData = getTypeFromBuffer(fileData._data);
      var fileName = (user.id || user.ID) + '-' +
          (jobResult.copies.length + 1) + '.' +
          (fileType ? fileType.toString() : fileTypeData.ext);

      return fsImpl.writeFile('jobs/' + jobResult.job_id + '/' + fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) }).then(function (fileResult) {
        var jobCopyDetail = {
          job_id: jobResult.id,
          file_name: fileName,
          file_type: fileType ? fileType.toString() : fileTypeData.ext,
          status_type: 6,
          updated_by: user.id || user.ID,
          type: type,
        };
        var copyData = void 0;
        return jobAdaptor.createJobCopies(jobCopyDetail).then(function (copyResult) {
          copyData = [copyResult];
          return modals.users.findById(user.id || user.ID);
        }).then(function (userResult) {
          if (userResult.email) {
            UploadController.mailUserForJob(userResult, user);
          }

          UploadController.notifyTeam(user, jobResult);

          if (type && (requiredDetail.productId || jobResult.productId)) {
            return UploadController.createProductItems({
              type: type,
              jobId: jobResult.id,
              user: user,
              productId: requiredDetail.productId || jobResult.productId,
              itemId: requiredDetail.itemId,
              copies: copyData.map(function(copyItem) {
                return {
                  copyId: copyItem.id,
                  copyUrl: '/jobs/' + copyItem.job_id + '/files/' + copyItem.id,
                  file_type: copyItem.file_type,
                  jobId: copyItem.job_id,
                  copyName: copyItem.file_name,
                };
              })
            });
          }

          return undefined;
        }).then(function (productItemResult) {
          return UploadController.uploadResponse(jobResult, copyData,
              productItemResult, type, reply);
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
        var fileType = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
        var fileTypeData = getTypeFromBuffer(elem._data);
        var fileName = (user.id || user.ID) + '-' + (index + 1) + '.' + (fileType ? fileType.toString() : fileTypeData.ext);

        fileNames.push(fileName);
        fileTypes.push(fileType);
        fileTypeDataArray.push(fileTypeData);
        // const file = fs.createReadStream();
        return fsImpl.writeFile('jobs/' + jobResult.job_id + '/' + fileName, elem._data, { ContentType: _mimeTypes2.default.lookup(fileName) });
      });
      Promise.all(fileUploadPromises).then(function (fileResult) {
        var promisedQuery = [];
        var jobPromise = fileResult.map(function(elem, index) {
          var jobCopyDetail = {
            job_id: jobResult.id,
            file_name: fileNames[index],
            file_type: fileTypes[index] ? fileTypes[index].toString() : fileTypeDataArray[index].ext,
            status_type: 6,
            updated_by: user.id || user.ID,
            type: type,
          };
          return jobAdaptor.createJobCopies(jobCopyDetail);
        });

        promisedQuery.push(Promise.all(jobPromise));
        promisedQuery.push(modals.users.findById(user.id || user.ID));
        // if (promisedQuery.length === Object.keys(fileData).length) {
        return Promise.all(promisedQuery);
        // }
      }).then(function (billResult) {
        jobCopies = billResult[0];
        var userResult = billResult[billResult.length - 1];
        if (userResult.email) {
          UploadController.mailUserForJob(userResult, user);
        }

        UploadController.notifyTeam(user, jobResult);

        if (type && (requiredDetail.productId || jobResult.productId)) {
          return UploadController.createProductItems({
            type: type,
            jobId: jobResult.id,
            user: user,
            productId: requiredDetail.productId || jobResult.productId,
            itemId: requiredDetail.itemId,
            copies: copyData.map(function(copyItem) {
              return {
                copyId: copyItem.id,
                copyUrl: '/jobs/' + copyItem.job_id + '/files/' + copyItem.id,
                file_type: copyItem.file_type,
                jobId: copyItem.job_id,
                copyName: copyItem.file_name,
              };
            })
          });
        }

        return undefined;
      }).then(function (productItemResult) {
        return UploadController.uploadResponse(jobResult, jobCopies,
            productItemResult, type, reply);
      }).catch(function(err) {
        console.log('Error on ' + new Date() + ' for user ' +
            (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({
          status: false,
          message: 'Upload Failed',
          err: JSON.stringify(err),
          // forceUpdate: request.pre.forceUpdate
        }).code(500);
      });
    }
  }, {
    key: 'uploadResponse',
    value: function uploadResponse(
        jobResult, copyData, productItemResult, type, reply) {
      var replyResult = {
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
            copies: copies,
          }) : amcAdaptor.updateAMCs(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies,
          }));
          break;

        case 3:
          productItemPromise.push(!itemId ? insuranceAdaptor.createInsurances({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies,
          }) : insuranceAdaptor.updateInsurances(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies,
          }));
          break;

        case 4:
          productItemPromise.push(!itemId ? repairAdaptor.createRepairs({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies,
          }) : repairAdaptor.updateRepairs(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies,
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
            copies: copies,
          }) : warrantyAdaptor.updateWarranties(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            warranty_type: 1,
            copies: copies,
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
            copies: copies,
          }) : warrantyAdaptor.updateWarranties(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            warranty_type: 3,
            copies: copies,
          }));
          break;
        case 7:
          productItemPromise.push(!itemId ? pucAdaptor.createPUCs({
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            status_type: 8,
            copies: copies,
          }) : pucAdaptor.updatePUCs(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies,
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
            copies: copies,
          }) : warrantyAdaptor.updateWarranties(itemId, {
            job_id: jobId,
            product_id: productId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            warranty_type: 2,
            copies: copies,
          }));
          break;
        default:
          productItemPromise.push(productAdaptor.updateProduct(productId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            copies: copies,
          }));
          break;
      }

      if (type > 1 && type < 8) {
        productItemPromise.push(productAdaptor.updateProduct(productId, {
          job_id: jobId,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
        }));
      }

      return Promise.all(productItemPromise);
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
              return reply(fileResult.Body).
                  header('Content-Type', fileResult.ContentType).
                  header('Content-Disposition', 'attachment; filename=' +
                      result.bill_copy_name);
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
              return reply({
                status: false,
                message: 'No Result Found',
                forceUpdate: request.pre.forceUpdate,
                err: err
              }).code(404);
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
          return reply(
              {status: false, err: err, forceUpdate: request.pre.forceUpdate});
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
          var itemId = request.query && request.query.itemid ?
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
            }), modals.jobCopies.update({
              status_type: 3,
              updated_by: user.id || user.ID,
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
              copyId: request.params.copyid,
            }) : '']).then(function(result) {
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
            var copiesData = result[0].copies.find(function(copyItem) {
              return copyItem.id.toString() ===
                  request.params.copyid.toString();
            });
            if (copiesData) {
              fsImpl.rmdirp(_guid2.default.isGuid(result[0].job_id) ?
                  '' + copiesData.file_name :
                  'jobs/' + result[0].job_id + '/' + copiesData.file_name);
            }
            var jobItem = result[0].toJSON();
            if (jobItem.admin_status !== 5) {
              result[0].updateAttributes(attributes);
            }

            return reply({
              status: true,
              message: result[3][0] === true ?
                  'Product item deleted successfully' :
                  result[3][0] && itemId ?
                      'File deleted successfully from product item' :
                      'File deleted successfully',
              isProductItemDeleted: result[3][0] === true,
              productItemCopiesCount: result[3][0] && result[3][0] !== true ?
                  result[3][0].copies.length :
                  0,
              productItemCopies: result[3][0] !== true && result[3][0] ?
                  result[3][0].copies :
                  undefined,
              forceUpdate: request.pre.forceUpdate
            });
          }).catch(function (err) {
            console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
            return reply({
              status: false,
              err: err,
              forceUpdate: request.pre.forceUpdate,
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
            updated_by: user.id || user.ID,
          }));
          break;

        case 3:
          productItemPromise.push(
              insuranceAdaptor.removeInsurances(itemId, copyId, {
                job_id: jobId,
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
              }));
          break;

        case 4:
          productItemPromise.push(repairAdaptor.removeRepairs(itemId, copyId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
          }));
          break;
        case 5:
          productItemPromise.push(
              warrantyAdaptor.removeWarranties(itemId, copyId, {
                job_id: jobId,
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
              }));
          break;

        case 6:
          productItemPromise.push(
              warrantyAdaptor.removeWarranties(itemId, copyId, {
                job_id: jobId,
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
              }));
          break;
        case 7:
          productItemPromise.push(pucAdaptor.removePUCs(itemId, {
            job_id: jobId,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
          }));
          break;
        case 8:
          productItemPromise.push(
              warrantyAdaptor.removeWarranties(itemId, copyId, {
                job_id: jobId,
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
              }));
          break;
        default:
          productItemPromise.push(
              productAdaptor.removeProducts(itemId, copyId, {
                job_id: jobId,
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
              }));
          break;
      }

      return Promise.all(productItemPromise);
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
          return fsImplCategory.readFile(result.category_image_name, 'utf8').
              then(function(fileResult) {
            return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.CopyName);
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() +
              ' for user while retrieving category image is as follow: \n \n ' +
              err);
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
          return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.CopyName);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
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