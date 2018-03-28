'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var onlineSellers = sequelize.define('onlineSellers', {
    sid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    seller_name: {
      type: DataTypes.STRING
    },
    gstin: {
      type: DataTypes.STRING
    },
    url: {
      type: DataTypes.STRING
    },
    contact: {
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
    tableName: 'online_sellers'
  });

  onlineSellers.associate = function (models) {
    onlineSellers.belongsTo(models.users, { foreignKey: 'updated_by' });

    onlineSellers.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    onlineSellers.hasMany(models.bills, { foreignKey: 'seller_id' });
    onlineSellers.hasMany(models.sellerReviews, { foreignKey: 'seller_id', as: 'sellerReviews' });
  };
  return onlineSellers;
};