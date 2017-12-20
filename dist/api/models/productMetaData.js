'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = function(sequelize, DataTypes) {
  var metaData = sequelize.define('metaData', {
    product_id: {
      type: DataTypes.INTEGER,
    },
    form_value: {
      type: DataTypes.STRING,
    },
    category_form_id: {
      type: DataTypes.INTEGER,
    },
    updated_by: {
      type: DataTypes.INTEGER,
    },
    status_type: {
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
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'product_metadata',
  });

  metaData.associate = function(models) {
    metaData.belongsTo(models.users, {foreignKey: 'updated_by'});

    metaData.belongsTo(models.products);

    metaData.belongsTo(models.categoryForms,
        {foreignKey: 'category_form_id', as: 'categoryForm'});

    metaData.hasMany(models.dropDowns, {
      foreignKey: 'category_form_id',
      as: 'dropDown',
      targetKey: 'category_form_id',
    });

    metaData.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return metaData;
};