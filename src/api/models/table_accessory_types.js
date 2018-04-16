'use strict';

export default (sequelize, DataTypes) => {
  const accessory_types = sequelize.define('accessory_types', {
        accessory_name: {
          type: DataTypes.STRING,
        },
        accessory_name_en: {
          type: DataTypes.STRING,
        },
        accessory_name_hi: {
          type: DataTypes.STRING,
        },
        accessory_name_ta: {
          type: DataTypes.STRING,
        },
        accessory_name_bn: {
          type: DataTypes.STRING,
        },
        accessory_name_ml: {
          type: DataTypes.STRING,
        },
        accessory_name_te: {
          type: DataTypes.STRING,
        },
        accessory_name_gu: {
          type: DataTypes.STRING,
        },
        accessory_name_kn: {
          type: DataTypes.STRING,
        },
        accessory_name_mr: {
          type: DataTypes.STRING,
        },
        category_id: {
          type: DataTypes.INTEGER,
        },
        main_category_id: {
          type: DataTypes.INTEGER,
        },
        accessory_id: {
          type: DataTypes.INTEGER,
        },
        brand_id: {
          type: DataTypes.INTEGER,
        },
        model: {
          type: DataTypes.STRING,
        },
        variant: {
          type: DataTypes.STRING,
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
        updated_by: {
          type: DataTypes.INTEGER,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_accessory_types',
      });

  accessory_types.associate = (models) => {
    accessory_types.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    accessory_types.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_types.belongsTo(models.categories,
        {
          foreignKey: 'category_id',
          as: 'category',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_types.belongsTo(models.categories,
        {
          foreignKey: 'main_category_id',
          as: 'main_category',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_types.belongsTo(models.brands,
        {
          foreignKey: 'brand_id',
          as: 'brand',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_types.belongsTo(models.categories,
        {
          foreignKey: 'accessory_id',
          as: 'accessory',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return accessory_types;
};
