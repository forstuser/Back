const {S3_BUCKET, AWS_ACCESS_DETAILS} = require('./config/main');
const env = require('./config/env');
const S3FS = require("s3fs");
const fsImpl = new S3FS(S3_BUCKET.BUCKET_NAME[env], AWS_ACCESS_DETAILS[env]);

function getFile(billCopyId, models) {
    return models.billCopies.findOne({
        where: {
            bill_copy_id: billCopyId
        },
        attributes: {exclude: ['BillID']}
    }).then((result) => {
        return fsImpl.readFile(result.bill_copy_name, 'utf8');
    });
}

module.exports = {
    getFile: getFile
}