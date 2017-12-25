'use strict';

module.exports = function(sequelize, DataTypes) {
  var fcmDetails = sequelize.define('fcmDetails', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    fcm_id: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    platform_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    }
  }, {
    freezeTableName: true,
    tableName: 'fcm_details',
    underscored: true,
  });

  fcmDetails.associate = function(models) {
    fcmDetails.belongsTo(models.users, {foreignKey: 'user_id', as: 'consumer'});
  };

  return fcmDetails;
};