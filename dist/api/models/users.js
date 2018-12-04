'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (sequelize, DataTypes) => {
  const users = sequelize.define('users', {
    fb_id: {
      type: DataTypes.STRING
    },
    role_type: {
      type: DataTypes.INTEGER
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
    location: {
      type: DataTypes.STRING
    },
    last_active: {
      type: DataTypes.INTEGER
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: { min: -90, max: 90 }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: { min: -180, max: 180 }
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
    user_status_type: {
      type: DataTypes.INTEGER
    },
    gender: {
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
    last_login_at: {
      type: DataTypes.DATEONLY
    },
    last_logout_at: {
      type: DataTypes.DATEONLY
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
    service_center_accessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    temp_password: {
      type: DataTypes.STRING
    },
    otp_created_at: {
      type: DataTypes.DATE
    },
    socket_id: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'users',
    classMethods: {},
    hooks: {
      afterCreate: user => {
        user.updateAttributes({
          last_login_at: _moment2.default.utc().toISOString()
        });
      }
    }
  });

  users.associate = models => {
    users.hasMany(models.user_addresses, { as: 'addresses' });
    users.hasMany(models.jobs, { foreignKey: 'user_id', onDelete: 'cascade', hooks: true });
    users.hasMany(models.fcm_details, { foreignKey: 'user_id', onDelete: 'cascade', hooks: true });
    users.hasMany(models.jobs, { foreignKey: 'uploaded_by' });
    users.hasMany(models.jobs, { foreignKey: 'updated_by' });
    users.belongsTo(models.userRoles, { foreignKey: 'role_type', targetKey: 'role_type' });
    users.belongsTo(models.statuses, { foreignKey: 'user_status_type', targetKey: 'status_type' });
    users.hasMany(models.cashback_wallet, { foreignKey: 'user_id' });
    users.hasMany(models.credit_wallet, { foreignKey: 'user_id' });
    users.hasMany(models.loyalty_wallet, { foreignKey: 'user_id' });
    users.hasMany(models.user_wallet, { foreignKey: 'user_id' });
    users.hasMany(models.cashback_jobs, { foreignKey: 'user_id' });

    users.hasMany(models.jobs, { foreignKey: 'assigned_to_ce' });
    users.hasMany(models.jobs, { foreignKey: 'assigned_to_qe' });
    users.hasMany(models.mealUserMap, { foreignKey: 'user_id', onDelete: 'cascade', onUpdate: 'cascade' });

    users.belongsToMany(models.knowItems, {
      foreignKey: 'user_id',
      otherKey: 'know_item_id',
      through: 'know_user_likes',
      as: 'knowItems'
    });
  };

  return users;
};