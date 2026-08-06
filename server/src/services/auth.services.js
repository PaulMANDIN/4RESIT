const { User, UserPreference, OAuthAccount } = require('../models');

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

  async getUserByOAuthAccount(provider, providerId) {
    const account = await OAuthAccount.findOne({ where: { provider, providerId }, include: User });
    return account?.User || null;
  },

  linkOAuthAccount({ userId, provider, providerId }) {
    return OAuthAccount.create({ userId, provider, providerId });
  },
};

module.exports = authServices;
