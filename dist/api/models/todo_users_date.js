'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var todoUserDate = sequelize.define('todoUserDate', {
    user_todo_id: {
      type: DataTypes.INTEGER
    },
    selected_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
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
    tableName: 'table_todo_user_date'
  });

  todoUserDate.associate = function (models) {
    todoUserDate.belongsTo(models.todoUserMap, { foreignKey: 'user_todo_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return todoUserDate;
};