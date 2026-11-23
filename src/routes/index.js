const express = require('express');
const healthRoutes = require('./health.route');
const authRoutes = require('./auth.route');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
