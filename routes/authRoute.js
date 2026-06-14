const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController')
const limiter = require('../middleware/rateLimitter')

router.post('/login', limiter, authController.login)
router.post('/register', limiter, authController.register)

module.exports = router