'use strict';
export default (sequelize, DataTypes) => {
  const accessory_part = sequelize.define('accessory_part', {
        category_id: {
          type: DataTypes.INTEGER,
        },
        main_category_id: {
          type: DataTypes.INTEGER,
        },
        priority: {
          type: DataTypes.INTEGER,
        },
        type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        title: {
          type: DataTypes.STRING,
        },
        file_name: {
          type: DataTypes.STRING,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_accessory_part',
      });

  accessory_part.associate = (models) => {

    accessory_part.belongsTo(models.categories, {
      foreignKey: 'category_id', as: 'category',
      onDelete: 'cascade', onUpdate: 'cascade',
    });

    accessory_part.belongsTo(models.categories, {
      foreignKey: 'main_category_id', as: 'main_category',
      onDelete: 'cascade', onUpdate: 'cascade',
    });

    accessory_part.hasMany(models.products, {
      foreignKey: 'accessory_part_id', as: 'product',
      onDelete: 'cascade', onUpdate: 'cascade',
    });

    accessory_part.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});

    accessory_part.belongsTo(models.users,
        {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
    accessory_part.belongsTo(models.statuses, {
      foreignKey: 'status_type', targetKey: 'status_type',
      onDelete: 'cascade', onUpdate: 'cascade',
    });

  };
  return accessory_part;
}