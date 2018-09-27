'use strict';

export default (sequelize, DataTypes) => {
  const serviceCenters = sequelize.define('serviceCenters', {
        center_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          unique: true,
        },
        center_name: {
          type: DataTypes.STRING,
        },
        center_address: {
          type: DataTypes.STRING,
        },
        center_city: {
          type: DataTypes.STRING,
        },
        center_state: {
          type: DataTypes.STRING,
        },
        center_country: {
          type: DataTypes.STRING,
        },
        center_pin: {
          type: DataTypes.STRING,
        },
        center_longitude: {
          type: DataTypes.FLOAT,
        },
        center_latitude: {
          type: DataTypes.FLOAT,
        },
        center_timings: {
          type: DataTypes.STRING,
        },
        center_days: {
          type: DataTypes.STRING,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        created_by: {
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
        defaultPrimaryKey: false,
        timestamps: true,
        underscored: true,
        tableName: 'service_centers',
      });

  serviceCenters.associate = (models) => {
    serviceCenters.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    serviceCenters.belongsTo(models.users,
        {foreignKey: 'created_by'});

    serviceCenters.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    serviceCenters.belongsToMany(models.brands, {
      foreignKey: 'center_id',
      otherKey: 'brand_id',
      through: 'center_brand_mapping',
      as: 'brands',
    });
    serviceCenters.hasMany(models.centerDetails, {
      foreignKey: 'center_id',
      as: 'centerDetails',
    });
  };
  return serviceCenters;
};
