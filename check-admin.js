// Script to check if admin exists in database
import mongoose from "mongoose";
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

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const admins = await Admin.find({}).select("-password");
    console.log("📋 Admins in database:", admins);

    if (admins.length === 0) {
      console.log("❌ No admins found in database");
    } else {
      console.log(`✅ Found ${admins.length} admin(s)`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();