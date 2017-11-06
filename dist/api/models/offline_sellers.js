'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var offlineSellers = sequelize.define('offlineSellers', {
    sid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    seller_name: {
      type: DataTypes.STRING
    },
    owner_name: {
      type: DataTypes.STRING
    },
    gstin: {
      type: DataTypes.STRING
    },
    pan_no: {
      type: DataTypes.STRING
    },
    reg_no: {
      type: DataTypes.STRING
    },
    is_service: {
      type: DataTypes.BOOLEAN
    },
    is_onboarded: {
      type: DataTypes.BOOLEAN
    },
    address: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    pincode: {
      type: DataTypes.STRING
    },
    latitude: {
      type: DataTypes.FLOAT
    },
    longitude: {
      type: DataTypes.STRING
    },
    url: {
      type: DataTypes.STRING
    },
    contact_no: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'offline_sellers'
  });

  offlineSellers.associate = function (models) {
    offlineSellers.belongsTo(models.users, { foreignKey: 'updated_by' });

    offlineSellers.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return offlineSellers;
};