const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController')
const limiter = require('../middleware/rateLimitter')

router.post('/login', limiter, authController.Login)
router.post('/register', limiter, authController.Register)

module.exports = router