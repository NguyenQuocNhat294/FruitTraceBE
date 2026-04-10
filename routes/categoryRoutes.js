const express = require('express');
const router = express.Router();
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const verifyToken = require('../middlewares/auth');

router.get('/',     getCategories);
router.get('/:id',  getCategoryById);
router.post('/',    verifyToken, createCategory);
router.put('/:id',  verifyToken, updateCategory);
router.delete('/:id', verifyToken, deleteCategory);

module.exports = router;