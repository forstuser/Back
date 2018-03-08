'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var know_user_likes = sequelize.define('know_user_likes', {
    know_item_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
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
    tableName: 'know_user_likes'
  });

  know_user_likes.associate = function (models) {
    know_user_likes.belongsTo(models.knowItems, { foreignKey: 'know_item_id' });
    know_user_likes.belongsTo(models.users, { foreignKey: 'user_id' });
  };
  return know_user_likes;
};