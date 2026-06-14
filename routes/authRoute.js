const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController')
const limiter = require('../middleware/rateLimitter')

if (process.env.NODE_ENV !== 'test') {
    router.post('/login', limiter, authController.login);
    router.post('/register', limiter, authController.register);
} else {
    router.post('/login', authController.login);
    router.post('/register', authController.register);
}

module.exports = router