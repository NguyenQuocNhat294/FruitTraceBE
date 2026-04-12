/**
 * Script migrate ảnh farm từ /images/abc.jpg → Cloudinary URL
 * Chạy 1 lần ở LOCAL: node scripts/migrateFarmImages.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const path       = require('path');
const fs         = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ⚠️ Đổi đúng tên model nếu khác
const Farm = require('../models/Farm');

// Thư mục có thể chứa ảnh cũ
const IMAGE_DIRS = [
    path.join(__dirname, '../public/images'),
    path.join(__dirname, '../../frontend/public/images'),
];

function findLocalFile(filename) {
    for (const dir of IMAGE_DIRS) {
        const fullPath = path.join(dir, filename);
        if (fs.existsSync(fullPath)) return fullPath;
    }
    return null;
}

async function uploadOne(filename) {
    const localPath = findLocalFile(filename);
    if (!localPath) {
        console.warn(`   ⚠️  Không tìm thấy file: ${filename}`);
        return null;
    }
    const result = await cloudinary.uploader.upload(localPath, {
        folder:          'fruittrace/farms',
        use_filename:    true,
        unique_filename: false,
    });
    return result.secure_url;
}

async function migrate() {
    const missing = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
        .filter(k => !process.env[k]);
    if (missing.length) {
        console.error('❌ Thiếu biến môi trường:', missing.join(', '));
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối MongoDB\n');

    // Lấy farm còn ảnh dạng /images/... (chưa migrate)
    const farms = await Farm.find({ images: /^\/images\// });
    console.log(`🏡 Tìm thấy ${farms.length} farm cần migrate\n`);

    if (farms.length === 0) {
        console.log('🎉 Không có gì cần migrate!');
        return mongoose.disconnect();
    }

    let success = 0, failed = 0;

    for (const farm of farms) {
        console.log(`🔄 [${farm.name || farm._id}]`);

        const filenames = (farm.images || '')
            .split(',')
            .map(s => s.trim())
            .map(s => path.basename(s))
            .filter(Boolean);

        const newUrls = [];
        let hasError  = false;

        for (const filename of filenames) {
            try {
                const url = await uploadOne(filename);
                if (url) {
                    newUrls.push(url);
                    console.log(`   ✅ ${filename} → ${url}`);
                } else {
                    hasError = true;
                }
            } catch (err) {
                console.error(`   ❌ ${filename}:`, err.message);
                hasError = true;
            }
        }

        if (newUrls.length > 0) {
            farm.images = newUrls.join(',');
            await farm.save();
            success++;
        } else {
            console.warn(`   ⚠️  Không upload được ảnh nào`);
            if (hasError) failed++;
        }
    }

    console.log('\n─────────────────────────────────');
    console.log(`✅ Thành công : ${success}`);
    console.log(`❌ Thất bại  : ${failed}`);
    console.log('─────────────────────────────────');
    console.log('🎉 Migration farm hoàn tất!');
    mongoose.disconnect();
}

migrate().catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});