'use strict';

// Orders
// User_id
// Case_id
// Service_id
// product_id
// Category_id
// Address_id
// Status_type
// Case_details (json)

export default (sequelize, DataTypes) => {
  const table_orders = sequelize.define('table_orders', {
        user_id: {
          type: DataTypes.INTEGER,
        }, case_id: {
          type: DataTypes.INTEGER,
        }, service_id: {
          type: DataTypes.INTEGER,
        }, product_id: {
          type: DataTypes.INTEGER,
        }, category_id: {
          type: DataTypes.INTEGER,
        }, address_id: {
          type: DataTypes.INTEGER,
        }, case_details: {
          type: DataTypes.JSONB,
        }, updated_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        }, status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        }, created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        }, created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        }, updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_orders',
      });

  table_orders.associate = (models) => {

    table_orders.belongsTo(models.userAddress, {
      foreignKey: 'address_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    table_orders.belongsTo(models.categories, {
      foreignKey: 'category_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    table_orders.belongsTo(models.products, {
      foreignKey: 'product_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    table_orders.belongsTo(models.table_provider_services_mapping, {
      foreignKey: 'service_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    table_orders.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    table_orders.belongsTo(models.users,
        {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
    table_orders.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return table_orders;
};
