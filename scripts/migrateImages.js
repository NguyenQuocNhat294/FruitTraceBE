/**
 * Script migration ảnh từ /images/abc.jpg → Cloudinary URL
 * Chạy 1 lần duy nhất ở LOCAL:  node scripts/migrateImages.js
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

const Product = require('../models/Product');

// Các thư mục có thể chứa ảnh cũ
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

// Upload 1 file lên Cloudinary, trả về secure_url
async function uploadOne(filename) {
    const localPath = findLocalFile(filename);
    if (!localPath) {
        console.warn(`   ⚠️  Không tìm thấy file: ${filename}`);
        return null;
    }
    const result = await cloudinary.uploader.upload(localPath, {
        folder:          'fruittrace',
        use_filename:    true,
        unique_filename: false,
    });
    return result.secure_url;
}

async function migrate() {
    // Kiểm tra env
    const missing = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
        .filter(k => !process.env[k]);
    if (missing.length) {
        console.error('❌ Thiếu biến môi trường:', missing.join(', '));
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối MongoDB\n');

    // Lấy tất cả sản phẩm có image bắt đầu bằng /images/
    const products = await Product.find({ image: /^\/images\// });
    console.log(`📦 Tìm thấy ${products.length} sản phẩm cần migrate\n`);

    if (products.length === 0) {
        console.log('🎉 Không có gì cần migrate!');
        return mongoose.disconnect();
    }

    let success = 0;
    let failed  = 0;

    for (const product of products) {
        console.log(`🔄 [${product.name}]`);

        // image có thể là: "/images/a.jpg,b.jpg,c.jpg"
        const rawImages = product.image || '';
        const filenames = rawImages
            .split(',')
            .map(s => s.trim())
            .map(s => path.basename(s)) // lấy tên file, bỏ /images/
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
                console.error(`   ❌ ${filename} — Lỗi:`, err.message);
                hasError = true;
            }
        }

        if (newUrls.length > 0) {
            // Lưu lại dạng comma-separated URLs (giữ nguyên cấu trúc cũ)
            product.image = newUrls.join(',');
            await product.save();
            success++;
        } else {
            console.warn(`   ⚠️  Không upload được ảnh nào cho sản phẩm này`);
            if (hasError) failed++;
        }
    }

    console.log('\n─────────────────────────────────');
    console.log(`✅ Thành công : ${success}`);
    console.log(`❌ Thất bại  : ${failed}`);
    console.log('─────────────────────────────────');
    console.log('🎉 Migration hoàn tất!');

    mongoose.disconnect();
}

migrate().catch((err) => {
    console.error('❌ Lỗi nghiêm trọng:', err.message);
    process.exit(1);
});