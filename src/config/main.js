'use strict';

export default {
  ORDER_NO_SELLER_MSG: 'You have not placed any Order. Please invite your neighbourhood Seller Or simply Add from the list of your nearby Sellers in ‘My seller’ section to place an Order & avail exciting Offers.',
  OFFER_NO_SELLER_MSG: 'Invite your neighbourhood Seller/s Or simply Add from the list of your nearby Sellers in ‘My seller’ section to avail Exciting Offers.',
  NO_OFFER_MSG: 'There are no Offers available from your Seller/s currently.',
  NO_ORDER_MSG: 'You do not have any Active Order. Place an Order with your Seller Now and avail Cashback!',
  SKU_SEARCH_LIMIT: process.env.SKU_SEARCH_LIMIT,
  HOUSEHOLD_CATEGORY_ID: process.env.HOUSEHOLD_CATEGORY_ID,
  MILK_SKU_CATEGORY: process.env.MILK_SKU_CATEGORY,
  MILK_SKU_IDS: (process.env.MILK_SKU_IDS || '').split(','),
  MILK_SKU_MAIN_CATEGORY: process.env.MILK_SKU_MAIN_CATEGORY,
  DEFAULT_SELLER_IDS: (process.env.DEFAULT_SELLER_IDS || '').split(','),
  SELLER_REFERRAL_CASH_BACK: process.env.SELLER_REFERRAL_CASH_BACK,
  MILK_SKU_CASH_BACK_PERCENT: process.env.MILK_SKU_CASH_BACK_PERCENT,
  FIXED_CASHBACK: process.env.FIXED_CASHBACK,
  SKU_LIMIT: process.env.SKU_LIMIT,
  SELLER_FILTER_DISTANCE: process.env.SELLER_FILTER_DISTANCE,
  API_HOST: process.env.API_HOST,
  ADMIN: {
    CREDENTIALS: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASS,
    },
    HOST: process.env.ADMIN_HOST,
    LOGIN_API: process.env.ADMIN_LOGIN_API,
    APPROVAL_API: process.env.ADMIN_APPROVAL_API,
  },
  CASH_FREE: {
    POST_BACK_URL: process.env.CASH_FREE_POST_BACK_URL,
    SECRET_KEY: process.env.CASH_FREE_SECRET_KEY,
    HOST: process.env.CASH_FREE_API_HOST,
    STATUS_API: process.env.CASH_FREE_STATUS_API,
    APP_ID: process.env.CASH_FREE_APP_ID,
  },
  SMS: {
    AUTH_KEY: process.env.SMS_AUTH_KEY,
    HOST_NAME: 'http://api.msg91.com',
    PATH: '/api/v2/sendsms',
  },
  FB_GRAPH_ROUTE: process.env.FB_GRAPH_ROUTE,
  MESSAGE: process.env.MESSAGE,
  FIXED_CASH_BACK: process.env.FIXED_CASH_BACK,
  AUTO_CANCELLATION_TIMING: process.env.AUTO_CANCELLATION_TIMING,
  AWS: {
    S3: {
      BUCKET: process.env.AWS_S3_BUCKET,
      USER_IMAGE: 'userimages',
      CATEGORY_IMAGE: 'categoryimages',
      PRODUCT_IMAGE: 'productimages',
      WEARABLE_IMAGE: 'wearableimages',
      CALENDAR_ITEM_IMAGE: 'calendarserviceimages',
      BRAND_IMAGE: 'brandimages',
      SKU_IMAGE: 'skuimages',
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
    SELLER_FCM_KEY: process.env.SELLER_FCM_KEY,
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
    SOCKET_PORT: process.env.SOCKET_PORT || 3002,
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
    RECOMMENDED_VERSION: process.env.IOS_RECOMMENDED_VERSION,
  },
  ANDROID: {
    FORCE_VERSION: process.env.ANDROID_FORCE_VERSION,
    RECOMMENDED_VERSION: process.env.ANDROID_RECOMMENDED_VERSION,
  },
  GST: {
    HOST: process.env.GST_HOST,
    ROUTE: process.env.GST_ROUTE,
    ID: process.env.GST_ID,
    ENABLED: process.env.GST_ENABLE &&
        process.env.GST_ENABLE.toString().toLowerCase() === 'true',
    PASSWORD: process.env.GST_PWD,
    ACTION: process.env.GST_ACTION,
  },
  PAYTM: {
    END_POINT: process.env.PAYTM_ENDPOINTS,
    PAYTMMKEY: process.env.PAYTMMKEY,
    PAYTMMID: process.env.PAYTMMID,
    REQUEST: {
      request: {
        requestType: 'null',
        merchantGuid: process.env.PAYTMMID,
        merchantOrderId: '',
        salesWalletName: '',
        salesWalletGuid: process.env.PAYTMSID,
        payeeEmailId: '',
        payeePhoneNumber: '',
        payeeSsoId: '',
        appliedToNewUsers: process.env.PAYTMTONEW,
        amount: '0',
        currencyCode: 'INR',
      }, metadata: 'Testing Data',
      ipAddress: '127.0.0.1',
      platformName: 'PayTM',
      operationType: 'SALES_TO_USER_CREDIT',
    },
    SELLERREQUEST: {
      request: {
        requestType: 'null',
        merchantGuid: process.env.PAYTMMID,
        merchantOrderId: '',
        salesWalletName: '',
        salesWalletGuid: process.env.PAYTMSELLERSID,
        payeeEmailId: '',
        payeePhoneNumber: '',
        payeeSsoId: '',
        appliedToNewUsers: process.env.PAYTMTONEW,
        amount: '0',
        currencyCode: 'INR',
      }, metadata: 'Testing Data',
      ipAddress: '127.0.0.1',
      platformName: 'PayTM',
      operationType: 'SALES_TO_USER_CREDIT',
    },
    ERROR: {
      GE_0003: 'Could not complete request. Please retry again.',
      GE_1026: 'User wallet is in inactive mode.',
      GE_1033: 'Found multiple accounts with same phone no. and all are unverified.',
      GE_1034: 'Found multiple accounts with same mail-id and all are unverified.',
      STUC_1001: 'Payee wallet could not found. STUC_1010=Payee mobile not verified',
      STUC_1011: 'Payee email not verified',
      STUC_1012: 'Payee mobile and email not verified',
      WA_1004: 'Payee wallet not found.',
      RWL_0001: 'Could not check validity of the request',
      RWL_0002: 'Exceeded maximum allowed transacted amount',
      RWL_0003: 'Exceeded maximum per transaction amount',
      RWL_0004: 'Exceeded maximum no of allowed transactions',
    },
  },
  MAX_WISH_LIST_ITEMS: process.env.MAX_WISH_LIST_ITEMS,
  SELLER_IMAGE_TYPE: process.env.SELLER_IMAGE_TYPE,
  SELLER_CATEGORIES: process.env.SELLER_CATEGORIES,
  SELLER_PAYMENT_MODES: process.env.SELLER_PAYMENT_MODES,
  SELLER_BUSINESS_TYPES: process.env.SELLER_BUSINESS_TYPES,
  SELLER_BUSINESS_IMAGE_TYPES: process.env.SELLER_BUSINESS_IMAGE_TYPES,
  SELLER_BUSINESS_IMAGE_MAP: process.env.SELLER_BUSINESS_IMAGE_MAP,
  ORDER_LIMIT: process.env.ORDER_LIMIT,
  CONSUMER_LIMIT: process.env.CONSUMER_LIMIT,
  POP_UP_CONTENT: process.env.POP_UP_CONTENT,
  POP_UP_TITLE: process.env.POP_UP_TITLE,
  POP_UP_COUNTER: process.env.POP_UP_COUNTER,
  MILK_DEFAULT_CASH_BACK_PERCENT: process.env.MILK_DEFAULT_CASH_BACK_PERCENT,
  ALLOW_GEO_FILTER: process.env.ALLOW_GEO_FILTER,
  MAX_SELLER_SUGGESTIONS:process.env.MAX_SELLER_SUGGESTIONS,
  TRUECALLER_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEpFwIarbm48m6ueG+jhpt2vCGaqXZlwR/HPuL4zH1DQ/eWFbgQtVnrta8QhQz3ywLnbX6s7aecxUzzNJsTtS8VxKAYll4E1lJUqrNdWt8CU+TaUQuFm8vzLoPiYKEXl4bX5rzMQUMqA228gWuYmRFQnpduQTgnYIMO8XVUQXl5wIDAQAB\n-----END PUBLIC KEY-----',
};