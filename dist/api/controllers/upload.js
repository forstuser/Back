'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fileType4 = require('file-type');

var _fileType5 = _interopRequireDefault(_fileType4);

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
  var result = (0, _fileType5.default)(buffer);
  return ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1;
};

var getTypeFromBuffer = function getTypeFromBuffer(buffer) {
  return (0, _fileType5.default)(buffer);
};
var modals = void 0;
var userAdaptor = void 0;

var UploadController = function () {
  function UploadController(modal) {
    _classCallCheck(this, UploadController);

    modals = modal;
    userAdaptor = new _user2.default(modals);
  }

  _createClass(UploadController, null, [{
    key: 'uploadUserImage',
    value: function uploadUserImage(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!user) {
        reply({
          status: false,
          message: 'Unauthorized'
          // forceUpdate: request.pre.forceUpdate
        });
      } else if (request.payload) {
        var fieldNameHere = request.payload.fieldNameHere;
        var fileData = fieldNameHere || request.payload.filesName;

        var name = fileData.hapi.filename;
        var _fileType = name.split('.')[name.split('.').length - 1];
        var fileName = 'active-' + user.id + '-' + new Date().getTime() + '.' + _fileType;
        // const file = fs.createReadStream();
        return fsImpl.writeFile(fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) }).then(function (fileResult) {

          console.log(fileResult);
          return userAdaptor.updateUserDetail({
            image_name: fileName
          }, {
            where: {
              id: user.id
            }
          });
        }).then(function () {
          return reply({
            status: true,
            message: 'Uploaded Successfully'
          });
        }).catch(function (err) {
          console.log({ API_Logs: err });
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
      if (!user) {
        reply({
          status: false,
          message: 'Unauthorized'
        });
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
            UploadController.uploadFileGeneric(user, filteredFileData, reply, request);
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
    key: 'uploadFileGeneric',
    value: function uploadFileGeneric(user, fileData, reply, request) {
      console.log('' + Math.random().toString(36).substr(2, 9) + user.id.toString(36));
      return modals.jobs.create({
        job_id: '' + Math.random().toString(36).substr(2, 9) + user.id.toString(36),
        user_id: user.id,
        updated_by: user.id,
        uploaded_by: user.id,
        user_status: 8,
        admin_status: 4
      }).then(function (result) {
        if (Array.isArray(fileData)) {
          var fileNames = [];
          var fileTypes = [];
          var fileTypeDataArray = [];
          var fileUploadPromises = fileData.map(function (elem, index) {
            var name = elem.hapi.filename;
            var fileType = /[.]/.exec(name) ? /[^.]+$/.exec(name) : undefined;
            var fileTypeData = getTypeFromBuffer(elem._data);
            var fileName = user.id + '-' + (index + 1) + '.' + (fileType ? fileType.toString() : fileTypeData.ext);

            fileNames.push(fileName);
            fileTypes.push(fileType);
            fileTypeDataArray.push(fileTypeData);
            // const file = fs.createReadStream();
            return fsImpl.writeFile('jobs/' + result.job_id + '/' + fileName, elem._data, { ContentType: _mimeTypes2.default.lookup(fileName) });
          });
          Promise.all(fileUploadPromises).then(function (fileResult) {
            var promisedQuery = fileResult.map(function (elem, index) {
              var ret = {
                job_id: result.id,
                file_name: fileNames[index],
                file_type: fileTypes[index] ? fileTypes[index].toString() : fileTypeDataArray[index].ext,
                status_type: 6,
                updated_by: user.id
              };
              return modals.jobCopies.create(ret);
            });

            // if (promisedQuery.length === Object.keys(fileData).length) {
            return Promise.all(promisedQuery);
            // }
          }).then(function (billResult) {
            if (user.email) {
              modals.jobs.count({
                where: {
                  uploaded_by: user.id
                }
              }).then(function (billCount) {
                if (billCount === 1) {
                  _notification2.default.sendMailOnDifferentSteps('It’s good to see you start building your eHome', user.email, user, 2);
                } else {
                  _notification2.default.sendMailOnDifferentSteps('We have received your bill, soon it will be available in your eHome', user.email, user, 3);
                }
              });
            }

            return reply({
              status: true,
              message: 'Uploaded Successfully',
              billResult: billResult
              // forceUpdate: request.pre.forceUpdate
            });
          }).catch(function (err) {
            console.log({ API_Logs: err });
            return reply({
              status: false,
              message: 'Upload Failed',
              err: JSON.stringify(err)
              // forceUpdate: request.pre.forceUpdate
            }).code(500);
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
            var fileTypeData = getTypeFromBuffer(fileData._data);
            result.updateAttributes({
              file_types: [_fileType3]
            });
            var fileName = user.id + '-1.' + (_fileType3 ? _fileType3.toString() : fileTypeData.ext);

            fsImpl.writeFile('jobs/' + result.job_id + '/' + fileName, fileData._data, { ContentType: _mimeTypes2.default.lookup(fileName) }).then(function (fileResult) {
              var ret = {
                job_id: result.id,
                file_name: fileName,
                file_type: _fileType3 ? _fileType3.toString() : fileTypeData.ext,
                status_type: 6,
                updated_by: user.id
              };

              console.log(fileResult);
              modals.jobCopies.create(ret).then(function (billResult) {
                if (user.email) {
                  modals.jobs.count({
                    where: {
                      uploaded_by: user.id
                    }
                  }).then(function (billCount) {
                    if (billCount === 1) {
                      _notification2.default.sendMailOnDifferentSteps('It’s good to see you start building your eHome', user.email, user, 2);
                    } else {
                      _notification2.default.sendMailOnDifferentSteps('We have received your bill, soon it will be available in your eHome', user.email, user, 3);
                    }
                  });
                }
                return reply({
                  status: true,
                  message: 'Uploaded Successfully'
                  // forceUpdate: request.pre.forceUpdate
                });
              }).catch(function (err) {
                console.log({ API_Logs: err });
                return reply({
                  status: false,
                  message: 'Data Update Failed',
                  err: err
                  // forceUpdate: request.pre.forceUpdate
                });
              });
            }).catch(function (err) {
              console.log({ API_Logs: err });
              return reply({ status: false, message: 'Upload Failed', err: err }); //forceUpdate: request.pre.forceUpdate});
            });
          }
        }
      }).catch(function (err) {
        console.log('ERR', err);
        return reply({ status: false, message: 'Upload Failed', err: err }); // , forceUpdate: request.pre.forceUpdate});
      });
    }
  }, {
    key: 'retrieveFiles',
    value: function retrieveFiles(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!user) {
        reply({
          status: false,
          message: 'Unauthorized'
        });
      } else {
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
              fsImpl.readFile('jobs/' + result.job_id + '/' + result.copies[0].file_name).then(function (fileResult) {
                reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.bill_copy_name);
              }).catch(function (err) {
                console.log({ API_Logs: err });
                reply({
                  status: false,
                  message: 'No Result Found',
                  forceUpdate: request.pre.forceUpdate,
                  err: err
                }).code(404);
              });
            } else {
              reply({
                status: false,
                message: 'No Result Found',
                forceUpdate: request.pre.forceUpdate
              }).code(404);
            }
          }).catch(function (err) {
            console.log({ API_Logs: err });
            reply({ status: false, err: err, forceUpdate: request.pre.forceUpdate });
          });
        } else {
          reply({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate
          });
        }
      }
    }
  }, {
    key: 'deleteFile',
    value: function deleteFile(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!user) {
        reply({
          status: false,
          message: 'Unauthorized'
        });
      } else {
        if (!request.pre.forceUpdate) {
          Promise.all([modals.jobs.findById(request.params.id), modals.jobCopies.update({
            status_type: 3,
            updated_by: user.id
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
          })]).then(function (result) {
            var count = result[2];
            var attributes = count > 0 ? {
              job_id: '' + Math.random().toString(36).substr(2, 9) + user.id.toString(36),
              user_status: 8,
              admin_status: 4,
              updated_by: user.id
            } : {
              user_status: 3,
              admin_status: 3,
              updated_by: user.id
            };
            result[0].updateAttributes(attributes);
            reply({
              status: true,
              message: 'File deleted successfully',
              forceUpdate: request.pre.forceUpdate
            });
          }).catch(function (err) {
            console.log({ API_Logs: err });
            reply({ status: false, err: err, forceUpdate: request.pre.forceUpdate });
          });
        } else {
          reply({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate
          });
        }
      }
    }
  }, {
    key: 'retrieveCategoryImage',
    value: function retrieveCategoryImage(request, reply) {
      if (!request.pre.forceUpdate) {
        var fsImplCategory = new _s3fs2.default(AWS.S3.BUCKET + '/' + AWS.S3.CATEGORY_IMAGE + '/' + categoryImageType[request.params.type || 0], AWS.ACCESS_DETAILS);
        modals.categories.findOne({
          where: {
            category_id: request.params.id
          }
        }).then(function (result) {
          fsImplCategory.readFile(result.category_image_name, 'utf8').then(function (fileResult) {
            return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + result.CopyName);
          }).catch(function (err) {
            console.log({ API_Logs: err });
            reply({
              status: false,
              message: 'Unable to retrieve image',
              err: err,
              forceUpdate: request.pre.forceUpdate
            });
          });
        }).catch(function (err) {
          console.log({ API_Logs: err });
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
      if (!user) {
        return reply({
          status: false,
          message: 'Unauthorized'
        });
      } else {
        if (!request.pre.forceUpdate) {
          return userAdaptor.retrieveUserImageNameById(user).then(function (userDetail) {
            return fsImpl.readFile(userDetail.image_name);
          }).then(function (fileResult) {
            return reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', 'attachment; filename=' + fileResult.CopyName);
          }).catch(function (err) {
            console.log({ API_Logs: err });
            return reply({
              status: false,
              message: 'No Result Found',
              forceUpdate: request.pre.forceUpdate
            }).code(404);
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

module.exports = UploadController;