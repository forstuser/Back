'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var tags = sequelize.define('tags', {
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'tags'
  });

  tags.associate = function (models) {
    tags.belongsTo(models.users, { foreignKey: 'updated_by' });
    tags.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    tags.belongsToMany(models.knowItems, {
      foreignKey: 'tag_id',
      otherKey: 'know_item_id',
      through: 'know_tag_map',
      as: 'knowItems'
    });
  };
  return tags;
};