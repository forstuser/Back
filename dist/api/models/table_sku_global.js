'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const sku = sequelize.define('sku', {
    brand_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    sub_category_id: {
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING
    },
    hsn_code: {
      type: DataTypes.STRING
    },
    mrp: {
      type: DataTypes.FLOAT
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_sku_global'
  });

  sku.associate = models => {
    sku.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    sku.belongsTo(models.brands, { foreignKey: 'brand_id', onDelete: 'cascade', onUpdate: 'cascade' });
    sku.belongsTo(models.categories, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sku.belongsTo(models.categories, {
      foreignKey: 'main_category_id',
      as: 'main_category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sku.belongsTo(models.categories, {
      foreignKey: 'sub_category_id',
      as: 'sub_category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sku.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sku.hasMany(models.sku_measurement, {
      foreignKey: 'sku_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return sku;
};