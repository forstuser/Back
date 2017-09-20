/*jshint esversion: 6 */
'use strict';

const uuid = require('uuid');
const S3FS = require('s3fs');
const mime = require('mime-types');
const moment = require('moment');
const fileType = require("file-type");

const AWS = require('../../config/main').AWS;
const fsImpl = new S3FS(AWS.S3.BUCKET, AWS.ACCESS_DETAILS);

const fsImplUser = new S3FS(`${AWS.S3.BUCKET}/${AWS.S3.USER_IMAGE}`, AWS.ACCESS_DETAILS);

const ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'rtf', 'xls', 'xlsx', 'png', 'bmp', 'jpg', 'jpeg'];

const categoryImageType = ['xxhdpi', 'xxhdpi-small'];

const isFileTypeAllowed = function (fileTypeData) {
	// console.log("FILE TYPE DATA: " + fileTypeData);
	if (fileTypeData) {
		let filetype = fileTypeData.toString().toLowerCase();
		// console.log(filetype);
		return (ALLOWED_FILE_TYPES.indexOf(filetype) > -1);
	}
	console.log("HERE");
	return false;
};

const isFileTypeAllowedMagicNumber = function (buffer) {
	// console.log("GOT BUFFER");
	const result = fileType(buffer);
	return (ALLOWED_FILE_TYPES.indexOf(result.ext.toString()) > -1);
};

const getTypeFromBuffer = function (buffer) {
	return fileType(buffer);
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
				message: 'Unauthorized',
				// forceUpdate: request.pre.forceUpdate
			});
		} else if (request.payload) {
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
							userResult: userResult[0],
							// forceUpdate: request.pre.forceUpdate
						});
					}).catch((err) => {
						console.log(err);
						reply({status: false, message: 'Upload Failed', err}); //, forceUpdate: request.pre.forceUpdate});
					});
				}).catch((err) => {
				console.log(err);
				reply({
					status: false,
					message: 'Upload Failed',
					err,
					// forceUpdate: request.pre.forceUpdate
				});
			});
		} else {
			reply({status: false, message: "No documents in request"}); //, forceUpdate: request.pre.forceUpdate});
		}
	}

	static uploadFiles(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized'
			});
		} else if (request.payload) {
			// if (!request.pre.forceUpdate && request.payload) {
			const fieldNameHere = request.payload.fieldNameHere;
			const fileData = fieldNameHere || request.payload.filesName || request.payload.file;

			let filteredFileData = fileData;
			// console.log("BEFORE FILTERING: ", filteredFileData);
			if (filteredFileData) {
				if (Array.isArray(filteredFileData)) {
					filteredFileData = fileData.filter((datum) => {
						const name = datum.hapi.filename;
						const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
						if (fileType && !isFileTypeAllowed(fileType)) {
							return false;
						} else if (!fileType && !isFileTypeAllowedMagicNumber(datum._data)) {
							return false;
						}

						return true;
					});
				}

				UploadController.uploadFileGeneric(user, filteredFileData, reply, request);
				// } else {
				// 	reply({status: false, message: 'No File', forceUpdate: request.pre.forceUpdate}).code(400);
				// }
			} else {
				reply({status: false, message: "No documents in request"}); //, forceUpdate: request.pre.forceUpdate});
			}
		}
	}

	static uploadFileGeneric(user, fileData, reply, request) {
		return modals.consumerBills.create({
			bill_reference_id: uuid.v4(),
			user_id: user.ID,
			updated_by_user_id: user.ID,
			uploaded_by: user.ID,
			user_status: 8,
			admin_status: 4
		}).then((result) => {
			if (Array.isArray(fileData)) {
				const fileNames = [];
				const fileTypes = [];
				const fileTypeDataArray = [];
				const fileUploadPromises = fileData.map((elem) => {
					const name = elem.hapi.filename;
					const fileType = (/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined;
					const fileTypeData = getTypeFromBuffer(elem._data);
					const fileName = `${user.ID}-${result.bill_id}-${moment().valueOf()}.${(fileType) ? fileType.toString() : fileTypeData.ext}`;

					fileNames.push(fileName);
					fileTypes.push(fileType);
					fileTypeDataArray.push(fileTypeData);
					// const file = fs.createReadStream();
					return fsImpl.writeFile(fileName, elem._data, {ContentType: mime.lookup(fileName)});
				});

				Promise.all(fileUploadPromises).then((fileResult) => {
					const promisedQuery = fileResult.map((elem, index) => {
						const ret = {
							bill_id: result.bill_id,
							bill_copy_name: fileNames[index],
							bill_copy_type: (fileTypes[index]) ? fileTypes[index].toString() : fileTypeDataArray[index].ext,
							status_id: 6,
							updated_by_user_id: user.ID,
							uploaded_by_id: user.ID
						};
						return modals.billCopies.create(ret);
					});

					// if (promisedQuery.length === Object.keys(fileData).length) {
					return Promise.all(promisedQuery);
					// }
				}).then(billResult => reply({
					status: true,
					message: 'Uploaded Successfully',
					billResult,
					// forceUpdate: request.pre.forceUpdate
				})).catch((err) => {
					console.log(err);
					reply({
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
					reply({status: false, message: 'Data Upload Failed'});
				} else if (!fileType && !isFileTypeAllowedMagicNumber(fileData._data)) {
					reply({status: false, message: 'Data Upload Failed'});
				} else {
					const fileTypeData = getTypeFromBuffer(fileData._data);
					const fileName = `${user.ID}-${result.bill_id}-${moment().valueOf()}.${(fileType) ? fileType.toString() : fileTypeData.ext}`;
					// const file = fs.createReadStream();

					// console.log("MIMELOOKUP: " + mime.lookup(fileName));

					fsImpl.writeFile(fileName, fileData._data, {ContentType: mime.lookup(fileName)})
						.then((fileResult) => {
							const ret = {
								bill_id: result.bill_id,
								bill_copy_name: fileName,
								bill_copy_type: (fileType) ? fileType.toString() : fileTypeData.ext,
								status_id: 6,
								updated_by_user_id: user.ID,
								uploaded_by_id: user.ID
							};

							console.log(fileResult);
							modals.billCopies.create(ret)
								.then(billResult => reply({
									status: true,
									message: 'Uploaded Successfully',
									billResult,
									// forceUpdate: request.pre.forceUpdate
								})).catch((err) => {
								console.log(err);
								reply({
									status: false,
									message: 'Data Update Failed',
									err,
									// forceUpdate: request.pre.forceUpdate
								});
							});
						}).catch((err) => {
						console.log(err);
						reply({status: false, message: 'Upload Failed', err}); //forceUpdate: request.pre.forceUpdate});
					});

				}
			}
		}).catch((err) => {
			console.log("ERR", err);
			reply({status: false, message: 'Upload Failed', err});// , forceUpdate: request.pre.forceUpdate});
		});
	}

	static retrieveFiles(request, reply) {
		// const user = shared.verifyAuthorization(request.headers);
		// if (!user) {
		//     reply({
		//         status: false,
		//         message: 'Unauthorized'
		//     });
		// } else {
		if (!request.pre.forceUpdate) {
			modals.billCopies.findOne({
				where: {
					// uploaded_by_id: user.ID,
					bill_copy_id: request.params.id
				},
				attributes: {exclude: ['BillID']}
			}).then((result) => {
				if (result && result.bill_copy_name) {
					fsImpl.readFile(result.bill_copy_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.bill_copy_name}`)).catch((err) => {
						console.log(err);
						reply(err);
					});
				} else {
					reply({status: false, message: 'No Result Found', forceUpdate: request.pre.forceUpdate}).code(404);
				}
			}).catch((err) => {
				console.log(err);
				reply({status: false, err, forceUpdate: request.pre.forceUpdate});
			});
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
		// }
	}

	static deleteFile(request, reply) {
		if (!request.pre.forceUpdate) {
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
					reply({status: true, message: 'File deleted successfully', forceUpdate: request.pre.forceUpdate});
				});
			}).catch((err) => {
				console.log(err);
				reply({status: false, err, forceUpdate: request.pre.forceUpdate});
			});
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveCategoryImage(request, reply) {
		if (!request.pre.forceUpdate) {
			const fsImplCategory = new S3FS(`${AWS.S3.BUCKET}/${AWS.S3.CATEGORY_IMAGE}/${categoryImageType[request.params.type || 0]}`, AWS.ACCESS_DETAILS);
			modals.categories.findOne({
				where: {
					category_id: request.params.id
				}
			}).then((result) => {
				fsImplCategory.readFile(result.category_image_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.CopyName}`)).catch((err) => {
					console.log(err);
					reply({
						status: false,
						message: 'Unable to retrieve image',
						err,
						forceUpdate: request.pre.forceUpdate
					});
				});
			}).catch((err) => {
				console.log(err);
				reply({
					status: false,
					message: 'Unable to retrieve image',
					err,
					forceUpdate: request.pre.forceUpdate
				});
			});
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}

	static retrieveUserImage(request, reply) {
		// const user = shared.verifyAuthorization(request.headers);
		// if (!user) {
		//     reply({
		//         status: false,
		//         message: 'Unauthorized'
		//     });
		// } else {
		if (!request.pre.forceUpdate) {
			modals.userImages.findOne({
				where: {
					user_image_id: request.params.id
					// user_id: user.ID
				}
			}).then((result) => {
				if (result && result.user_image_name) {
					fsImplUser.readFile(result.user_image_name, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.CopyName}`)).catch((err) => {
						console.log(err);
						reply({
							status: false,
							message: 'Unable to retrieve image',
							err
						});
					});
				} else {
					reply({status: false, message: 'No Result Found', forceUpdate: request.pre.forceUpdate}).code(404);
				}
			}).catch((err) => {
				console.log(err);
				reply({
					status: false,
					message: 'Unable to retrieve image',
					err,
					forceUpdate: request.pre.forceUpdate
				});
			});
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
		// }
	}
}

module.exports = UploadController;
