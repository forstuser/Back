'use strict';

export default (sequelize, DataTypes) => {
  const know_user_likes = sequelize.define('know_user_likes',
      {
        know_item_id: {
          type: DataTypes.INTEGER,
        },
        user_id: {
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
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'know_user_likes',
      });

  know_user_likes.associate = (models) => {
    know_user_likes.belongsTo(models.knowItems,
        {foreignKey: 'know_item_id'});
    know_user_likes.belongsTo(models.users,
        {foreignKey: 'user_id'});
  };
  return know_user_likes;
};
