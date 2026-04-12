const Farm       = require('../models/Farm');
const { cloudinary } = require('../config/cloudinary');

// Xóa ảnh cũ trên Cloudinary
async function destroyImages(imageStr) {
    if (!imageStr) return;
    const urls = imageStr.split(',').map(s => s.trim()).filter(s => s.includes('cloudinary.com'));
    for (const url of urls) {
        const publicId = url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
        await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
}

// ── Lấy tất cả farm ─────────────────────────────────
const getFarms = async (req, res, next) => {
    try {
        const { province, OwnerId } = req.query;
        const filter = {};
        if (province) filter.province = province;
        if (OwnerId)  filter.OwnerId  = OwnerId;
        const farms = await Farm.find(filter);
        res.json(farms);
    } catch (err) { next(err); }
};

// ── Lấy farm theo ID ────────────────────────────────
const getFarmById = async (req, res, next) => {
    try {
        const farm = await Farm.findById(req.params.id);
        if (!farm) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
        res.json(farm);
    } catch (err) { next(err); }
};

// ── Tạo farm mới ────────────────────────────────────
const createFarm = async (req, res, next) => {
    try {
        // Nếu có upload nhiều ảnh → lấy URLs từ Cloudinary
        let images = req.body.images; // fallback URL thủ công
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => f.path).join(',');
        }

        const farm = new Farm({ ...req.body, images });
        await farm.save();
        res.status(201).json(farm);
    } catch (err) { next(err); }
};

// ── Cập nhật farm ───────────────────────────────────
const updateFarm = async (req, res, next) => {
    try {
        const farm = await Farm.findById(req.params.id);
        if (!farm) return res.status(404).json({ message: 'Không tìm thấy trang trại' });

        if (req.user.role !== 'admin' && farm.OwnerId !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền' });
        }

        // Nếu có upload ảnh mới → xóa ảnh cũ, lưu ảnh mới
        if (req.files && req.files.length > 0) {
            await destroyImages(farm.images);
            req.body.images = req.files.map(f => f.path).join(',');
        }

        Object.assign(farm, req.body);
        await farm.save();
        res.json(farm);
    } catch (err) { next(err); }
};

// ── Xóa farm ────────────────────────────────────────
const deleteFarm = async (req, res, next) => {
    try {
        const farm = await Farm.findById(req.params.id);
        if (!farm) return res.status(404).json({ message: 'Không tìm thấy trang trại' });

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền' });
        }

        // Xóa ảnh trên Cloudinary khi xóa farm
        await destroyImages(farm.images);

        await farm.deleteOne();
        res.json({ message: 'Đã xóa trang trại' });
    } catch (err) { next(err); }
};

module.exports = { getFarms, getFarmById, createFarm, updateFarm, deleteFarm };