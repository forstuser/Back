'use strict';

export default (sequelize, DataTypes) => {
  const service_calculation = sequelize.define('service_calculation', {
        ref_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        unit_type: {
          type: DataTypes.INTEGER,
        },
        unit_price: {
          type: DataTypes.FLOAT,
        },
        quantity: {
          type: DataTypes.FLOAT,
        },
        effective_date: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        selected_days: {
          type: DataTypes.ARRAY(DataTypes.INTEGER),
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
        tableName: 'table_service_calculation',
      });

  service_calculation.associate = (models) => {
    service_calculation.belongsTo(models.user_calendar_item,
        {foreignKey: 'ref_id'});
    service_calculation.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    service_calculation.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    service_calculation.belongsTo(models.quantities,
        {foreignKey: 'unit_type', as: 'unit'});
  };
  return service_calculation;
};
