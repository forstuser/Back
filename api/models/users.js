/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_users', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'user_id'
  },
  UserTypeID: {
    type: Sequelize.INTEGER,
    field: 'user_type_id'
  },
  Name: {
    type: Sequelize.STRING,
    field: 'fullname'
  },
  GoogleAuthKey: {
    type: Sequelize.STRING,
    field: 'gmail_id'
  },
  FacebookAuthKey: {
    type: Sequelize.STRING,
    field: 'facebook_id'
  },
  EmailAddress: {
    type: Sequelize.STRING,
    unique: true,
    validate: {
      isEmail: true
    },
    field: 'email_id'
  },
  PhoneNo: {
    type: Sequelize.STRING,
    unique: true,
    field: 'mobile_no'
  },
  Password: {
    type: Sequelize.STRING,
    field: 'password'
  },
  OTP: {
    type: Sequelize.STRING,
    field: 'tmp_password'
  },
  Location: {
    type: Sequelize.STRING,
    field: 'location'
  },
  Latitude: {
    type: Sequelize.STRING,
    field: 'latitude'
  },
  Longitude: {
    type: Sequelize.STRING,
    field: 'longitude'
  },
  ImageLink: {
    type: Sequelize.STRING,
    field: 'image'
  },
  OSTypeId: {
    type: Sequelize.STRING,
    field: 'os_type_id'
  },
  accessLevel: {
    type: Sequelize.ENUM('user', 'free', 'premium'),
    defaultValue: 'user'
  },
  createdAt: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW,
    field: 'created_on'
  },
  GCMId: {
    type: Sequelize.STRING,
    field: 'gcm_id'
  },
  passwordResetToken: {
    type: Sequelize.STRING
  },
  token: {
    type: Sequelize.STRING
  },
  expiresIn: {
    type: Sequelize.BIGINT
  },
  updatedAt: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW,
    field: 'updated_on'
  },
  deviceId: {
    type: Sequelize.STRING,
    field: 'device_id'
  },
  deviceModel: {
    type: Sequelize.STRING,
    field: 'device_model'
  },
  apkVersion: {
    type: Sequelize.STRING,
    field: 'apk_version'
  },
  LastLoginOn: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW,
    field: 'last_login'
  },
  status_id: {
    defaultValue: 1,
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
