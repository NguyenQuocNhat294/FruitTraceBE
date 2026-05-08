const express   = require('express');
const router    = express.Router();
const { getDashboard, getRevenue, getActivities, getTopFarms } = require('../controllers/adminController');
const verifyToken = require('../middlewares/auth');
const roleCheck   = require('../middlewares/roleCheck');
const Farm        = require('../models/Farm');
const Batch       = require('../models/Batch');
const Product     = require('../models/Product');
const User        = require('../models/User');

// ── Tất cả route admin đều cần auth + role admin ──────────────────────────────
router.use(verifyToken, roleCheck('admin'));

// ── Existing routes ───────────────────────────────────────────────────────────
router.get('/dashboard',  getDashboard);
router.get('/revenue',    getRevenue);
router.get('/activities', getActivities);
router.get('/top-farms',  getTopFarms);

// ── Stats — dùng cho LandingPage (public numbers) ────────────────────────────
router.get('/stats', async (req, res, next) => {
    try {
        const [farms, batches, products, users] = await Promise.all([
            Farm.countDocuments(),
            Batch.countDocuments(),
            Product.countDocuments(),
            User.countDocuments({ status: 'active' }),
        ]);
        res.json({ farms, batches, products, users });
    } catch (err) {
        next(err);
    }
});

module.exports = router;