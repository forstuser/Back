/*jshint esversion: 6 */
'use strict';

const fs = require('fs');

module.exports = {
	SMS: {
		AUTH_KEY: process.env.SMS_AUTH_KEY
	},
	AWS: {
		S3: {
			BUCKET: process.env.AWS_S3_BUCKET,
			USER_IMAGE: 'userimages',
			CATEGORY_IMAGE: 'categoryimages'
		},
		ACCESS_DETAILS: {
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_KEY,
			region: process.env.AWS_REGION
		}
	},
	GOOGLE: {
		API_KEY: process.env.GOOGLE_API_KEY,
		FCM_KEY: process.env.FCM_KEY
	},
	SERVER_HOST: process.env.SERVER_HOST,
	EMAIL: {
		USER: process.env.EMAIL_ID,
		PASSWORD: process.env.EMAIL_PASSWORD
	},
	// Secret key for JWT signing and encryption
	JWT_SECRET: process.env.JWT_SECRET,
	// Database connection information
	DATABASE: {
		username: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_DATABASE,
		autoReconnect: true,
		host: process.env.DATABASE_HOST,
		dialect: 'mysql',
		logging: (process.env.NODE_ENV !== "production"),
		port: 3306,
        operatorsAliases: {}
	},
	APP: {
		PORT: process.env.APP_PORT || 3000
	},
	TRUECALLER_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEpFwIarbm48m6ueG+jhpt2vCGaqXZlwR/HPuL4zH1DQ/eWFbgQtVnrta8QhQz3ywLnbX6s7aecxUzzNJsTtS8VxKAYll4E1lJUqrNdWt8CU+TaUQuFm8vzLoPiYKEXl4bX5rzMQUMqA228gWuYmRFQnpduQTgnYIMO8XVUQXl5wIDAQAB\n-----END PUBLIC KEY-----'
};
