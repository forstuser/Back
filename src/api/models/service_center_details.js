'use strict';

export default (sequelize, DataTypes) => {
  const centerDetails = sequelize.define('centerDetails', {
        center_id: {
          type: DataTypes.INTEGER
        },
        category_id: {
          type: DataTypes.INTEGER
        },
        detail_type: {
          type: DataTypes.INTEGER
        },
        value: {
          type: DataTypes.STRING
    },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()')
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
        tableName: 'service_center_details',
      });

  centerDetails.associate = (models) => {
    centerDetails.belongsTo(models.users,
        {foreignKey: 'updated_by'});

    centerDetails.belongsTo(models.serviceCenters,
        {foreignKey: 'center_id', targetKey: 'center_id'});

    centerDetails.belongsTo(models.categories,
        {foreignKey: 'category_id', targetKey:'category_id'});

    centerDetails.belongsTo(models.detailTypes,
        {foreignKey: 'detail_type', targetKey: 'type'});

    centerDetails.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return centerDetails;
};