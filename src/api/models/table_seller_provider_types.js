'use strict';

export default (sequelize, DataTypes) => {
  const seller_provide_type = sequelize.define('seller_provide_type', {
        provider_type_id: {
          type: DataTypes.INTEGER,
        },
        seller_id: {
          type: DataTypes.INTEGER,
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
        tableName: 'table_seller_provide_types',
      });

  seller_provide_type.associate = (models) => {
    seller_provide_type.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    seller_provide_type.belongsTo(models.provider_types,
        {foreignKey: 'provider_type_id', onDelete: 'cascade', onUpdate: 'cascade'});
    seller_provide_type.belongsTo(models.offlineSellers,
        {foreignKey: 'seller_id', as: 'seller', onDelete: 'cascade', onUpdate: 'cascade'});
    seller_provide_type.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return seller_provide_type;
};
