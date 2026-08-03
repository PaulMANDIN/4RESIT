const { User, UserPreference } = require('../models');

const authServices = {
  createUser({ name, email, passwordHash, avatar = null }) {
    return User.create({ name, email, passwordHash, avatar });
  },

  createDefaultPreferences(userId) {
    return UserPreference.create({ userId });
  },

  getUserByEmail(email) {
    return User.findOne({ where: { email } });
  },

  getUserById(id) {
    return User.findByPk(id);
  },
};

module.exports = authServices;
