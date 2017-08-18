/* eslint-disable no-loop-func,no-underscore-dangle */
const uuid = require('uuid');
const S3FS = require('s3fs');
const mime = require('mime-types');

const fsImpl = new S3FS('binbillbucket', {
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

  static uploadFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const fileData = request.payload.fieldNameHere;
    const promisedQuery = [];
    modals.table_consumer_bills.create({
      BillRefID: uuid.v4(),
      user_id: user.userId,
      updated_by_user_id: user.userId,
      uploaded_by: user.userId,
      user_status: 4,
      admin_status: 4
    }).then((result) => {
      for (let i = 0; i < Object.keys(fileData).length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(fileData, i)) {
          const name = fileData[i].hapi.filename;
          const fileType = name.split('.')[name.split('.').length - 1];
          const fileName = `${user.userId}-${result.ID}-${new Date().getTime()}.${fileType}`;
          // const file = fs.createReadStream();
          fsImpl.writeFile(fileName, fileData[i]._data, { ContentType: mime.lookup(fileName) })
            .then((fileResult) => {
              const ret = {
                BillID: result.ID,
                CopyName: fileName,
                CopyType: fileType,
                status_id: 6,
                updated_by_user_id: user.userId,
                uploaded_by_id: user.userId
              };

              console.log(fileResult);
              promisedQuery.push(modals.table_consumer_bill_copies.create(ret));


              if (promisedQuery.length === Object.keys(fileData).length) {
                Promise.all(promisedQuery)
                  .then(reply).catch((err) => {
                    reply(err);
                  });
              }
            }).catch(err => reply({ error: err }).code(500));
        }
      }
    }).catch((err) => {
      reply(err);
    });
  }
  static retrieveFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user) {
      modals.table_consumer_bill_copies.findOne({
        where: {
          ID: request.params.id
        }
      }).then((result) => {
        fsImpl.readFile(result.CopyName, 'utf8').then(fileResult => reply(fileResult.Body).header('Content-Type', fileResult.ContentType).header('Content-Disposition', `attachment; filename=${result.CopyName}`)).catch(reply);
      }).catch((err) => {
        reply(err);
      });
    } else {
      reply().code(401);
    }
  }
}

module.exports = UploadController;
