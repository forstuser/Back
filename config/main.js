module.exports = {
    AWS: {
        S3: {
            BUCKET: process.env.AWS_S3_BUCKET
        },
        ACCESS_DETAILS: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
            region: process.env.AWS_REGION
        }
    },
    FCM_KEY: process.env.FCM_KEY || "secret_key",
    // Database connection information
    DATABASE: {
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_DATABASE,
            autoReconnect: true,
            host: process.env.DATABASE_HOST,
            dialect: 'mysql',
            port: 3306
    },
    APP: {
        PORT: process.env.APP_PORT || 3000
    }
};
