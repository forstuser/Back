'use strict';
export default (Sequelize, DataTypes) => {
  const table_coupons = sequelize.define('table_coupons', {
        coupon_code: {
          type: DataTypes.String,
        },
        type: {
          type: DataTypes.String,
        },
        value: {
          type: DataTypes.INTEGER,
        },
        expiry: {
          type: DataTypes.Date,

        },
        is_exclusive: {
          type: DataTypes.boolean,
        },
        status_type: {
          type: DataTypes.INTEGER,
          _defaultValues: 1,

        },
        created_at: {
          type: DataTypes.Date,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.Date,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        table_name: 'table_coupons',

      });
  table_coupons.associate = (models) => {
    table_coupons.belongsTo(table_coupons, {
      foreignKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade',

    });

  };
}