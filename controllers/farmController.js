const Farm = require('../models/Farm');

const getFarms = async (req, res, next) => {
    try {
        const { province, OwnerId } = req.query;
        const filter = {};
        if (province) filter.province = province;
        if (OwnerId)  filter.OwnerId = OwnerId;
        const farms = await Farm.find(filter);
        res.json(farms);
    } catch (err) { next(err); }
};

const getFarmById = async (req, res, next) => {
    try {
        const farm = await Farm.findById(req.params.id);
        if (!farm) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
        res.json(farm);
    } catch (err) { next(err); }
};

const createFarm = async (req, res, next) => {
    try {
        const farm = new Farm(req.body);
        await farm.save();
        res.status(201).json(farm);
    } catch (err) { next(err); }
};

const updateFarm = async (req, res, next) => {
    try {
        const farm = await Farm.findById(req.params.id);
        if (!farm) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
        if (req.user.role !== 'admin' && farm.OwnerId !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền' });
        }
        Object.assign(farm, req.body);
        await farm.save();
        res.json(farm);
    } catch (err) { next(err); }
};

const deleteFarm = async (req, res, next) => {
    try {
        const farm = await Farm.findById(req.params.id);
        if (!farm) return res.status(404).json({ message: 'Không tìm thấy trang trại' });
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền' });
        }
        await farm.deleteOne();
        res.json({ message: 'Đã xóa trang trại' });
    } catch (err) { next(err); }
};

module.exports = { getFarms, getFarmById, createFarm, updateFarm, deleteFarm };