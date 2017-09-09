const AWS = require('./config/main').AWS;
const S3FS = require("s3fs");
const fsImpl = new S3FS(AWS.S3.BUCKET, AWS.ACCESS_DETAILS);

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