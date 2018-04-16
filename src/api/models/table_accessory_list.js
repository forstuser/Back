'use strict';

export default (sequelize, DataTypes) => {
  const accessory_list = sequelize.define('accessory_list', {
        title: {
          type: DataTypes.STRING,
        },
        title_en: {
          type: DataTypes.STRING,
        },
        title_hi: {
          type: DataTypes.STRING,
        },
        title_ta: {
          type: DataTypes.STRING,
        },
        title_bn: {
          type: DataTypes.STRING,
        },
        title_ml: {
          type: DataTypes.STRING,
        },
        title_te: {
          type: DataTypes.STRING,
        },
        title_gu: {
          type: DataTypes.STRING,
        },
        title_kn: {
          type: DataTypes.STRING,
        },
        title_mr: {
          type: DataTypes.STRING,
        },
        asin_no: {
          type: DataTypes.STRING,
        },
        flipkart_product_id: {
          type: DataTypes.STRING,
        },
        other_product_id: {
          type: DataTypes.STRING,
        },
        brand_id: {
          type: DataTypes.INTEGER,
        },
        accessory_type_id: {
          type: DataTypes.INTEGER,
        },
        model: {
          type: DataTypes.STRING,
        },
        description: {
          type: DataTypes.STRING,
        },
        amazon_detail: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
        },
        flipkart_detail: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
        },
        other_detail: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        binbill_ratings: {
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
        tableName: 'table_accessory_list',
      });

  accessory_list.associate = (models) => {
    accessory_list.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    accessory_list.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_list.belongsTo(models.accessory_types,
        {
          foreignKey: 'accessory_type_id',
          as: 'accessory_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_list.belongsTo(models.brands,
        {
          foreignKey: 'brand_id',
          as: 'brand',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    accessory_list.belongsTo(models.categories,
        {
          foreignKey: 'accessory_id',
          as: 'accessory',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return accessory_list;
};
