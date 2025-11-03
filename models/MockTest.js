import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index of correct option
  explanation: { type: String },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  points: { type: Number, default: 1 }
});

const mockTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  questions: [questionSchema],
  isActive: { type: Boolean, default: true },
  isFree: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("MockTest", mockTestSchema);