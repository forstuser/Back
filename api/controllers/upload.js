/* eslint-disable no-loop-func,no-underscore-dangle */
const uuid = require('uuid');
const S3FS = require('s3fs');
const mime = require('mime-types');
const moment = require('moment');

const {S3_BUCKET, AWS_ACCESS_DETAILS} = require('../../config/main');
const env = require('../../config/env');

const fsImpl = new S3FS(S3_BUCKET.BUCKET_NAME[env], AWS_ACCESS_DETAILS[env]);

const fsImplUser = new S3FS(`${S3_BUCKET.BUCKET_NAME[env]}/${S3_BUCKET.USER_IMAGE[env]}`, AWS_ACCESS_DETAILS[env]);

const fsImplCategory = new S3FS(`${S3_BUCKET.BUCKET_NAME[env]}/${S3_BUCKET.CATEGORY_IMAGE[env]}`, AWS_ACCESS_DETAILS[env]);

const ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'rtf', 'xls', 'xlsx', 'png', 'bmp', 'jpg', 'jpeg'];

const isFileTypeAllowed = (fileTypeData) => {
    if (fileTypeData) {
        const fileType = fileTypeData.toLowerCase();
        return (ALLOWED_FILE_TYPES.indexOf(fileType) > -1);
    }

    return false;
};

const shared = require('../../helpers/shared');

let modals;

class UploadController {
    constructor(modal) {
        modals = modal;
    }

    static uploadUserImage(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            if (request.payload) {
                const fieldNameHere = request.payload.fieldNameHere;
                const fileData = fieldNameHere || request.payload.filesName;

                const name = fileData.hapi.filename;
                const fileType = name.split('.')[name.split('.').length - 1];
                const fileName = `${user.ID}-${new Date().getTime()}.${fileType}`;
                // const file = fs.createReadStream();
                fsImplUser.writeFile(fileName, fileData._data, {ContentType: mime.lookup(fileName)})
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
                                userResult[0].updateAttributes({
                                    user_image_name: fileName,
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
                            reply({status: false, message: 'Upload Failed', err});
                        });
                    }).catch(err => reply({status: false, message: 'Upload Failed', err}));
            } else {
                reply({message: 'Invalid OTP'}).code(401);
            }
        }
    }

    static uploadFiles(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            if (request.payload) {
                const fieldNameHere = request.payload.fieldNameHere;
                const fileData = fieldNameHere || request.payload.filesName;

                let filteredFileData = fileData;

                if (Array.isArray(filteredFileData)) {
                    filteredFileData = fileData.filter((datum) => {
                        const name = datum.hapi.filename;
                        const fileType = name.split('.')[name.split('.').length - 1];

                        return isFileTypeAllowed(fileType);
                    });
                }

                UploadController.uploadFileGeneric(user, filteredFileData, reply);
            }
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
                        const fileName = `${user.ID}-${result.bill_id}-${moment().valueOf()}.${fileType}`;
                        // const file = fs.createReadStream();
                        fsImpl.writeFile(fileName, fileData[i]._data, {ContentType: mime.lookup(fileName)})
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
                                        .then(billResult => reply({
                                            status: true,
                                            message: 'Uploaded Successfully',
                                            billResult
                                        })).catch((err) => {
                                        reply({status: false, message: 'Data Updation Failed', err});
                                    });
                                }
                            }).catch(err => reply({
                            status: false,
                            message: 'Upload Failed',
                            err: JSON.stringify(err)
                        }).code(500));
                    }
                }
            } else {
                const name = fileData.hapi.filename;
                const fileType = name.split('.')[name.split('.').length - 1];
                if (!isFileTypeAllowed(fileType)) {
                    reply({status: false, message: 'Data Upload Failed'});
                } else {
                    const fileName = `${user.ID}-${result.bill_id}-${moment().valueOf()}.${fileType}`;
                    // const file = fs.createReadStream();
                    fsImpl.writeFile(fileName, fileData._data, {ContentType: mime.lookup(fileName)})
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
                                reply({status: false, message: 'Data Update Failed', err});
                            });
                        }).catch(err => reply({status: false, message: 'Upload Failed', err}));
                }
            }
        }).catch((err) => {
            reply({status: false, message: 'Upload Failed', err});
        });
    }

    static retrieveFiles(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            modals.billCopies.findOne({
                where: {
                    uploaded_by_id: user.ID,
                    bill_copy_id: request.params.id
                },
                attributes: {exclude: ['BillID']}
            }).then((result) => {
                if (result && result.bill_copy_name) {
                    fsImpl.readFile(result.bill_copy_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.bill_copy_name}`)).catch(reply);
                } else {
                    reply({status: false, message: 'No Result Found'}).code(404);
                }
            }).catch((err) => {
                reply(err);
            });
        }
    }

    static deleteFile(request, reply) {
        Promise.all([modals.consumerBills.findOne({
            include: [{
                model: modals.billCopies,
                as: 'billCopies',
                where: {
                    bill_copy_id: request.params.id
                },
                attributes: []
            }],
            attributes: {exclude: ['tableUserID']}
        }),
            modals.billCopies.update({
                status_id: 3
            }, {
                where: {
                    bill_copy_id: request.params.id
                },
                attributes: {exclude: ['BillID']}
            })]).then((result) => {
            modals.billCopies.count({
                where: {
                    bill_id: result[0].bill_id,
                    status_id: {
                        $ne: 3
                    }
                }
            }).then((count) => {
                const attributes = count > 0 ? {
                    bill_reference_id: uuid.v4(),
                    user_status: 8,
                    admin_status: 4,
                    updated_on: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss')
                } : {
                    user_status: 3,
                    admin_status: 3,
                    updated_on: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss')
                };
                result[0].updateAttributes(attributes);
                reply({status: true, message: 'File deleted successfully'});
            });
        }).catch((err) => {
            reply({status: false, err});
        });
    }

    static retrieveCategoryImage(request, reply) {
        modals.categories.findOne({
            where: {
                category_id: request.params.id
            }
        }).then((result) => {
            fsImplCategory.readFile(result.category_image_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.CopyName}`)).catch((err) => {
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

    static retrieveUserImage(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({
                status: false,
                message: 'Unauthorized'
            });
        } else {
            modals.userImages.findOne({
                where: {
                    user_image_id: request.params.id,
                    user_id: user.ID
                }
            }).then((result) => {
                if (result && result.user_image_name) {
                    fsImplUser.readFile(result.user_image_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.CopyName}`)).catch((err) => {
                        reply({
                            status: false,
                            message: 'Unable to retrieve image',
                            err
                        });
                    });
                } else {
                    reply({status: false, message: 'No Result Found'}).code(404);
                }
            }).catch((err) => {
                reply({
                    status: false,
                    message: 'Unable to retrieve image',
                    err
                });
            });
        }
    }
}

module.exports = UploadController;
