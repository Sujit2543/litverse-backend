import express from "express";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { getAllUsers, deleteUser } from "../controllers/adminUsersController.js";

const router = express.Router();

router.get("/", verifyAdmin, getAllUsers);
router.delete("/:id", verifyAdmin, deleteUser);

export default router;
