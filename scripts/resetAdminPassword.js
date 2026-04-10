require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  const newPassword = process.argv[2] || "admin123";

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected MongoDB");

  const admin = await User.findOne({
    $or: [{ username: "admin" }, { email: "admin@gmail.com" }],
  });

  if (!admin) {
    console.log("❌ Không tìm thấy tài khoản admin");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  admin.password = hashed;
  admin.role = "admin";
  admin.status = admin.status || "active";
  await admin.save();

  console.log(`✅ Đã reset mật khẩu admin thành: ${newPassword}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});

