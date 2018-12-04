'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const jobs = sequelize.define('jobs', {
    job_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    uploaded_by: {
      type: DataTypes.INTEGER
    },
    user_status: {
      type: DataTypes.INTEGER
    },
    admin_status: {
      type: DataTypes.INTEGER
    },
    assigned_to_ce: {
      type: DataTypes.INTEGER
    },
    ce_status: {
      type: DataTypes.INTEGER
    },
    assigned_to_qe: {
      type: DataTypes.INTEGER
    },
    qe_status: {
      type: DataTypes.INTEGER
    },
    comments: {
      type: DataTypes.STRING(2000)
    },
    ce_task_date: {
      type: DataTypes.DATE
    },
    qe_task_date: {
      type: DataTypes.DATE
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'jobs'
  });

  jobs.associate = models => {
    jobs.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    jobs.belongsTo(models.users, { foreignKey: 'uploaded_by', as: 'user' });
    jobs.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });
    jobs.belongsTo(models.statuses, { foreignKey: 'user_status', targetKey: 'status_type' });
    jobs.belongsTo(models.users, { foreignKey: 'assigned_to_ce', as: 'ce' });
    jobs.belongsTo(models.statuses, { foreignKey: 'ce_status', targetKey: 'status_type' });
    jobs.belongsTo(models.users, { foreignKey: 'assigned_to_qe', as: 'qe' });
    jobs.belongsTo(models.statuses, { foreignKey: 'qe_status', targetKey: 'status_type' });
    jobs.belongsTo(models.statuses, { foreignKey: 'admin_status', targetKey: 'status_type' });
    jobs.hasMany(models.jobCopies, { onDelete: 'cascade', hooks: true, as: 'copies' });
    jobs.hasMany(models.products, { onDelete: 'cascade', hooks: true, foreignKey: 'job_id' });
  };
  return jobs;
};