// src/routes/billRoutes.ts
import { Router } from "express";
import { getBillById, listBills, getCustomerBills, listBillsByMonth, sendBillNotification } from "../controller/billController.js";
import { authenticate, isAdmin, isCustomer } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/admin/monthly", authenticate, isAdmin, listBillsByMonth);
router.get("/my-bills", authenticate, getCustomerBills); // Specific first!
router.get("/", authenticate, listBills);                // Then less specific
router.get("/:billId", authenticate, getBillById);
router.post("/:billId/notify", authenticate, isAdmin, sendBillNotification);
// Last wildcard
export default router;
