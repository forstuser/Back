'use strict';

export default (sequelize, DataTypes) => {
  const formTypes = sequelize.define('formTypes', {
        title: {
          type: DataTypes.STRING,
        },
        type: {
          type: DataTypes.INTEGER,
          unique: true,
        },
        description: {
          type: DataTypes.STRING,
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
        paranoid: true,
        underscored: true,
        tableName: 'form_types',
      });

  formTypes.associate = (models) => {
    formTypes.belongsTo(models.users,
        {foreignKey: 'updated_by'});

    formTypes.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return formTypes;
};
