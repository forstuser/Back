'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const offerProducts = sequelize.define('offerProducts', {
    title: {
      type: DataTypes.STRING(34554)
    },
    promo_code: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING(34554)
    },
    provider_id: {
      type: DataTypes.STRING
    },
    adv_campaign_name: {
      type: DataTypes.STRING
    },
    short_title: {
      type: DataTypes.STRING
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    promo_link: {
      type: DataTypes.STRING
    },
    goto_link: {
      type: DataTypes.STRING
    },
    date_start: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    date_end: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
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
    offer_id: {
      type: DataTypes.STRING
    },
    logo: {
      type: DataTypes.STRING
    },
    discount: {
      type: DataTypes.STRING
    },
    cashback: {
      type: DataTypes.STRING
    },
    other: {
      type: DataTypes.STRING
    },
    click_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_offer_products'
  });

  offerProducts.associate = models => {
    offerProducts.belongsTo(models.offerCategories, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    offerProducts.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offerProducts.belongsTo(models.users, {
      foreignKey: 'created_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offerProducts.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return offerProducts;
};