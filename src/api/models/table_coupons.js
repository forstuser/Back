'use strict';
export default (Sequelize, DataTypes) => {
  const table_coupons = Sequelize.define('table_coupons', {
        coupon_code: {
          type: DataTypes.STRING,
        },
        type: {
          type: DataTypes.STRING,
        },
        value: {
          type: DataTypes.INTEGER,
        },
        expiry: {
          type: DataTypes.DATE,
        },
        is_exclusive: {
          type: DataTypes.BOOLEAN,
        },
        status_type: {
          type: DataTypes.INTEGER,
          _defaultValues: 1,

        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('NOW()'),
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
    table_coupons.belongsTo(models.table_coupons, {
      foreignKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  };

  return table_coupons;
}