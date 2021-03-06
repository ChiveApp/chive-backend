import Recipe from "../models/recipe";

/**
 * TODO:
 * - make createRecipe take a RecipeInput instead of all the fields
 */

export const typeDefs = `
  extend type User {
    inventory: [Ingredient!]!
  }

  extend type Group {
    ingredients: [Ingredient!]!
  }

  extend type Recipe {
    ingredients: [Group!]!
  }

  extend type Query {
    recipeByIngredients(ingredients: [String]!): [Recipe!]!
  }

  extend type Mutation {
    addInventoryItem(
      ingredient: IngredientInput!
    ): User
    
    removeInventoryItem(
      ingredient: IngredientInput!
    ): User

    logout: Boolean!
  }
`;

/**
 * TODO:
 * - finish recipeByIngredients resolver
 * - finish createRecipe resolver
 */

export const resolvers = {
  Query: {
    recipeByIngredients: async (obj, { ingredients }, context, info) => {
      const ingredientsQuery = ingredients.map(ingredientName => {
        return { "ingredients.ingredients.name": RegExp(ingredientName, "i") };
      });

      const results = await Recipe.find(
        {
          $and: ingredientsQuery
        },
        null,
        { limit: 50 }
      );

      return results;
    }
  },
  Mutation: {
    addInventoryItem: async (obj, args, { req, res }, info) => {
      var user = req.user;
      if (!user) {
        throw new Error("Not signed in :(");
      }
      user.inventory.push({ args });

      await user.save();

      return user;
    },

    removeInventoryItem: async (obj, args, { req, res }, info) => {
      var user = req.user;
      if (!user) {
        throw new Error("Not signed in :(");
      }

      user.inventory = user.inventory.filter((value, index, arr) => {
        return value !== args;
      });

      await user.save();

      return user;
    },

    logout: (obj, args, { req, res }, info) => {
      res.clearCookie("token", { path: "/" });
      return true;
    }
  }
};
