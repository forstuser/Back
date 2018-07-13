'use strict';

export default {
  SMS: {
    AUTH_KEY: process.env.SMS_AUTH_KEY,
    HOST_NAME: 'http://api.msg91.com',
    PATH: '/api/v2/sendsms',
  },
  FB_GRAPH_ROUTE: process.env.FB_GRAPH_ROUTE,
  MESSAGE: process.env.MESSAGE,
  AWS: {
    S3: {
      BUCKET: process.env.AWS_S3_BUCKET,
      USER_IMAGE: 'userimages',
      CATEGORY_IMAGE: 'categoryimages',
      PRODUCT_IMAGE: 'productimages',
      WEARABLE_IMAGE: 'wearableimages',
      CALENDAR_ITEM_IMAGE: 'calendarserviceimages',
      BRAND_IMAGE: 'brandimages',
      PROVIDER_IMAGE: 'providerimages',
      KNOW_ITEM_IMAGE: 'knowitemimages',
      OFFER_BANNERS: 'offer_banners',
    },
    ACCESS_DETAILS: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION,
    },
  },
  GOOGLE: {
    API_KEY: process.env.GOOGLE_API_KEY,
    FCM_KEY: process.env.FCM_KEY,
    SECRET: process.env.GOOGLE_SECRET,
    SITE_VERIFY: process.env.SITE_VERIFY,
  },
  SERVER_HOST: process.env.SERVER_HOST,
  EMAIL: {
    USER: process.env.EMAIL_ID,
    PASSWORD: process.env.EMAIL_PASSWORD,
    TEAM_EMAIL: process.env.TEAM_EMAIL,
    OTP: {
      SUBJECT: process.env.OTP_SUBJECT,
    },
  },
  // Secret key for JWT signing and encryption
  JWT_SECRET: process.env.JWT_SECRET,
  SUPPORTED_LANGUAGES: process.env.SUPPORTED_LANGUAGES,
  // Database connection information
  DATABASE: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
    autoReconnect: true,
    host: process.env.DATABASE_HOST,
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production',
    port: process.env.DATABASE_PORT,
    pool: {
      max: 25,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
      max: 999,
    },
    operatorsAliases: {},
  },
  APP: {
    PORT: process.env.APP_PORT || 3000,
  },
  LIMITS: {
    ACCESSORY: process.env.ACCESSORY_LIMITS || 5,
    OFFER: process.env.OFFER_LIMITS || 6,
  },
  OFFERS: {
    DISCOUNTS: process.env.OFFER_DISCOUNTS,
    CASHBACKS: process.env.OFFER_CASHBACKS,
  },
  CATEGORIES: {
    AUTOMOBILE: process.env.AUTOMOBILE_CATEGORY.split(','),
    FURNITURE: process.env.FURNITURE_CATEGORY.split(','),
    ELECTRONIC: process.env.ELECTRONIC_CATEGORY.split(','),
    CALENDAR_ITEM: process.env.CALENDAR_ITEM_CATEGORY.split(','),
    OFFER: process.env.OFFER_CATEGORY.split(','),
    ACCESSORY: process.env.ACCESSORY_CATEGORY.split(','),
    MODEL_ACCESSORIES: process.env.MODEL_ACCESSORIES.split(','),
  },
  IOS: {
    FORCE_VERSION: process.env.IOS_FORCE_VERSION,
    RECOMMENDED_VERSION: process.env.IOS_RECOMMENDED_VERSION
  },
  ANDROID: {
    FORCE_VERSION: process.env.ANDROID_FORCE_VERSION,
    RECOMMENDED_VERSION: process.env.ANDROID_RECOMMENDED_VERSION
  },
  TRUECALLER_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEpFwIarbm48m6ueG+jhpt2vCGaqXZlwR/HPuL4zH1DQ/eWFbgQtVnrta8QhQz3ywLnbX6s7aecxUzzNJsTtS8VxKAYll4E1lJUqrNdWt8CU+TaUQuFm8vzLoPiYKEXl4bX5rzMQUMqA228gWuYmRFQnpduQTgnYIMO8XVUQXl5wIDAQAB\n-----END PUBLIC KEY-----',
};
