'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _categories = require('./categories');

var _categories2 = _interopRequireDefault(_categories);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (sequelize, DataTypes) => {
  const insuranceBrands = sequelize.define('insuranceBrands', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING
    },
    gstin: {
      type: DataTypes.STRING
    },
    pan_no: {
      type: DataTypes.STRING
    },
    reg_no: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    pincode: {
      type: DataTypes.STRING
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: { min: -90, max: 90 }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: { min: -180, max: 180 }
    },
    url: {
      type: DataTypes.STRING
    },
    contact_no: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    callback_options: {
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
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.INTEGER
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'insurance_brands'
  });

  insuranceBrands.associate = models => {
    insuranceBrands.belongsTo(models.users, { foreignKey: 'updated_by' });
    insuranceBrands.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    insuranceBrands.belongsTo(models.categories, {
      foreignKey: 'main_category_id',
      targetKey: 'category_id',
      as: 'main_category'
    });
    insuranceBrands.hasMany(models.insurances, { foreignKey: 'provider_id' });
    insuranceBrands.belongsToMany(models.categories, {
      foreignKey: 'insurance_brand_id',
      otherKey: 'category_id',
      through: 'insurance_brand_categories',
      as: 'categories'
    });
  };
  return insuranceBrands;
};