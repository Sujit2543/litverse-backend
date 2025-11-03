import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedAnswer: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  timeTaken: { type: Number }, // in seconds
  points: { type: Number, default: 0 }
});

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true },
  answers: [answerSchema],
  totalScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number, required: true }, // in minutes
  isPassed: { type: Boolean, required: true },
  rank: { type: Number },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model("TestResult", testResultSchema);