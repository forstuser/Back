'use strict';

export default (sequelize, DataTypes) => {
  const sku_measurement = sequelize.define('sku_measurement', {
        sku_id: {
          type: DataTypes.INTEGER,
        },
        measurement_type: {
          type: DataTypes.INTEGER,
        },
        measurement_value: {
          type: DataTypes.FLOAT,
        },
        pack_numbers: {
          type: DataTypes.INTEGER,
        },
        cashback_percent: {
          type: DataTypes.FLOAT,
        },
        discount_percent: {
          type: DataTypes.FLOAT,
        },
        bar_code: {
          type: DataTypes.STRING,
        },
        mrp: {
          type: DataTypes.FLOAT,
        },
        tax: {
          type: DataTypes.FLOAT,
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
        tableName: 'table_sku_measurement_detail',
      });

  sku_measurement.associate = (models) => {
    sku_measurement.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_measurement.belongsTo(models.sku,
        {foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_measurement.belongsTo(models.measurement,
        {
          foreignKey: 'measurement_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    sku_measurement.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return sku_measurement;
};
