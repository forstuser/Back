'use strict';

export default (sequelize, DataTypes) => {
  const user_calendar_item = sequelize.define('user_calendar_item', {
        provider_name: {
          type: DataTypes.STRING,
        },
        provider_number: {
          type: DataTypes.STRING,
        },
        product_name: {
          type: DataTypes.STRING,
        },
        wages_type: {
          type: DataTypes.INTEGER,
        },
        selected_days: {
          type: DataTypes.ARRAY(DataTypes.INTEGER),
        },
        user_id: {
          type: DataTypes.INTEGER,
        },
        service_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        end_date: {
          type: DataTypes.DATEONLY
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
        tableName: 'table_user_calendar_item',
      });

  user_calendar_item.associate = (models) => {
    user_calendar_item.belongsTo(models.users,
        { foreignKey: 'updated_by' });
    user_calendar_item.belongsTo(models.users,
        { foreignKey: 'user_id' });
    user_calendar_item.belongsTo(models.calendar_services,
        { foreignKey: 'service_id', as: 'service_type' });
    user_calendar_item.hasMany(models.service_payment,
        { foreignKey: 'ref_id', as: 'payment_detail', onDelete: 'cascade' });
    user_calendar_item.hasMany(models.calendar_item_payment,
        { foreignKey: 'ref_id', as: 'payments', onDelete: 'cascade' });
    user_calendar_item.hasMany(models.service_calculation,
        { foreignKey: 'ref_id', as: 'calculation_detail', onDelete: 'cascade' });
    user_calendar_item.belongsTo(models.statuses,
        { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return user_calendar_item;
};
