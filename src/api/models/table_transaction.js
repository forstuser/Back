'use strict';
export default (sequelize, DataTypes) => {
  const table_transaction = sequelize.define('table_transaction', {

        accessory_product_id: { // fk
          type: DataTypes.INTEGER,
        },
        transaction_id: {
          type: DataTypes.STRING,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        amount_paid: {
          type: DataTypes.INTEGER,
        },
        product_id: { // fk
          type: DataTypes.INTEGER,
        },
        transaction_date: {
          type: DataTypes.DATE,
        },
        quantity: {
          type: DataTypes.INTEGER,
        },
        payment_mode_id: { // fk
          type: DataTypes.INTEGER,
        },
        estimated_delivery_date: {
          type: DataTypes.STRING,
        },
        delivery_address: {
          type: DataTypes.STRING,
        },
        seller_id: { //fk offline sellers
          type: DataTypes.INTEGER,
        },
        online_seller_id: { //online_sellers_list
          type: DataTypes.INTEGER,
        },
        details_url: {
          type: DataTypes.STRING,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_transaction',
      });

  table_transaction.associate = (models) => {

    table_transaction.belongsTo(models.products,
        {
          foreignKey: 'product_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_transaction.belongsTo(models.table_accessory_products,
        {
          foreignKey: 'accessory_product_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_transaction.belongsTo(models.onlineSellers,
        {
          foreignKey: 'online_seller_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_transaction.belongsTo(models.offlineSellers,
        {
          foreignKey: 'seller_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_transaction.belongsTo(models.table_payment_mode,
        {
          foreignKey: 'payment_mode_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_transaction.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_transaction.belongsTo(models.users,
        {
          foreignKey: 'created_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_transaction.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return table_transaction;
}