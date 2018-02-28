'use strict';

export default (sequelize, DataTypes) => {
  const logs = sequelize.define('logs', {
        user_id: {
          type: DataTypes.INTEGER,
        },
        log_type: {
          type: DataTypes.INTEGER,
        },
        api_path: {
          type: DataTypes.STRING,
        },
        log_content: {
          type: DataTypes.STRING(9999),
        },
        api_action: {
          type: DataTypes.STRING,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: 'logs',
      });

  logs.associate = (models) => {
    logs.belongsTo(models.users,
        {foreignKey: 'user_id', as: 'user'});
  };
  return logs;
};
