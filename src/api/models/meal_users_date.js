'use strict';
export default (sequelize, DataTypes) => {
  const mealUserDate = sequelize.define('mealUserDate', {
        user_meal_id: {
          type: DataTypes.INTEGER,
        },
        selected_date: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
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
        tableName: 'table_meal_user_date',
      });

  mealUserDate.associate = (models) => {
    mealUserDate.belongsTo(models.mealUserMap, {foreignKey: 'user_meal_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return mealUserDate;
}








