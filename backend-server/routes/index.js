const express = require('express');
const router = express.Router();

// 引入各模块路由
const calculateRoutes = require('./calculate');
const crawlerRoutes = require('./crawler');
const analysisRoutes = require('./analysis');

// 注册各模块路由
router.use('/calculate', calculateRoutes);
router.use('/crawler', crawlerRoutes);
router.use('/analysis', analysisRoutes);

module.exports = router; 