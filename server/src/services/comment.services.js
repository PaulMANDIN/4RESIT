const { Comment, User } = require('../models');

const commentServices = {
  createComment({ recipeId, userId, content }) {
    return Comment.create({ recipeId, userId, content });
  },

  getCommentsForRecipe(recipeId) {
    return Comment.findAll({
      where: { recipeId },
      include: [{ model: User, attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'ASC']],
    });
  },

  getCommentById(id) {
    return Comment.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name', 'avatar'] }],
    });
  },

  deleteComment(id) {
    return Comment.destroy({ where: { id } });
  },
};

module.exports = commentServices;
