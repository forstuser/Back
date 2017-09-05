/**
 * Created by arpit on 7/3/2017.
 */

const fs = require('fs');

module.exports = {
    SERVER_HOST: {
        dev: 'http://localhost:3000/',
        prod: 'http://13.126.5.210:3000/',
        qa: 'http://13.126.5.210:3000/'
    },
    EMAIL: {
        USER: 'support@binbill.com',
        PASSWORD: 'binbill@123'
    },
    // Secret key for JWT signing and encryption
    secret: fs.readFileSync(`${__dirname}/rsa-private.pem`),
    // Database connection information
    database: {
        prod: {
            username: 'binbill',
            password: 'Binbill5#',
            database: 'binbill',
            autoReconnect: true,
            host: 'binbilldbinstanceprod.cpnnj7xlkrir.ap-south-1.rds.amazonaws.com',
            dialect: 'mysql',
            port: 3306
        },
        qa: {
            username: 'binbillDB',
            password: 'devbindb1!#',
            database: 'binbill',
            autoReconnect: true,
            host: 'binbilldbinstancetest.cpnnj7xlkrir.ap-south-1.rds.amazonaws.com',
            dialect: 'mysql',
            port: 3306
        },
        dev: {
            username: 'binbillDB',
            password: 'devbindb1!#',
            database: 'binbill',
            autoReconnect: true,
            host: 'binbilldbinstancetest.cpnnj7xlkrir.ap-south-1.rds.amazonaws.com',
            dialect: 'mysql',
            port: 3306
        }
    },
    // Setting port for server
    port: 3001,
    test_port: 3001,
    TRUECALLER_PUBLIC_KEY: "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEpFwIarbm48m6ueG+jhpt2vCGaqXZlwR/HPuL4zH1DQ/eWFbgQtVnrta8QhQz3ywLnbX6s7aecxUzzNJsTtS8VxKAYll4E1lJUqrNdWt8CU+TaUQuFm8vzLoPiYKEXl4bX5rzMQUMqA228gWuYmRFQnpduQTgnYIMO8XVUQXl5wIDAQAB\n-----END PUBLIC KEY-----"
};
