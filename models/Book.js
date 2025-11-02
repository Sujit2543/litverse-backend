import mongoose from "mongoose";

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: String,
  description: String,
  coverImage: String,
  fileUrl: String,
  type: { type: String, enum: ["ebook", "audiobook", "physical"], default: "ebook" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Book", BookSchema);
