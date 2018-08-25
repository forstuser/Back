'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const sellers = sequelize.define('sellers', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    seller_name: {
      type: DataTypes.STRING
    },
    owner_name: {
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
    is_service: {
      type: DataTypes.BOOLEAN
    },
    is_onboarded: {
      type: DataTypes.BOOLEAN
    },
    address: {
      type: DataTypes.STRING
    },
    city_id: {
      type: DataTypes.INTEGER
    },
    state_id: {
      type: DataTypes.INTEGER
    },
    locality_id: {
      type: DataTypes.INTEGER
    },
    seller_details: { type: DataTypes.JSONB },
    customer_ids: { type: DataTypes.JSONB },
    rush_hours: { type: DataTypes.BOOLEAN },
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
    updated_by: {
      type: DataTypes.INTEGER
    },
    created_by: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    seller_type_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    socket_id: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'table_sellers'
  });

  sellers.associate = models => {
    sellers.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sellers.belongsTo(models.seller_users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sellers.belongsTo(models.seller_types, {
      foreignKey: 'seller_type_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sellers.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sellers.hasMany(models.sellerReviews, {
      foreignKey: 'seller_id',
      as: 'sellerReviews',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sellers.belongsTo(models.states, { foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade' });
    sellers.belongsTo(models.cities, { foreignKey: 'city_id', onDelete: 'cascade', onUpdate: 'cascade' });
    sellers.belongsTo(models.locality, { foreignKey: 'locality_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return sellers;
};