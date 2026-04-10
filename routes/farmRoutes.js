const express = require('express');
const router = express.Router();
const { getFarms, getFarmById, createFarm, updateFarm, deleteFarm } = require('../controllers/farmController');
const verifyToken = require('../middlewares/auth');

router.get('/',     getFarms);
router.get('/:id',  getFarmById);
router.post('/',    verifyToken, createFarm);
router.put('/:id',  verifyToken, updateFarm);
router.delete('/:id', verifyToken, deleteFarm);

module.exports = router;