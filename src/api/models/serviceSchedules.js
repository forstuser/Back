'use strict';

export default (sequelize, DataTypes) => {
  const serviceSchedules = sequelize.define('serviceSchedules', {
        category_id: {
          type: DataTypes.INTEGER,
        },
        title: {
          type: DataTypes.STRING,
        },
        inclusions: {
          type: DataTypes.STRING,
        },
        exclusions: {
          type: DataTypes.STRING,
        },
        brand_id: {
          type: DataTypes.INTEGER,
        },
        service_number: {
          type: DataTypes.STRING,
        },
        service_type: {
          type: DataTypes.INTEGER,
        },
        distance: {
          type: DataTypes.INTEGER,
        },
        due_in_months: {
          type: DataTypes.FLOAT,
        },
        due_in_days: {
          type: DataTypes.FLOAT,
        },
        created_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
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
        paranoid: true,
        underscored: true,
        tableName: 'service_schedules',
      });

  serviceSchedules.associate = (models) => {
    serviceSchedules.belongsTo(models.users,
        {foreignKey: 'updated_by'});

    serviceSchedules.belongsTo(models.users,
        {foreignKey: 'created_by'});

    serviceSchedules.belongsTo(models.brands,
        {foreignKey: 'brand_id', as: 'brand'});
    serviceSchedules.belongsTo(models.categories,
        {foreignKey: 'category_id'});
    serviceSchedules.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return serviceSchedules;
};
