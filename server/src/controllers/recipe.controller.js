const recipeServices = require('../services/recipe.services');

async function create(req, res) {
  try {
    const {
      title, description, prepTime, cookTime, portions, source, imageUrl,
      cookbookId, ingredients, steps, tags,
    } = req.body;

    const recipe = await recipeServices.createRecipe({
      title, description, prepTime, cookTime, portions, source, imageUrl,
      cookbookId, createdById: req.user.userId, ingredients, steps, tags,
    });

    const full = await recipeServices.getRecipeById(recipe.id);
    res.status(201).json({ recipe: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function list(req, res) {
  try {
    const recipes = await recipeServices.getRecipesForUser(req.user.userId);
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getById(req, res) {
  try {
    const recipe = await recipeServices.getRecipeById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée.' });
    }
    res.json({ recipe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    const data = {};
    const fields = ['title', 'description', 'prepTime', 'cookTime', 'portions', 'source', 'imageUrl'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });
    if (req.body.cookbookId !== undefined) {
      data.cookbookId = req.body.cookbookId || null;
    }

    const recipe = await recipeServices.updateRecipe(req.params.id, data, {
      ingredients: req.body.ingredients,
      steps: req.body.steps,
      tags: req.body.tags,
    });
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée.' });
    }
    res.json({ recipe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function remove(req, res) {
  try {
    const count = await recipeServices.deleteRecipe(req.params.id);
    if (count === 0) {
      return res.status(404).json({ message: 'Recette non trouvée.' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { create, list, getById, update, remove };
