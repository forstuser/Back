'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const knowItems = sequelize.define('knowItems', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    title: {
      type: DataTypes.STRING
    },
    title_en: {
      type: DataTypes.STRING
    },
    title_hi: {
      type: DataTypes.STRING
    },
    title_ta: {
      type: DataTypes.STRING
    },
    title_bn: {
      type: DataTypes.STRING
    },
    title_ml: {
      type: DataTypes.STRING
    },
    title_te: {
      type: DataTypes.STRING
    },
    title_gu: {
      type: DataTypes.STRING
    },
    title_kn: {
      type: DataTypes.STRING
    },
    title_mr: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    description_en: {
      type: DataTypes.STRING
    },
    description_hi: {
      type: DataTypes.STRING
    },
    description_ta: {
      type: DataTypes.STRING
    },
    description_bn: {
      type: DataTypes.STRING
    },
    description_ml: {
      type: DataTypes.STRING
    },
    description_te: {
      type: DataTypes.STRING
    },
    description_gu: {
      type: DataTypes.STRING
    },
    description_kn: {
      type: DataTypes.STRING
    },
    description_mr: {
      type: DataTypes.STRING
    },
    updated_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    batch_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    short_url: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'know_items'
  });

  knowItems.associate = models => {
    knowItems.belongsTo(models.users, { foreignKey: 'updated_by' });
    knowItems.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    knowItems.belongsTo(models.categories, {
      foreignKey: 'category_id',
      targetKey: 'category_id',
      as: 'category'
    });
    knowItems.belongsToMany(models.tags, {
      foreignKey: 'know_item_id',
      otherKey: 'tag_id',
      through: 'know_tag_map',
      as: 'tags'
    });

    knowItems.belongsToMany(models.users, {
      foreignKey: 'know_item_id',
      otherKey: 'user_id',
      through: 'know_user_likes',
      as: 'users'
    });
  };
  return knowItems;
};