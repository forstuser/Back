'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const assisted_service_types = sequelize.define('assisted_service_types', {
    title: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    updated_by: {
      type: DataTypes.INTEGER
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
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_assisted_service_types'
  });

  assisted_service_types.associate = models => {
    assisted_service_types.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    assisted_service_types.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return assisted_service_types;
};