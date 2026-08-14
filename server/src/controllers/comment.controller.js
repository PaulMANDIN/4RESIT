const commentServices = require('../services/comment.services');

async function list(req, res) {
  try {
    const comments = await commentServices.getCommentsForRecipe(req.params.id);
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function create(req, res) {
  try {
    const comment = await commentServices.createComment({
      recipeId: req.params.id,
      userId: req.user.userId,
      content: req.body.content,
    });
    const full = await commentServices.getCommentById(comment.id);
    res.status(201).json({ comment: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    const comment = await commentServices.getCommentById(req.params.commentId);
    if (!comment || comment.recipeId !== req.params.id) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }

    const isAuthor = comment.userId === req.user.userId;
    const isCreator = req.cookbookMembership.role === 'CREATOR';
    if (!isAuthor && !isCreator) {
      return res.status(403).json({ message: "Seul l'auteur du commentaire ou le créateur du cookbook peut le supprimer." });
    }

    await commentServices.deleteComment(comment.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { list, create, remove };
