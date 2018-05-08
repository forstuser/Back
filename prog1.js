const promise = require('bluebird')
function readingfile(a, b) {
    return new Promise((resolve, reject) => {

        var sum = a + b


        if (sum > 100) {
            return resolve(sum)

            console.log('pass')
        }
        else {
            return reject
            console.log('fail')
        }


    }).catch((err) =>
        console.log(err))
}
console.log(readingfile(100, 100))