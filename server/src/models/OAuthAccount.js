const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OAuthAccount = sequelize.define('OAuthAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  provider: {
    type: DataTypes.ENUM('google', 'github', 'microsoft'),
    allowNull: false,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  indexes: [{ unique: true, fields: ['provider', 'providerId'] }],
  updatedAt: false,
});

module.exports = OAuthAccount;
