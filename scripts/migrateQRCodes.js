/**
 * Script migrate qr_code từ localhost → Vercel URL
 * Chạy 1 lần ở LOCAL: node scripts/migrateQRCodes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Batch = require('../models/Batch'); // ⚠️ đổi đúng tên model nếu khác

// ✅ URL frontend Vercel của bạn
const VERCEL_URL = 'https://ftrui-trace-fe.vercel.app';

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối MongoDB\n');

    // Lấy tất cả batch còn localhost trong qr_code
    const batches = await Batch.find({ qr_code: /localhost/ });
    console.log(`📦 Tìm thấy ${batches.length} batch cần migrate\n`);

    if (batches.length === 0) {
        console.log('🎉 Không có gì cần migrate!');
        return mongoose.disconnect();
    }

    let success = 0;

    for (const batch of batches) {
        // http://localhost:5173/batches/B011 → https://ftrui-trace-fe.vercel.app/trace?code=BATCH-011
        const newUrl = `${VERCEL_URL}/trace?code=${encodeURIComponent(batch.batchcode)}`;
        batch.qr_code = newUrl;
        await batch.save();
        console.log(`✅ ${batch.batchcode} → ${newUrl}`);
        success++;
    }

    console.log('\n─────────────────────────────────');
    console.log(`✅ Đã migrate: ${success} batch`);
    console.log('─────────────────────────────────');
    console.log('🎉 Xong!');
    mongoose.disconnect();
}

migrate().catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});