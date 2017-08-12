const Path = require('path');
const fs = require('fs');

const shared = require('../../helpers/shared');

class UploadController {
  static uploadFiles(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const data = request.payload.fieldNameHere;
    const promisedQuery = [];
    for (let i = 0; i < Object.keys(data).length; i += 1) {
      if (Object.prototype.hasOwnProperty.call(data, i)) {
        const name = data[i].hapi.filename;
        const fileType = name.split('.')[name.split('.').length - 1];
        const path = Path.join(__dirname, `../uploadFiles/${user.userId}-${new Date().getTime()}.${fileType}`);
        const file = fs.createWriteStream(path);

        file.on('error', (err) => {
          reply(err);
        });
        data[i].pipe(file);

        promisedQuery.push(new Promise((resolve, reject) => {
          data[i].on('end', (err) => {
            if (!err) {
              setTimeout(() => {
                const ret = {
                  filename: data[i].hapi.filename,
                  headers: data[i].hapi.headers
                };
                resolve(JSON.stringify(ret));
              }, 200);
            } else {
              reject(err);
            }
          });
        }));

        Promise.all(promisedQuery).then(reply).catch(reply);
      }
    }
  }
}

module.exports = UploadController;
