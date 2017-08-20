/**
 * Created by arpit on 7/3/2017.
 */

const fs = require('fs');

module.exports = {
  // Secret key for JWT signing and encryption
  secret: fs.readFileSync(`${__dirname}/rsa-private.pem`),
  // Database connection information
  /* database: {
    username: 'root',
    password: 'yellow*99',
    database: 'binbill',
    autoReconnect: true,
    host: 'localhost',
    dialect: 'mysql'
  }, */
  database: {
    username: 'binbillDB',
    password: 'devbindb1!#',
    database: 'binbill',
    autoReconnect: true,
    host: 'binbilldbinstancetest.cpnnj7xlkrir.ap-south-1.rds.amazonaws.com',
    dialect: 'mysql',
    port: 3306
  },
  // Setting port for server
  port: 3001,
  test_port: 3001
};
