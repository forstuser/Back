'use strict';

export default (sequelize, DataTypes) => {
  const sku_location = sequelize.define('sku_location', {
        sku_id: {
          type: DataTypes.INTEGER,
        },
        sku_measurement_id: {
          type: DataTypes.INTEGER,
        },
        city_id: {
          type: DataTypes.INTEGER,
        },
        state_id: {
          type: DataTypes.INTEGER,
        },
        location: {
          type: DataTypes.STRING,
        },
        longitude: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: null,
          validate: {min: -180, max: 180},
        },
        latitude: {
          type: DataTypes.FLOAT,
          allowNull: true,
          defaultValue: null,
          validate: {min: -90, max: 90},
        },
        price: {
          type: DataTypes.FLOAT,
        },
        pincode: {
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
        tableName: 'table_sku_location_mapping',
      });

  sku_location.associate = (models) => {
    sku_location.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_location.belongsTo(models.sku,
        {foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_location.belongsTo(models.sku_measurement,
        {foreignKey: 'sku_measurement_id', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_location.belongsTo(models.cities,
        {foreignKey: 'city_id', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_location.belongsTo(models.states,
        {foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade'});
    sku_location.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return sku_location;
};
