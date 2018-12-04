'use strict';

export default (sequelize, DataTypes) => {
  const reject_reasons = sequelize.define('reject_reasons', {
        title: {
          type: DataTypes.STRING,
        },
        description: {
          type: DataTypes.STRING,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        }, query_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_reject_reasons',
      });

  reject_reasons.associate = (models) => {
    reject_reasons.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          as: 'updater',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    reject_reasons.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return reject_reasons;
};
