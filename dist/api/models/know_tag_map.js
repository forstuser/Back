'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const know_tag_map = sequelize.define('know_tag_map', {
    know_item_id: {
      type: DataTypes.INTEGER
    },
    tag_id: {
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
    tableName: 'know_tag_map'
  });

  know_tag_map.associate = models => {
    know_tag_map.belongsTo(models.knowItems, { foreignKey: 'know_item_id' });
    know_tag_map.belongsTo(models.tags, { foreignKey: 'tag_id' });
  };
  return know_tag_map;
};