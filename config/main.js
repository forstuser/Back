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
  msSQLDatabase: {
    username: 'sa',
    password: 'newpassword',
    database: '5300CallReports_New',
    autoReconnect: true,
    host: 'IQRDA-TEST',
    dialect: 'mssql',
    pool: {
      max: 20,
      min: 0,
      idle: 10000
    },
    dialectOptions: {
      instanceName: 'SQLEXPRESS'
    }
  },
  // Setting port for server
  port: 3001,
  test_port: 3001,
  test_db: 'mern-starter-test',
  test_env: 'test'
};
