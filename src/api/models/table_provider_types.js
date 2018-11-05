'use strict';

export default (sequelize, DataTypes) => {
  const provider_types = sequelize.define('provider_types', {
        title: {
          type: DataTypes.STRING,
        },
        description : {
          type: DataTypes.STRING,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_provider_types',
      });

  provider_types.associate = (models) => {
    provider_types.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    provider_types.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return provider_types;
};
