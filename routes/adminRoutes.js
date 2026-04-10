const express = require('express');
const router  = express.Router();
const { getDashboard, getRevenue, getActivities, getTopFarms } = require('../controllers/adminController');
const verifyToken = require('../middlewares/auth');

router.get('/dashboard',  verifyToken, getDashboard);
router.get('/revenue',    verifyToken, getRevenue);
router.get('/activities', verifyToken, getActivities);
router.get('/top-farms',  verifyToken, getTopFarms);

module.exports = router;