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

    const full = await recipeServices.getRecipeByIdForUser(recipe.id, req.user.userId);
    res.status(201).json({ recipe: full });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function list(req, res) {
  try {
    const { q, searchIn, cookbookId, tags, ingredients, maxPrepTime, maxCookTime, favorite } = req.query;
    const filters = {
      q: q?.trim() || undefined,
      searchIn: searchIn ? searchIn.split(',').map((f) => f.trim()) : undefined,
      cookbookId: cookbookId || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      ingredients: ingredients ? ingredients.split(',').map((i) => i.trim()).filter(Boolean) : undefined,
      maxPrepTime: maxPrepTime ? Number(maxPrepTime) : undefined,
      maxCookTime: maxCookTime ? Number(maxCookTime) : undefined,
      favorite: favorite === 'true',
    };
    const recipes = await recipeServices.searchRecipesForUser(req.user.userId, filters);
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getById(req, res) {
  try {
    const recipe = await recipeServices.getRecipeByIdForUser(req.params.id, req.user.userId);
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

    const updated = await recipeServices.updateRecipe(req.params.id, data, {
      ingredients: req.body.ingredients,
      steps: req.body.steps,
      tags: req.body.tags,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Recette non trouvée.' });
    }
    const recipe = await recipeServices.getRecipeByIdForUser(updated.id, req.user.userId);
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

async function addFavorite(req, res) {
  try {
    await recipeServices.addFavorite(req.user.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function removeFavorite(req, res) {
  try {
    await recipeServices.removeFavorite(req.user.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier image reçu.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const recipe = await recipeServices.updateRecipeImage(req.params.id, imageUrl);
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée.' });
    }
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { create, list, getById, update, remove, addFavorite, removeFavorite, uploadImage };
