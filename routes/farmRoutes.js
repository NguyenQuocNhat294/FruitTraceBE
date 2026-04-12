const express    = require('express');
const router     = express.Router();
const { upload } = require('../config/cloudinary');

const {
    getFarms, getFarmById, createFarm, updateFarm, deleteFarm,
} = require('../controllers/farmController');

const verifyToken = require('../middlewares/auth');

// Public
router.get('/',    getFarms);
router.get('/:id', getFarmById);

// Cần đăng nhập — upload.array('images', 10) cho phép upload nhiều ảnh cùng lúc
router.post('/',    verifyToken, upload.array('images', 10), createFarm);
router.put('/:id',  verifyToken, upload.array('images', 10), updateFarm);
router.delete('/:id', verifyToken, deleteFarm);

module.exports = router;