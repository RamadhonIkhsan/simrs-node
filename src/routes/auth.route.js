const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/verify', authMiddleware, (req, res) => authController.verify(req, res));

module.exports = router;
