import { tokenHash, corsCookie } from "../configuration/config";
import jwt from "jsonwebtoken";
import User from "../models/user";

export const createToken = async user => {
  var token = null;

  try {
    token = await jwt.sign(
      {
        user: {
          email: user.email,
          name: user.name
        },
        expiration: Date.now() + 1000 * 60 * 60 * 24 * 7
      },
      tokenHash,
      {
        expiresIn: "7d" // 7 days
      }
    );
  } catch (err) {
    console.error("Create token sign error: ", err);
    return {};
  }

  return {
    token: token,
    user: user
  };
};

export const refreshToken = async token => {
  try {
    await jwt.verify(token, tokenHash);
  } catch (err) {
    console.error("Refresh token verify error: ", err);
    return {};
  }

  let userEmail = null;

  try {
    var { user } = await jwt.decode(token);
    userEmail = user.email;
    if (!userEmail) throw new Error("User not found!");
  } catch (err) {
    console.error("Refresh token decode error: ", err);
    return {};
  }

  const databaseUser = await User.findOne({ email: userEmail });

  if (!databaseUser) return {};

  return await createToken(databaseUser);
};

export const auth = async (req, res, next) => {
  const token = req.cookies.token;

  console.info("User's Cookies: ", req.cookies);

  if (!token) return next();

  try {
    const { user, expiration } = jwt.verify(token, tokenHash);
    const databaseUser = await User.findOne({ email: user.email });

    if (databaseUser) {
      req.user = databaseUser;
    } else {
      req.user = null;
    }

    // if the token is within 2 days of expiring, refresh it
    if (expiration - Date.now() <= 1000 * 60 * 60 * 24 * 2) {
      const { newToken, user } = await refreshToken(token);
      if (newToken && user) {
        res.cookie("token", newToken, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
          httpOnly: true,
          domain: corsCookie
        });
      }
    }
  } catch (err) {
    console.error("Check token verify error: ", err);
    req.user = undefined;
  }

  return next();
};
