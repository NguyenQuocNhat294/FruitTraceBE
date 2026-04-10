const User    = require('../models/User');
const Farm    = require('../models/Farm');
const Batch   = require('../models/Batch');
const TraceLog = require('../models/TraceLog');

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
    try {
        const [totalUsers, totalFarms, totalBatches, totalLogs] = await Promise.all([
            User.countDocuments(),
            Farm.countDocuments(),
            Batch.countDocuments(),
            TraceLog.countDocuments(),
        ]);

        res.json({
            totalUsers,
            totalFarms,
            totalBatches,
            totalLogs,
            revenue: 0, // chưa có collection orders
        });
    } catch (err) { next(err); }
};

// GET /api/admin/revenue
const getRevenue = async (req, res, next) => {
    try {
        // Tạo data doanh thu giả theo tháng dựa trên số lô hàng
        const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
        const values = months.map(() => Math.floor(Math.random() * 80 + 20) * 1000000);
        res.json({ categories: months, values });
    } catch (err) { next(err); }
};

// GET /api/admin/activities
const getActivities = async (req, res, next) => {
    try {
        const logs = await TraceLog.find()
            .sort({ _id: -1 })
            .limit(10);

        const activities = logs.map(log => ({
            id: log._id,
            user: log.batch_id || 'Hệ thống',
            action: `${log.title || log.step} — ${log.location || ''}`,
            date: log.date,
        }));

        res.json(activities);
    } catch (err) { next(err); }
};

// GET /api/admin/top-farms
const getTopFarms = async (req, res, next) => {
    try {
        const farms = await Farm.find().limit(5);

        // Đếm số batch theo farmid
        const farmsWithCount = await Promise.all(
            farms.map(async (farm) => {
                const count = await Batch.countDocuments({ farmid: farm.id });
                return {
                    id: farm._id,
                    name: farm.FarmName,
                    province: farm.province,
                    batches: count,
                };
            })
        );

        // Sort theo số batch nhiều nhất
        farmsWithCount.sort((a, b) => b.batches - a.batches);
        res.json(farmsWithCount);
    } catch (err) { next(err); }
};

module.exports = { getDashboard, getRevenue, getActivities, getTopFarms };