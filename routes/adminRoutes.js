import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  getAllMockTests,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  getAllPurchases
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Book Management
router.get("/books", getAllBooks);
router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

// Mock Test Management
router.get("/tests", getAllMockTests);
router.post("/tests", createMockTest);
router.put("/tests/:id", updateMockTest);
router.delete("/tests/:id", deleteMockTest);

// Purchase Management
router.get("/purchases", getAllPurchases);

export default router;