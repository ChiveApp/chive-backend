import bcrypt from "bcryptjs";
import { saltRounds } from "../configuration/config";

import User from "../models/user";
import { createToken } from "../middleware/auth";

import { corsCookie } from "../configuration/config";

/**
 * TODO: consider a delete user mutation/resolver
 * TODO: move the loggedIn Query to links and then return "more user"
 */

export const typeDefs = `
  type User {
    _id: ID!
    email: String!
    name: String!
    profilePicture: String
    favorites: [ID!]!
    groceryList: [ID!]!
  }

  extend type Query {
    loggedIn: User
  }

  extend type Mutation {
    createUser(
      email: String!
      password: String!
      name: String!
    ): User
    
    login(
      email: String!,
      password: String!
    ): User

    addFavorite(
      recipeId: ID!
    ): User
    
    removeFavorite(
      recipeId: ID!
    ): User

    addGrocery(
      recipeId: ID!
    ): User
    
    removeGrocery(
      recipeId: ID!
    ): User
  }
`;

export const resolvers = {
  Query: {
    loggedIn: (obj, vars, { req, res }, info) => {
      if (req.user) {
        const user = req.user;
        user.password = null;
        return user;
      } else {
        return null;
      }
    }
  },
  Mutation: {
    login: async (obj, { email, password }, { req, res }, info) => {
      var user = await User.findOne({ email: email });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const authenticated = await bcrypt.compare(password, user.password);

      if (!authenticated) {
        throw new Error("Invalid credentials");
      }

      const { token, user } = await createToken(user);

      res.cookie("token", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        httpOnly: true,
        domain: corsCookie
      });

      user.password = null;

      console.info("User successfully logged in: ", user.email);

      return user;
    },

    createUser: async (obj, { email, password, name }, { req, res }, info) => {
      var tempUser = await User.findOne({ email: email });

      if (tempUser) {
        throw new Error("Email already in use");
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = new User({
        email: email,
        password: hashedPassword,
        name: name
      });

      await user.save();

      const { token } = await createToken(user);

      res.cookie("token", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        httpOnly: true,
        domain: corsCookie
      });

      user.password = null;

      console.info("User successfully created: ", user.email);

      return user;
    },

    addFavorite: async (obj, { recipeId }, { req, res }, info) => {
      var user = req.user;
      if (!user) {
        throw new Error("Not signed in :(");
      }

      user.favorites.push(recipeId);

      await user.save();

      return user;
    },

    removeFavorite: async (obj, { recipeId }, { req, res }, info) => {
      var user = req.user;

      if (!user) {
        throw new Error("Not signed in");
      }

      user.favorites = user.favorites.filter((value, index, arr) => {
        return value.toString() !== recipeId;
      });

      await user.save();

      return user;
    },

    addGrocery: async (obj, { recipeId }, { req, res }, info) => {
      var user = req.user;
      if (!user) {
        throw new Error("Not signed in");
      }

      user.groceryList.push(recipeId);

      await user.save();

      return user;
    },
    removeGrocery: async (obj, { recipeId }, { req, res }, info) => {
      var user = req.user;
      if (!user) {
        throw new Error("Not signed in");
      }

      user.groceryList = user.groceryList.filter((value, index, arr) => {
        return value.toString() !== recipeId;
      });

      await user.save();

      return user;
    }
  }
};
