'use strict';

import moment from 'moment';

export default (sequelize, DataTypes) => {
  const userAddress = sequelize.define('userAddress', {
    address_type: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {min: -90, max: 90},
    },
    longitude: {
      type: DataTypes.INTEGER,
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
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'user_address',
    hooks: {
      afterCreate: (user) => {
        user.updateAttributes({
          last_login: moment.utc().toISOString(),
        });
      },
    },
  });

  userAddress.associate= (models) => {
    userAddress.belongsTo(models.users,
        {onDelete: 'cascade', hooks: true});
  };

  return userAddress;
};
