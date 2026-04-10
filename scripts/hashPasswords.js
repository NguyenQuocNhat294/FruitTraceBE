// backend/scripts/hashPasswords.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('✅ Kết nối MongoDB thành công');
    const users = await User.find();
    console.log(`📋 Tìm thấy ${users.length} users`);

    for (const user of users) {
        // Chỉ hash nếu chưa hash (bcrypt hash bắt đầu bằng $2b$)
        if (!user.password?.startsWith('$2b$')) {
            const hashed = await bcrypt.hash(user.password, 12);
            await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
            console.log(`✅ Đã hash: ${user.username} (${user.role})`);
        } else {
            console.log(`⏭️  Bỏ qua: ${user.username} (đã hash rồi)`);
        }
    }
    console.log('\n🎉 Hoàn thành! Bây giờ có thể đăng nhập bình thường.');
    process.exit(0);
}).catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});