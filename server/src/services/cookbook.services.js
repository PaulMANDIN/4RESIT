const { Cookbook, CookbookMember, User } = require('../models');

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

  countCreators(cookbookId) {
    return CookbookMember.count({ where: { cookbookId, role: 'CREATOR' } });
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

  findUserByEmail(email) {
    return User.findOne({ where: { email } });
  },
};

module.exports = cookbookServices;
