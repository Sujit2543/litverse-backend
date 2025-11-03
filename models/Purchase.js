import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["card", "paypal", "wallet"], required: true },
  paymentStatus: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  transactionId: { type: String, unique: true },
  purchaseDate: { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 },
  maxDownloads: { type: Number, default: 5 }
});

export default mongoose.model("Purchase", purchaseSchema);