const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

const verifyToken = require('../middlewares/auth'); // ← import trực tiếp

// Public - không cần đăng nhập
router.get('/', getProducts);
router.get('/:id', getProductById);

// Cần đăng nhập - kiểm tra role trong controller
router.post('/', verifyToken, createProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;