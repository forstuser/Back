'use strict';

import moment from 'moment';

export default (sequelize, DataTypes) => {
  const users = sequelize.define('users', {
    fb_id: {
      type: DataTypes.STRING,
    },
    role_type: {
      type: DataTypes.INTEGER,
    },
    full_name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    location: {
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
    mobile_no: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        is: /^(\+91-|\+91|0)?\d{10}$/,
      },
    },
    password: {
      type: DataTypes.STRING,
    },
    user_status_type: {
      type: DataTypes.INTEGER,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
    },
    email_secret: {
      type: DataTypes.STRING(2000),
    },
    image_name: {
      type: DataTypes.STRING,
    },
    last_api: {
      type: DataTypes.STRING,
    },
    last_login_at: {
      type: DataTypes.DATEONLY,
    },
    last_logout_at: {
      type: DataTypes.DATEONLY,
    },
    last_active_date: {
      type: DataTypes.DATEONLY,
    },
    last_password_change_at: {
      type: DataTypes.DATEONLY,
    },
    created_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    service_center_accessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'users',
    classMethods: {},
    hooks: {
      afterCreate: (user) => {
        user.updateAttributes({
          last_login_at: moment.utc().toISOString(),
        });
      },
    },
  });

  users.associate = (models) => {
    users.hasMany(models.userAddress, {as: 'addresses'});
    users.hasMany(models.jobs,
        {foreignKey: 'user_id', onDelete: 'cascade', hooks: true});
    users.hasMany(models.fcmDetails,
        {foreignKey: 'user_id', onDelete: 'cascade', hooks: true});
    users.hasMany(models.jobs, {foreignKey: 'uploaded_by'});
    users.hasMany(models.jobs, {foreignKey: 'updated_by'});
    users.belongsTo(models.userRoles,
        {foreignKey: 'role_type', targetKey: 'role_type'});
    users.belongsTo(models.statuses,
        {foreignKey: 'user_status_type', targetKey: 'status_type'});
    users.hasMany(models.jobCopies, {foreignKey: 'updated_by'});

    users.hasMany(models.jobs, {foreignKey: 'assigned_to_ce'});
    users.hasMany(models.jobs, {foreignKey: 'assigned_to_qe'});


    users.belongsToMany(models.knowItems,
        {
          foreignKey: 'user_id',
          otherKey: 'know_item_id',
          through: 'know_user_likes',
          as: 'knowItems',
        });
  };

  return users;
};
