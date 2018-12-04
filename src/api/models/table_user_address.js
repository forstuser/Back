'use strict';

import moment from 'moment';

export default (sequelize, DataTypes) => {
  const user_addresses = sequelize.define('user_addresses', {
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
    city_id: {
      type: DataTypes.INTEGER,
    },
    state_id: {
      type: DataTypes.INTEGER,
    },
    locality_id: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATEONLY,
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
    tableName: 'table_user_addresses',
    hooks: {
      afterCreate: (user) => {
        user.updateAttributes({
          last_login: moment.utc().toISOString(),
        });
      },
    },
  });

  user_addresses.associate = (models) => {
    user_addresses.belongsTo(models.users,
        {onDelete: 'cascade', hooks: true});
    user_addresses.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updater'});
    user_addresses.belongsTo(models.cities,
        {foreignKey: 'city_id'});
    user_addresses.belongsTo(models.states,
        {foreignKey: 'state_id'});
    user_addresses.belongsTo(models.locality,
        {foreignKey: 'locality_id'});
    user_addresses.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };

  return user_addresses;
};
