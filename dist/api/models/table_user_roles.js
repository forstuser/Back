'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const userRoles = sequelize.define('userRoles', {
    role_type: {
      type: DataTypes.INTEGER,
      unique: true
    },
    role_name: {
      type: DataTypes.STRING,
      unique: true
    },
    created_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'user_roles'
  });

  userRoles.associate = models => {
    userRoles.hasMany(models.users, { foreignKey: 'role_type', sourceKey: 'role_type' });
  };
  return userRoles;
};