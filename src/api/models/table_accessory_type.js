'use strict';
export default (sequelize, DataTypes) => {
  const table_accessory_type = sequelize.define('table_accessory_type', {
        category_id: {
          type: DataTypes.INTEGER,
        },
        main_category_id: {
          type: DataTypes.INTEGER,
        },
        model: {
          type: DataTypes.STRING,
        },
        brand_id: {
          type: DataTypes.INTEGER,
        },
        variant: {
          type: DataTypes.STRING,
        },
        accessory_id: {
          type: DataTypes.INTEGER,
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
        tableName: 'table_accessory_type',
      });

  table_accessory_type.associate = (models) => {

    table_accessory_type.belongsTo(models.categories,
        {
          foreignKey: 'category_id',
          as: 'category',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_type.belongsTo(models.categories,
        {
          foreignKey: 'main_category_id',
          as: 'main_category',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_type.belongsTo(models.categories,
        {
          foreignKey: 'accessory_id',
          as: 'accessory',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_type.belongsTo(models.brands,
        {
          foreignKey: 'brand_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_type.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_type.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_accessory_type.belongsTo(models.users,
        {
          foreignKey: 'created_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_accessory_type.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    // .hasMany(models.todoUserMap,
    //     {foreignKey: 'todo_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return table_accessory_type;
}