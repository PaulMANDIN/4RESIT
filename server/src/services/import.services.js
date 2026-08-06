const { formats } = require('./recipeFormats');
const recipeServices = require('./recipe.services');
const cookbookServices = require('./cookbook.services');

function recipePayload(portable, { cookbookId, createdById }) {
  return {
    title: portable.title,
    description: portable.description,
    prepTime: portable.prepTime,
    cookTime: portable.cookTime,
    portions: portable.portions,
    source: portable.source,
    imageUrl: portable.imageUrl,
    cookbookId,
    createdById,
    ingredients: portable.ingredients,
    steps: portable.steps,
    tags: portable.tags,
  };
}

// Chaque recette/cookbook est créé dans sa propre transaction (via recipeServices/cookbookServices) plutôt
// que dans une seule transaction englobante : la base ne fonctionne pas en CLS ici, donc les imbriquer
// demanderait de faire circuler explicitement le contexte de transaction dans tout recipeServices pour un
// gain marginal — le fichier est de toute façon entièrement validé/parsé (recipeFormats) avant la première
// écriture, donc les seuls échecs possibles à ce stade sont des erreurs DB exceptionnelles.
async function importData(userId, format, buffer) {
  const data = formats[format].parse(buffer);

  let recipesCreated = 0;
  let cookbooksCreated = 0;

  for (const portable of data.personalRecipes) {
    await recipeServices.createRecipe(recipePayload(portable, { cookbookId: null, createdById: userId }));
    recipesCreated += 1;
  }

  for (const cb of data.cookbooks) {
    const cookbook = await cookbookServices.createCookbook({
      name: cb.name,
      description: cb.description,
      createdById: userId,
    });
    await cookbookServices.addMember(cookbook.id, userId, 'CREATOR');
    cookbooksCreated += 1;

    for (const portable of cb.recipes) {
      await recipeServices.createRecipe(recipePayload(portable, { cookbookId: cookbook.id, createdById: userId }));
      recipesCreated += 1;
    }
  }

  return { cookbooksCreated, recipesCreated };
}

module.exports = { importData };
