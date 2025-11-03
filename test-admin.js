// Test script to create admin user
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Admin Schema
const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", adminSchema);

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("✅ Admin already exists:", existingAdmin.email);
      return;
    }

    // Create admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new Admin({
      firstName: "Admin",
      lastName: "User",
      email: "admin@gmail.com",
      password: hashedPassword,
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log("Email: admin@gmail.com");
    console.log("Password: admin123");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestAdmin();