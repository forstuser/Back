'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (sequelize, DataTypes) => {
  const seller_users = sequelize.define('seller_users', {
    fb_id: {
      type: DataTypes.STRING
    },
    role_type: {
      type: DataTypes.INTEGER,
      defaultValue: 6
    },
    full_name: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    mobile_no: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        is: /^(\+91-|\+91|0)?\d{10}$/
      }
    },
    password: {
      type: DataTypes.STRING
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    email_verified: {
      type: DataTypes.BOOLEAN
    },
    email_secret: {
      type: DataTypes.STRING(2000)
    },
    image_name: {
      type: DataTypes.STRING
    },
    last_api: {
      type: DataTypes.STRING
    },
    last_active_date: {
      type: DataTypes.DATE
    },
    last_password_change_at: {
      type: DataTypes.DATEONLY
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    otp_created_at: {
      type: DataTypes.DATE
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'table_seller_users',
    classMethods: {},
    hooks: {
      afterCreate: user => {
        user.updateAttributes({
          last_login_at: _moment2.default.utc().toISOString()
        });
      }
    }
  });

  seller_users.associate = models => {
    seller_users.hasMany(models.sellers, { as: 'businesses', foreignKey: 'user_id' });
    seller_users.hasMany(models.jobs, { foreignKey: 'user_id', onDelete: 'cascade', hooks: true });
    seller_users.hasMany(models.fcm_details, { foreignKey: 'seller_user_id', onDelete: 'cascade', hooks: true });
    seller_users.belongsTo(models.userRoles, { foreignKey: 'role_type', targetKey: 'role_type' });
    seller_users.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };

  return seller_users;
};