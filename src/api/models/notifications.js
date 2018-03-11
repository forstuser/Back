/*jshint esversion: 6 */
'use strict';

export default (sequelize, DataTypes) => {
  const mailBox = sequelize.define('mailBox', {
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    bill_product_id: {
      type: DataTypes.INTEGER,
    },
    total_amount: {
      type: DataTypes.FLOAT,
    },
    taxes: {
      type: DataTypes.FLOAT,
    },
    due_amount: {
      type: DataTypes.FLOAT,
    },
    due_date: {
      type: DataTypes.DATE,
    },
    notification_type: {
      type: DataTypes.INTEGER,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING(2000),
    },
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },
    bill_id: {
      type: DataTypes.INTEGER,
    },
    job_id: {
      type: DataTypes.INTEGER,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    copies: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
    },
  }, {
    freezeTableName: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_inbox_notification',
  });

  mailBox.associate = (models) => {
    mailBox.belongsTo(models.users,
        {foreignKey: 'user_id'});
    mailBox.belongsTo(models.products, {
      foreignKey: 'bill_product_id', as: 'product',
    });
  };

  return mailBox;
}
