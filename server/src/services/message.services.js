const { Message, User } = require('../models');

const messageServices = {
  createMessage({ cookbookId, userId, content }) {
    return Message.create({ cookbookId, userId, content });
  },

  getMessagesForCookbook(cookbookId) {
    return Message.findAll({
      where: { cookbookId },
      include: [{ model: User, attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'ASC']],
    });
  },

  getMessageById(id) {
    return Message.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'avatar'] }],
    });
  },
};

module.exports = messageServices;
