'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const offerProductsCashback = sequelize.define('offerProductsCashback', {
    title: {
      type: DataTypes.STRING(34554)
    },
    promo_code: {
      type: DataTypes.STRING(2550)
    },
    description: {
      type: DataTypes.STRING(34554)
    },
    provider_id: {
      type: DataTypes.INTEGER
    },
    adv_campaign_name: {
      type: DataTypes.STRING(2550)
    },
    short_title: {
      type: DataTypes.STRING(2550)
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    promo_link: {
      type: DataTypes.STRING(2550)
    },
    trending: {
      type: DataTypes.BOOLEAN
    },
    goto_link: {
      type: DataTypes.STRING(2550)
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
      type: DataTypes.INTEGER
    },
    logo: {
      type: DataTypes.STRING(2550)
    },
    discount: {
      type: DataTypes.FLOAT
    },
    cashback: {
      type: DataTypes.FLOAT
    },
    other: {
      type: DataTypes.STRING(2550)
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
    tableName: 'table_offer_products_cashback'
  });

  offerProductsCashback.associate = models => {
    offerProductsCashback.belongsTo(models.offerCategories, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    offerProductsCashback.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offerProductsCashback.belongsTo(models.users, {
      foreignKey: 'created_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    offerProductsCashback.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return offerProductsCashback;
};