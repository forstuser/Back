/*jshint esversion: 6 */
'use strict';

export default (sequelize, DataTypes) => {
  const recentSearches = sequelize.define('recentSearches', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'search_id',
    },
    searchValue: {
      type: DataTypes.STRING,
      field: 'search_value',
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    searchFound: {
      type: DataTypes.STRING,
      field: 'search_found',
    },
    resultCount: {
      type: DataTypes.INTEGER,
      field: 'result_count',
    },
    searchDate: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
      field: 'search_date',
    },
    created_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
  }, {
    freezeTableName: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_recent_searches',
  });

  recentSearches.associate = (models) => {
    recentSearches.belongsTo(models.users,
        {foreignKey: 'user_id'});
  };
  return recentSearches;
};
