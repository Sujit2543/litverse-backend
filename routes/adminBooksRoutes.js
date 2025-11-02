import express from "express";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { getAllBooks, addBook, updateBook, deleteBook } from "../controllers/adminBooksController.js";

const router = express.Router();

router.get("/", verifyAdmin, getAllBooks);
router.post("/", verifyAdmin, addBook);
router.put("/:id", verifyAdmin, updateBook);
router.delete("/:id", verifyAdmin, deleteBook);

export default router;
