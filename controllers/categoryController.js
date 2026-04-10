const Category = require('../models/Category');

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) { next(err); }
};

const getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json(category);
    } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        Object.assign(category, req.body);
        await category.save();
        res.json(category);
    } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        await category.deleteOne();
        res.json({ message: 'Đã xóa danh mục' });
    } catch (err) { next(err); }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };