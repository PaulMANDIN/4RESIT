const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Step = sequelize.define('Step', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, { timestamps: false });

module.exports = Step;
