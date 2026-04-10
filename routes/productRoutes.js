const express    = require('express');
const router     = express.Router();
const { upload } = require('../config/cloudinary'); // multer + Cloudinary storage

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

const verifyToken = require('../middlewares/auth');

// ── Public — không cần đăng nhập ────────────────────
router.get('/',    getProducts);
router.get('/:id', getProductById);

// ── Cần đăng nhập ───────────────────────────────────
// upload.single('image') — nhận field tên "image" từ form-data
router.post('/',    verifyToken, upload.single('image'), createProduct);
router.put('/:id',  verifyToken, upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;