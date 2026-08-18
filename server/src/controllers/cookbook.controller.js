const cookbookServices = require('../services/cookbook.services');
const messageServices = require('../services/message.services');

async function create(req, res) {
  try {
    const { name, description } = req.body;
    const cookbook = await cookbookServices.createCookbook({
      name,
      description,
      createdById: req.user.userId,
    });
    await cookbookServices.addMember(cookbook.id, req.user.userId, 'CREATOR');

    res.status(201).json({ cookbook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function list(req, res) {
  try {
    const cookbooks = await cookbookServices.getCookbooksForUser(req.user.userId);
    res.json({ cookbooks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getById(req, res) {
  try {
    const cookbook = await cookbookServices.getCookbookById(req.params.id);
    if (!cookbook) {
      return res.status(404).json({ message: 'Cookbook non trouvé.' });
    }
    res.json({ cookbook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;

    const cookbook = await cookbookServices.updateCookbook(req.params.id, data);
    if (!cookbook) {
      return res.status(404).json({ message: 'Cookbook non trouvé.' });
    }
    res.json({ cookbook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    const count = await cookbookServices.deleteCookbook(req.params.id);
    if (count === 0) {
      return res.status(404).json({ message: 'Cookbook non trouvé.' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function addMember(req, res) {
  try {
    const { email, role } = req.body;

    const user = await cookbookServices.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur avec cet email.' });
    }

    const existing = await cookbookServices.getMembership(req.params.id, user.id);
    if (existing) {
      return res.status(409).json({ message: 'Cet utilisateur est déjà membre de ce cookbook.' });
    }

    const member = await cookbookServices.addMember(req.params.id, user.id, role || 'READER');
    res.status(201).json({ member });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateMemberRole(req, res) {
  try {
    const { role } = req.body;
    const { id: cookbookId, userId: targetUserId } = req.params;

    const { error, member } = await cookbookServices.updateMemberRoleGuarded(cookbookId, targetUserId, role);
    if (error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Membre non trouvé.' });
    }
    if (error === 'LAST_CREATOR') {
      return res.status(400).json({ message: 'Il doit rester au moins un créateur pour ce cookbook.' });
    }

    res.json({ member });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function removeMember(req, res) {
  try {
    const { id: cookbookId, userId: targetUserId } = req.params;

    const { error } = await cookbookServices.removeMemberGuarded(cookbookId, targetUserId);
    if (error === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Membre non trouvé.' });
    }
    if (error === 'LAST_CREATOR') {
      return res.status(400).json({ message: 'Il doit rester au moins un créateur pour ce cookbook.' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listMessages(req, res) {
  try {
    const messages = await messageServices.getMessagesForCookbook(req.params.id);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { create, list, getById, update, remove, addMember, updateMemberRole, removeMember, listMessages };
