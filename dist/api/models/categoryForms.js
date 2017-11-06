'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var categoryForms = sequelize.define('categoryForms', {
    display_index: {
      type: DataTypes.INTEGER
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING
    },
    form_type: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING
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
    paranoid: true,
    underscored: true,
    tableName: 'category_forms'
  });

  categoryForms.associate = function (models) {
    categoryForms.belongsTo(models.users, { foreignKey: 'updated_by' });

    categoryForms.belongsTo(models.categories, { foreignKey: 'category_id' });

    categoryForms.belongsTo(models.formTypes, { foreignKey: 'form_type', targetKey: 'type' });

    categoryForms.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });

    categoryForms.hasMany(models.dropDowns, {
      foreignKey: 'category_form_id', as: 'dropDown'
    });
  };
  return categoryForms;
};