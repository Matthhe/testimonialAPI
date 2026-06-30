const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const limiter = require("../middleware/rateLimitter");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/schemas");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

if (process.env.NODE_ENV !== "test") {
  router.post(
    "/login",
    limiter,
    validate(loginSchema),
    asyncHandler(authController.login),
  );
  router.post(
    "/register",
    limiter,
    validate(registerSchema),
    asyncHandler(authController.register),
  );
} else {
  router.post(
    "/login",
    validate(loginSchema),
    asyncHandler(authController.login),
  );
  router.post(
    "/register",
    validate(registerSchema),
    asyncHandler(authController.register),
  );
}

module.exports = router;
