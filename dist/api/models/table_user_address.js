'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

exports.default = function(sequelize, DataTypes) {
  var userAddress = sequelize.define('userAddress', {
    address_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    address_line_1: {
      type: DataTypes.STRING,
    },
    address_line_2: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: {min: -90, max: 90},
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: {min: -180, max: 180},
    },
    pin: {
      type: DataTypes.STRING,
    },
    status_type: {
      defaultValue: 1,
      type: DataTypes.INTEGER,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_by: {
      type: DataTypes.INTEGER,
    },
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'user_addresses',
    hooks: {
      afterCreate: function afterCreate(user) {
        user.updateAttributes({
          last_login: _moment2.default.utc().toISOString(),
        });
      },
    },
  });

  userAddress.associate = function(models) {
    userAddress.belongsTo(models.users, {onDelete: 'cascade', hooks: true});
    userAddress.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});
    userAddress.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };

  return userAddress;
};