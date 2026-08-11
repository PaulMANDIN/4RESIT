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

  async updateUser(id, data) {
    await User.update(data, { where: { id } });
    return User.findByPk(id);
  },

  async getPreferences(userId) {
    const [preferences] = await UserPreference.findOrCreate({ where: { userId } });
    return preferences;
  },

  async updatePreferences(userId, data) {
    await UserPreference.findOrCreate({ where: { userId } });
    await UserPreference.update(data, { where: { userId } });
    return UserPreference.findByPk(userId);
  },
};

module.exports = authServices;
