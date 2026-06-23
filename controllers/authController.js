const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user");
const { sendSuccess, sendError } = require("../lib/response");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, "Email and password are required.");
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const match = await foundUser.comparePassword(password);
    if (!match) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const accessToken = jwt.sign(
      { userId: foundUser.userId, email: foundUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY },
    );

    return sendSuccess(res, 200, "Login successful", { token: accessToken });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  }
};

const register = async (req, res) => {
  try {
    const { email, password, businessName } = req.body;
    if (!email || !password || !businessName) {
      return sendError(
        res,
        400,
        "Email, password and businessName are required.",
      );
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, "Invalid email format.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, "Email already registered.");
    }

    const user = new User({ email, password, businessName });
    await user.save();

    const accessToken = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY },
    );

    return sendSuccess(res, 201, "Registration successful", {
      userId: user.userId,
      email: user.email,
      businessName: user.businessName,
      token: accessToken,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  }
};

module.exports = { login, register };
