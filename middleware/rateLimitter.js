const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    code: 429,
    status: "failure",
    message: "Too many requests, please try again later",
  },
  standardHeaders: true, //* Standart headers with limits
  legacyHeaders: false, //* off old headers
});

module.exports = limiter;
