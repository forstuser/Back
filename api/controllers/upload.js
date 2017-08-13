const Path = require('path');
const fs = require('fs');
const uuid = require('uuid');

const shared = require('../../helpers/shared');

let modals;

class UploadController {

  constructor(modal) {
    modals = modal;
  }

  static uploadFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const data = request.payload.fieldNameHere;
    const promisedQuery = [];
    modals.table_consumer_bills.create({
        BillRefID: uuid.v4(),
        user_id: user.userId,
        updated_by_user_id: user.userId,
        uploaded_by: user.userId,
        user_status: 8,
        admin_status: 6
      }).then((result) => {
      for (let i = 0; i < Object.keys(data).length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(data, i)) {
          const name = data[i].hapi.filename;
          const fileType = name.split('.')[name.split('.').length - 1];
          const fileName = `${user.userId}-${result.ID}-${new Date().getTime()}.${fileType}`;
          const path = Path.join(__dirname, `../uploadFiles/${fileName}`);
          const file = fs.createWriteStream(path);

          file.on('error', (err) => {
            reply(err);
          });
          data[i].pipe(file);

          data[i].fileName = fileName;
          data[i].UserId = user.userId;
          promisedQuery.push(new Promise((resolve, reject) => {
            data[i].on('end', (err) => {
              if (!err) {
                setTimeout(() => {
                  const ret = {
                    filename: data[i].fileName,
                    headers: data[i].hapi.headers,
                    BillID: result.ID,
                    CopyName: data[i].fileName,
                    CopyType: fileType,
                    status_id: 6
                  };
                  resolve(modals.table_consumer_bill_copies.create(ret));
                }, 200);
              } else {
                reject(err);
              }
            });
          }));
        }
      }

      if(promisedQuery.length === Object.keys(data).length) {
        Promise.all(promisedQuery).then((result) => Promise.all(result).then(reply).catch((err) => {
          reply(err);
        })).catch((err) => {
          reply(err);
        });
      }
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = UploadController;