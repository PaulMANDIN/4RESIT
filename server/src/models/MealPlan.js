const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MealPlan = sequelize.define('MealPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  mealType: {
    type: DataTypes.ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'),
    allowNull: false,
  },
}, { timestamps: false });

module.exports = MealPlan;
