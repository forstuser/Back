/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('users', {
  userId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  typeId: {
    type: Sequelize.INTEGER
  },
  fullName: {
    type: Sequelize.STRING,
    notEmpty: false
  },
  googleAuthKey: {
    type: Sequelize.STRING
  },
  facebookAuthKey: {
    type: Sequelize.STRING
  },
  emailAddress: {
    type: Sequelize.STRING,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  mobileNo: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  tempPassword: {
    type: Sequelize.STRING
  },
  location: {
    type: Sequelize.STRING
  },
  geoLocation: {
    type: Sequelize.STRING
  },
  imageLink: {
    type: Sequelize.STRING
  },
  osTypeId: {
    type: Sequelize.STRING
  },
  accessLevel: {
    type: Sequelize.ENUM('user', 'free', 'premium'),
    defaultValue: 'user'
  },
  createdAt: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },

  gcmId: {
    type: Sequelize.STRING
  },
  passwordResetToken: {
    type: Sequelize.STRING
  },
  passwordResetExpires: {
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
    defaultValue: Sequelize.NOW
  },
  deviceId: {
    type: Sequelize.STRING
  },
  deviceModel: {
    type: Sequelize.STRING
  },
  apkVersion: {
    type: Sequelize.STRING
  },
  lastLoginOn: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
