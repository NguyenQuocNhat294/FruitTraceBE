const Product  = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// ── Tạo sản phẩm mới ────────────────────────────────
const createProduct = async (req, res, next) => {
    try {
        const { name, CategoryId, FarmId, price, unit, description, stock } = req.body;

        // Nếu có upload file → dùng URL từ Cloudinary, không thì lấy từ body (URL thủ công)
        const image = req.file ? req.file.path : req.body.image;

        const product = new Product({
            name, CategoryId, FarmId, price, unit, description, stock, image,
        });

        await product.save();
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
};

// ── Lấy tất cả sản phẩm ─────────────────────────────
const getProducts = async (req, res, next) => {
    try {
        const { CategoryId, FarmId, status } = req.query;
        const filter = {};
        if (CategoryId) filter.CategoryId = CategoryId;
        if (FarmId)     filter.FarmId     = FarmId;
        if (status)     filter.status     = status;

        const products = await Product.find(filter);
        res.json(products);
    } catch (err) {
        next(err);
    }
};

// ── Lấy sản phẩm theo ID ─────────────────────────────
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json(product);
    } catch (err) {
        next(err);
    }
};

// ── Cập nhật sản phẩm ───────────────────────────────
const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (req.user.role !== 'admin' && product.FarmId.toString() !== req.user.farmId?.toString()) {
            return res.status(403).json({ message: 'Không có quyền' });
        }

        // Nếu có upload ảnh mới
        if (req.file) {
            // Xóa ảnh cũ trên Cloudinary nếu có
            if (product.image && product.image.includes('cloudinary.com')) {
                // Lấy public_id từ URL: .../fruittrace/abc123 → fruittrace/abc123
                const publicId = product.image
                    .split('/')
                    .slice(-2)
                    .join('/')
                    .replace(/\.[^.]+$/, '');
                await cloudinary.uploader.destroy(publicId).catch(() => {}); // không block nếu lỗi
            }
            req.body.image = req.file.path;
        }

        Object.assign(product, req.body);
        await product.save();
        res.json(product);
    } catch (err) {
        next(err);
    }
};

// ── Xóa sản phẩm ────────────────────────────────────
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        if (req.user.role !== 'admin' && product.FarmId.toString() !== req.user.farmId?.toString()) {
            return res.status(403).json({ message: 'Không có quyền' });
        }

        // Xóa ảnh trên Cloudinary khi xóa sản phẩm
        if (product.image && product.image.includes('cloudinary.com')) {
            const publicId = product.image
                .split('/')
                .slice(-2)
                .join('/')
                .replace(/\.[^.]+$/, '');
            await cloudinary.uploader.destroy(publicId).catch(() => {});
        }

        await product.deleteOne();
        res.json({ message: 'Đã xóa sản phẩm' });
    } catch (err) {
        next(err);
    }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };