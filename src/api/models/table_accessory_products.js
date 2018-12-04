'use strict';
export default (sequelize, DataTypes) => {
  const table_accessory_products = sequelize.define('table_accessory_products',
      {
        title: {
          type: DataTypes.STRING(2550),
        },
        product_brand_id: {
          type: DataTypes.INTEGER,
        },
        product_model: {
          type: DataTypes.STRING,
        },
        description: {
          type: DataTypes.STRING(25500),
        },
        asin: {
          type: DataTypes.STRING,
        },
        pid: {
          type: DataTypes.STRING,
        },
        details: {
          type: DataTypes.JSONB,
        },
        accessory_id: {
          type: DataTypes.INTEGER,
        },
        accessory_type_id: {
          type: DataTypes.INTEGER,
        },
        bb_class: {
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
        affiliate_type: {
          type: DataTypes.INTEGER,
        },
        url: {
          type: DataTypes.STRING(2550),
        },
        include_email: {
          type: DataTypes.BOOLEAN,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_accessory_products',
      });

  table_accessory_products.associate = (models) => {

    table_accessory_products.belongsTo(models.table_accessory_types,
        {
          foreignKey: 'accessory_type_id',
          as: 'accessory_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_products.belongsTo(models.brands,
        {
          foreignKey: 'product_brand_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_products.belongsTo(models.table_accessory_categories,
        {
          foreignKey: 'accessory_id',
          as: 'accessory',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    table_accessory_products.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_accessory_products.belongsTo(models.users,
        {
          foreignKey: 'created_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_accessory_products.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return table_accessory_products;
}