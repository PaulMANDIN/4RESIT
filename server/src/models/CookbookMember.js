const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CookbookMember = sequelize.define('CookbookMember', {
  cookbookId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('CREATOR', 'EDITOR', 'READER', 'COMMENTER'),
    defaultValue: 'READER',
  },
}, { updatedAt: false });

module.exports = CookbookMember;
