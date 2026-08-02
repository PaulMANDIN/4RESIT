const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  recipeId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
}, { updatedAt: false });

module.exports = Favorite;
