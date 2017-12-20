'use strict';

export default (sequelize, DataTypes) => {
  const jobCopies = sequelize.define('jobCopies', {
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        file_name: {
          type: DataTypes.STRING,
        },
        file_type: {
          type: DataTypes.STRING,
        },
        comments: {
          type: DataTypes.STRING(2000),
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
        paranoid: true,
        underscored: true,
        tableName: 'job_copies',
      });

  jobCopies.associate = (models) => {
    jobCopies.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    jobCopies.belongsTo(models.jobs);
    jobCopies.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return jobCopies;
};
