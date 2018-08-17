'use strict';

module.exports = (sequelize, DataTypes) => {
  const fcm_details = sequelize.define('fcm_details', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    seller_user_id: {
      type: DataTypes.INTEGER,
    },
    fcm_id: {
      type: DataTypes.STRING,
    },
    selected_language: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    platform_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  }, {
    freezeTableName: true,
    tableName: 'fcm_details',
    underscored: true,
  });

  fcm_details.associate = (models) => {
    fcm_details.belongsTo(models.users,
        {foreignKey: 'user_id', as: 'consumer'});
    fcm_details.belongsTo(models.seller_users,
        {foreignKey: 'seller_user_id', as: 'seller'});
  };

  return fcm_details;
};