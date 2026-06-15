const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController')
const limiter = require('../middleware/rateLimitter')

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

if (process.env.NODE_ENV !== 'test') {
    router.post('/login', limiter, asyncHandler(authController.login));
    router.post('/register', limiter, asyncHandler(authController.register));
} else {
    router.post('/login', asyncHandler(authController.login));
    router.post('/register', asyncHandler(authController.register));
}

module.exports = router