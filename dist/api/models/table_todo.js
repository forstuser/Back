'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var todo = sequelize.define('todo', {
    name: {
      type: DataTypes.STRING
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    created_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    item_type: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    }

  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_todo'
  });

  todo.associate = function (models) {
    todo.belongsTo(models.users, { foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade' });
    todo.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    todo.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    todo.hasMany(models.todoUserMap, { foreignKey: 'todo_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return todo;
};