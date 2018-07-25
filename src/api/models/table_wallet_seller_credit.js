'use strict';

export default (sequelize, DataTypes) => {
  const credit_wallet = sequelize.define('credit_wallet', {
        title: {
          type: DataTypes.STRING,
        },
        description : {
          type: DataTypes.STRING,
        },
        job_id: {
          type: DataTypes.INTEGER,
        },
        seller_id: {
          type: DataTypes.INTEGER,
        },
        user_id: {
          type: DataTypes.INTEGER,
        },
        transaction_type: {
          type: DataTypes.INTEGER,
          comment: 'Credit: 1, Debit: 2',
        },
        amount: {
          type: DataTypes.FLOAT,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 16
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
        tableName: 'table_wallet_seller_credit',
      });

  credit_wallet.associate = (models) => {
    credit_wallet.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updater', onDelete: 'cascade', onUpdate: 'cascade'});
    credit_wallet.belongsTo(models.offlineSellers,
        {foreignKey: 'seller_id', as: 'seller', onDelete: 'cascade', onUpdate: 'cascade'});
    credit_wallet.belongsTo(models.cashback_jobs,
        {foreignKey: 'job_id', onDelete: 'cascade', onUpdate: 'cascade'});
    credit_wallet.belongsTo(models.users,
        {
          foreignKey: 'user_id',
          as: 'user',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    credit_wallet.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return credit_wallet;
};
