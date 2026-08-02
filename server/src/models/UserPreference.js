const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPreference = sequelize.define('UserPreference', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  diet: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  allergies: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  cuisineTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  defaultPortions: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
  },
}, { timestamps: false });

module.exports = UserPreference;
