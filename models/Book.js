import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: Number, default: 0 },
  coverImage: { type: String, required: true },
  pdfUrl: { type: String },
  audioUrl: { type: String },
  isbn: { type: String, unique: true },
  pages: { type: Number },
  language: { type: String, default: "English" },
  publishedDate: { type: Date },
  publisher: { type: String },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Book", bookSchema);