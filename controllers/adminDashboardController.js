import User from "../models/User.js";
import Book from "../models/Book.js";

export const getDashboardStats = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const totalBooks = await Book.countDocuments();
  const recentBooks = await Book.find().sort({ createdAt: -1 }).limit(5);

  res.json({
    totalUsers,
    totalBooks,
    recentBooks,
  });
};
