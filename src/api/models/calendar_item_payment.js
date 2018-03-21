'use strict';

export default (sequelize, DataTypes) => {
  const calendar_item_payment = sequelize.define('calendar_item_payment', {
        ref_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        paid_on: {
          type: DataTypes.DATEONLY,
        },
        amount_paid: {
          type: DataTypes.FLOAT,
        },
        created_at: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_calendar_item_payment',
      });

  calendar_item_payment.associate = (models) => {
    calendar_item_payment.belongsTo(models.user_calendar_item,
        {foreignKey: 'ref_id', as: 'calendar_item'});
    calendar_item_payment.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    calendar_item_payment.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return calendar_item_payment;
};
