'use strict';

export default (sequelize, DataTypes) => {
  const seller_types = sequelize.define('seller_types', {
        title: {
          type: DataTypes.STRING,
        },
        description : {
          type: DataTypes.STRING,
        },
        max_limit: {
          type: DataTypes.JSONB,
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
        tableName: 'table_seller_types',
      });

  seller_types.associate = (models) => {
    seller_types.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    seller_types.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return seller_types;
};
