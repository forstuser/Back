/**
 * Created by arpit on 7/3/2017.
 */

const fs = require('fs');

module.exports = {
  SERVER_HOST: 'http://localhost:3000/',
  EMAIL: {
    USER: 'support@binbill.com',
    PASSWORD: 'binbill@123'
  },
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
  /* database: {
    username: 'binbill',
    password: 'Binbill5#',
    database: 'binbill',
    autoReconnect: true,
    host: 'binbilldbinstanceprod.cpnnj7xlkrir.ap-south-1.rds.amazonaws.com',
    dialect: 'mysql',
    port: 3306
  } */
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
