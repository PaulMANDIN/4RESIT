const mealPlanServices = require('../services/mealplan.services');

async function create(req, res) {
  try {
    const { recipeId, date, mealType } = req.body;
    const entry = await mealPlanServices.addEntry({ userId: req.user.userId, recipeId, date, mealType });
    const full = await mealPlanServices.getEntryById(entry.id);
    res.status(201).json({ mealPlanEntry: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function list(req, res) {
  try {
    const { from, to } = req.query;
    const entries = await mealPlanServices.listForUser(req.user.userId, { from, to });
    res.json({ mealPlanEntries: entries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    await mealPlanServices.removeEntry(req.mealPlanEntry.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { create, list, remove };
