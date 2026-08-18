const { Cookbook, CookbookMember, User } = require('../models');
const sequelize = require('../config/database');

const cookbookServices = {
  createCookbook({ name, description, createdById }) {
    return Cookbook.create({ name, description, createdById });
  },

  addMember(cookbookId, userId, role) {
    return CookbookMember.create({ cookbookId, userId, role });
  },

  getMembership(cookbookId, userId) {
    return CookbookMember.findOne({ where: { cookbookId, userId } });
  },

  async getCookbooksForUser(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Cookbook, as: 'cookbooks', through: { attributes: ['role'] } }],
    });
    return user?.cookbooks || [];
  },

  getCookbookById(id) {
    return Cookbook.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: ['role'] },
        },
      ],
    });
  },

  async updateCookbook(id, data) {
    const [count] = await Cookbook.update(data, { where: { id } });
    if (count === 0) return null;
    return Cookbook.findByPk(id);
  },

  deleteCookbook(id) {
    return Cookbook.destroy({ where: { id } });
  },

  async updateMemberRole(cookbookId, userId, role) {
    const [count] = await CookbookMember.update({ role }, { where: { cookbookId, userId } });
    if (count === 0) return null;
    return CookbookMember.findOne({ where: { cookbookId, userId } });
  },

  removeMember(cookbookId, userId) {
    return CookbookMember.destroy({ where: { cookbookId, userId } });
  },

  // Verrouille les membres CREATOR du cookbook (SELECT ... FOR UPDATE) pour empêcher
  // que deux démotions/suppressions concurrentes des deux derniers CREATOR passent
  // toutes les deux le contrôle "il doit rester au moins un créateur".
  async updateMemberRoleGuarded(cookbookId, userId, role) {
    return sequelize.transaction(async (t) => {
      const target = await CookbookMember.findOne({ where: { cookbookId, userId }, transaction: t });
      if (!target) return { error: 'NOT_FOUND' };

      if (target.role === 'CREATOR' && role !== 'CREATOR') {
        const creators = await CookbookMember.findAll({
          where: { cookbookId, role: 'CREATOR' },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (creators.length <= 1) return { error: 'LAST_CREATOR' };
      }

      await CookbookMember.update({ role }, { where: { cookbookId, userId }, transaction: t });
      const member = await CookbookMember.findOne({ where: { cookbookId, userId }, transaction: t });
      return { member };
    });
  },

  async removeMemberGuarded(cookbookId, userId) {
    return sequelize.transaction(async (t) => {
      const target = await CookbookMember.findOne({ where: { cookbookId, userId }, transaction: t });
      if (!target) return { error: 'NOT_FOUND' };

      if (target.role === 'CREATOR') {
        const creators = await CookbookMember.findAll({
          where: { cookbookId, role: 'CREATOR' },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (creators.length <= 1) return { error: 'LAST_CREATOR' };
      }

      await CookbookMember.destroy({ where: { cookbookId, userId }, transaction: t });
      return { removed: true };
    });
  },

  findUserByEmail(email) {
    return User.findOne({ where: { email } });
  },
};

module.exports = cookbookServices;
