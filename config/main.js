/**
 * Created by arpit on 7/3/2017.
 */

const fs = require('fs');

module.exports = {
  // Secret key for JWT signing and encryption
  secret: fs.readFileSync(`${__dirname}/rsa-private.pem`),
  // Database connection information
  database: {
    username: 'root',
    password: 'yellow*99',
    database: 'binbill',
    autoReconnect: true,
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  // Setting port for server
  port: 3001,
  test_port: 3001
};
