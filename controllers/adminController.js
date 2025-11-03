import User from "../models/User.js";
import Book from "../models/Book.js";
import Purchase from "../models/Purchase.js";
import MockTest from "../models/MockTest.js";
import TestResult from "../models/TestResult.js";
import bcrypt from "bcryptjs";

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalPurchases = await Purchase.countDocuments({ paymentStatus: "completed" });
    const totalTests = await MockTest.countDocuments();
    
    const totalRevenue = await Purchase.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPurchases = await Purchase.find({ paymentStatus: "completed" })
      .populate("userId", "firstName lastName email")
      .populate("bookId", "title price")
      .sort({ purchaseDate: -1 })
      .limit(5);

    const topBooks = await Purchase.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: "$bookId", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
      { $unwind: "$book" }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalBooks,
        totalPurchases,
        totalTests,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentUsers,
      recentPurchases,
      topBooks
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = search ? {
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    } : {};

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Book Management
export const getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const category = req.query.category || "";

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }
    if (category) {
      query.category = category;
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createBook = async (req, res) => {
  try {
    const bookData = req.body;
    const book = new Book(bookData);
    await book.save();

    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };

    const book = await Book.findByIdAndUpdate(id, updates, { new: true });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book updated successfully", book });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mock Test Management
export const getAllMockTests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const tests = await MockTest.find()
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MockTest.countDocuments();

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Error fetching mock tests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createMockTest = async (req, res) => {
  try {
    const testData = { ...req.body, createdBy: req.user.adminId };
    const test = new MockTest(testData);
    await test.save();

    res.status(201).json({ message: "Mock test created successfully", test });
  } catch (error) {
    console.error("Error creating mock test:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };

    const test = await MockTest.findByIdAndUpdate(id, updates, { new: true });
    if (!test) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    res.json({ message: "Mock test updated successfully", test });
  } catch (error) {
    console.error("Error updating mock test:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const test = await MockTest.findByIdAndDelete(id);
    if (!test) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    res.json({ message: "Mock test deleted successfully" });
  } catch (error) {
    console.error("Error deleting mock test:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Purchase Management
export const getAllPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const purchases = await Purchase.find()
      .populate("userId", "firstName lastName email")
      .populate("bookId", "title author price")
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments();

    res.json({
      purchases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Server error" });
  }
};