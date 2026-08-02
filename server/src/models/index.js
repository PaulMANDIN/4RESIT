const User = require('./User');
const OAuthAccount = require('./OAuthAccount');
const UserPreference = require('./UserPreference');
const Cookbook = require('./Cookbook');
const CookbookMember = require('./CookbookMember');
const Recipe = require('./Recipe');
const Ingredient = require('./Ingredient');
const Step = require('./Step');
const Tag = require('./Tag');
const Favorite = require('./Favorite');
const MealPlan = require('./MealPlan');
const Comment = require('./Comment');
const Message = require('./Message');

User.hasMany(OAuthAccount, { foreignKey: 'userId', onDelete: 'CASCADE' });
OAuthAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserPreference, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserPreference.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Cookbook, { foreignKey: 'createdById', onDelete: 'CASCADE' });
Cookbook.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

Cookbook.hasMany(CookbookMember, { foreignKey: 'cookbookId', onDelete: 'CASCADE' });
CookbookMember.belongsTo(Cookbook, { foreignKey: 'cookbookId' });

User.hasMany(CookbookMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
CookbookMember.belongsTo(User, { foreignKey: 'userId' });

Cookbook.belongsToMany(User, { through: CookbookMember, foreignKey: 'cookbookId', as: 'members' });
User.belongsToMany(Cookbook, { through: CookbookMember, foreignKey: 'userId', as: 'cookbooks' });

User.hasMany(Recipe, { foreignKey: 'createdById', onDelete: 'CASCADE' });
Recipe.belongsTo(User, { foreignKey: 'createdById', as: 'author' });

Cookbook.hasMany(Recipe, { foreignKey: 'cookbookId', onDelete: 'SET NULL' });
Recipe.belongsTo(Cookbook, { foreignKey: 'cookbookId' });

Recipe.hasMany(Ingredient, { foreignKey: 'recipeId', onDelete: 'CASCADE' });
Ingredient.belongsTo(Recipe, { foreignKey: 'recipeId' });

Recipe.hasMany(Step, { foreignKey: 'recipeId', onDelete: 'CASCADE' });
Step.belongsTo(Recipe, { foreignKey: 'recipeId' });

Recipe.belongsToMany(Tag, { through: 'RecipeTag', foreignKey: 'recipeId' });
Tag.belongsToMany(Recipe, { through: 'RecipeTag', foreignKey: 'tagId' });

User.belongsToMany(Recipe, { through: Favorite, foreignKey: 'userId', as: 'favorites' });
Recipe.belongsToMany(User, { through: Favorite, foreignKey: 'recipeId', as: 'favoritedBy' });

User.hasMany(MealPlan, { foreignKey: 'userId', onDelete: 'CASCADE' });
MealPlan.belongsTo(User, { foreignKey: 'userId' });

Recipe.hasMany(MealPlan, { foreignKey: 'recipeId', onDelete: 'CASCADE' });
MealPlan.belongsTo(Recipe, { foreignKey: 'recipeId' });

Recipe.hasMany(Comment, { foreignKey: 'recipeId', onDelete: 'CASCADE' });
Comment.belongsTo(Recipe, { foreignKey: 'recipeId' });

User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Cookbook.hasMany(Message, { foreignKey: 'cookbookId', onDelete: 'CASCADE' });
Message.belongsTo(Cookbook, { foreignKey: 'cookbookId' });

User.hasMany(Message, { foreignKey: 'userId', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  OAuthAccount,
  UserPreference,
  Cookbook,
  CookbookMember,
  Recipe,
  Ingredient,
  Step,
  Tag,
  Favorite,
  MealPlan,
  Comment,
  Message,
};
