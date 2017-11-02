'use strict';

export default (sequelize, DataTypes) => {
  const categories = sequelize.define('categories', {
        category_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          unique: true
        },
        category_name: {
          type: DataTypes.STRING
        },
        ref_id: {
          "type": DataTypes.INTEGER
        },
        category_level: {
          "type": DataTypes.INTEGER
        },
        category_image_name: {
          "type": DataTypes.STRING
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()')
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
        paranoid: true,
        underscored: true,
        tableName: 'categories',
      });

  categories.associate = (models) => {
    categories.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    categories.belongsTo(models.categories,
        {foreignKey: 'ref_id'});

    categories.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return categories;
};
