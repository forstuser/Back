'use strict';

export default (sequelize, DataTypes) => {
  const colours = sequelize.define('colours', {
        colour_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          unique: true,
        },
        colour_name: {
          type: DataTypes.STRING,
        },
        updated_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1
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
        defaultPrimaryKey: false,
        timestamps: true,
        underscored: true,
        tableName: 'colours',
      });

  colours.associate = (models) => {
    colours.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    colours.belongsTo(models.users,
        {foreignKey: 'created_by'});

    colours.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return colours;
};
