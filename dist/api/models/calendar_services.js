'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var calendar_services = sequelize.define('calendar_services', {
    service_name: {
      type: DataTypes.STRING
    },
    service_name_en: {
      type: DataTypes.STRING
    },
    service_name_hi: {
      type: DataTypes.STRING
    },
    service_name_ta: {
      type: DataTypes.STRING
    },
    service_name_bn: {
      type: DataTypes.STRING
    },
    service_name_ml: {
      type: DataTypes.STRING
    },
    service_name_te: {
      type: DataTypes.STRING
    },
    service_name_gu: {
      type: DataTypes.STRING
    },
    service_name_kn: {
      type: DataTypes.STRING
    },
    service_name_mr: {
      type: DataTypes.STRING
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    sub_category_id: {
      type: DataTypes.INTEGER
    },
    quantity_type: {
      type: DataTypes.INTEGER
    },
    service_image_name: {
      type: DataTypes.STRING
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    wages_type: {
      type: DataTypes.INTEGER
    },
    status_type: {
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
    tableName: 'table_calendar_services'
  });

  calendar_services.associate = function (models) {
    calendar_services.belongsTo(models.users, { foreignKey: 'updated_by' });
    calendar_services.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    calendar_services.belongsTo(models.quantities, { foreignKey: 'quantity_type', as: 'quantity' });
    calendar_services.belongsTo(models.categories, { foreignKey: 'category_id', as: 'category' });
    calendar_services.belongsTo(models.categories, { foreignKey: 'main_category_id', as: 'main_category' });
    calendar_services.belongsTo(models.categories, { foreignKey: 'sub_category_id', as: 'sub_category' });
  };
  return calendar_services;
};