const promise = require('bluebird');
const fs = require('fs');
function getData(filepath) {
    var data = fs.readFile(filepath, 'utf', ((err, data) => {
        if (err) {
            return err
            console.log('Unable to read file', err)
        }
        else {
            data.map((item) => {
                userId: item.userId,
        


    })
        }

    }))

}