'use strict';

export default (sequelize, DataTypes) => {
  const cashback_jobs = sequelize.define('cashback_jobs', {
        job_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        user_status: {
          type: DataTypes.INTEGER,
          defaultValue: 4,
        },
        user_id: {
          type: DataTypes.INTEGER,
        },
        ce_id: {
          type: DataTypes.INTEGER,
        },
        ce_status: {
          type: DataTypes.INTEGER,
        },
        admin_status: {
          type: DataTypes.INTEGER,
          defaultValue: 4,
        },
        admin_id: {
          type: DataTypes.INTEGER,
        },
        cashback_value: {
          type: DataTypes.FLOAT,
        },
        cashback_status: {
          type: DataTypes.INTEGER,
        },
        seller_status: {
          type: DataTypes.INTEGER,
          defaultValue: 13,
        },
        seller_id: {
          type: DataTypes.INTEGER,
        },
        reason_id: {
          type: DataTypes.INTEGER,
        },
        limit_rule_id: {
          type: DataTypes.INTEGER,
        },
        comments: {
          type: DataTypes.STRING(2000),
        },
        copies: {
          type: DataTypes.JSONB,
        },
        digitally_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        online_order: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        verified_seller: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        non_binbill_seller: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        online_seller: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        non_verified_seller: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        home_delivered: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
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
        tableName: 'table_cashback_jobs',
      });

  cashback_jobs.associate = (models) => {
    cashback_jobs.belongsTo(models.users,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'user_id', as: 'consumer',
        });
    cashback_jobs.belongsTo(models.sellers,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'seller_id', as: 'seller',
        });
    cashback_jobs.belongsTo(models.reject_reasons,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'reason_id', as: 'reason',
        });
    cashback_jobs.belongsTo(models.limit_rules,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'limit_rule_id', as: 'rule',
        });
    cashback_jobs.belongsTo(models.jobs,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'job_id', as: 'job',
        });
    cashback_jobs.belongsTo(models.users,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'updated_by', as: 'updater',
        });
    cashback_jobs.belongsTo(models.users,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'ce_id', as: 'ce',
        });
    cashback_jobs.belongsTo(models.statuses,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade',
          foreignKey: 'ce_status',
          targetKey: 'status_type',
        });
    cashback_jobs.belongsTo(models.users,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade', foreignKey: 'admin_id', as: 'admin',
        });
    cashback_jobs.belongsTo(models.statuses,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade',
          foreignKey: 'cashback_status',
          targetKey: 'status_type',
        });
    cashback_jobs.belongsTo(models.statuses,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade',
          foreignKey: 'seller_status',
          targetKey: 'status_type',
        });
    cashback_jobs.belongsTo(models.statuses,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade',
          foreignKey: 'admin_status',
          targetKey: 'status_type',
        });
    cashback_jobs.belongsTo(models.statuses,
        {
          onDelete: 'cascade',
          onUpdate: 'cascade',
          foreignKey: 'user_status',
          targetKey: 'status_type',
        });

    cashback_jobs.hasMany(models.expense_sku_items,
        {foreignKey: 'job_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return cashback_jobs;
};
