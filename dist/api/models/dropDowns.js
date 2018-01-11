'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var dropDowns = sequelize.define('dropDowns', {
    title: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    category_form_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
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
    tableName: 'category_form_drop_downs'
  });

  dropDowns.associate = function (models) {
    dropDowns.belongsTo(models.users, { foreignKey: 'updated_by' });

    dropDowns.belongsTo(models.categoryForms, { foreignKey: 'category_form_id' });

    dropDowns.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return dropDowns;
};