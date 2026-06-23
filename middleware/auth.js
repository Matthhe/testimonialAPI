const jwt = require("jsonwebtoken");
require("dotenv").config();
const { sendError } = require("../lib/response");

const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return sendError(res, 401, "Invalid token.");
      }
      req.user = decoded;
      next();
    });
  } catch (err) {
    next(err);
  }
};

module.exports = verifyJWT;
