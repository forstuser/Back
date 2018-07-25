'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const offlineSellers = sequelize.define('offlineSellers', {
    sid: {
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
    location_id: {
      type: DataTypes.INTEGER
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
    documents: {
      type: DataTypes.JSONB
    },
    seller_type_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'offline_sellers'
  });

  offlineSellers.associate = models => {
    offlineSellers.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offlineSellers.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offlineSellers.belongsTo(models.seller_types, {
      foreignKey: 'seller_type_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offlineSellers.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offlineSellers.hasMany(models.sellerReviews, {
      foreignKey: 'seller_id',
      as: 'sellerReviews',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offlineSellers.belongsTo(models.states, { foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade' });
    offlineSellers.belongsTo(models.cities, { foreignKey: 'city_id', onDelete: 'cascade', onUpdate: 'cascade' });
    offlineSellers.belongsTo(models.locations, { foreignKey: 'location_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return offlineSellers;
};