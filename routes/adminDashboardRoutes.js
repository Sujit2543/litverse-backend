import express from "express";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { getDashboardStats } from "../controllers/adminDashboardController.js";

const router = express.Router();

router.get("/", verifyAdmin, getDashboardStats);

export default router;
