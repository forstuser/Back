'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const seller_service_types = sequelize.define('seller_service_types', {
    service_type_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING
    },
    mobile_no: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.JSONB
    },
    document_name: {
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
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_seller_assisted_services_types'
  });

  seller_service_types.associate = models => {
    seller_service_types.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_service_types.belongsTo(models.assisted_service_types, {
      foreignKey: 'service_type_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_service_types.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_service_types.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return seller_service_types;
};