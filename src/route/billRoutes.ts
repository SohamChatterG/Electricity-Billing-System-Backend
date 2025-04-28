// src/routes/billRoutes.ts
import { Router } from "express";
import { getBillById, listBills } from "../controller/billController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", authenticate, listBills);
router.get("/:billId", authenticate, getBillById);

export default router;
