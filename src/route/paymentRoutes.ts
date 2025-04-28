import { Router } from "express";

const router: Router = Router();
import { authenticate, isAdmin, isCustomer } from "../middleware/authMiddleware.js";
import { makePayment } from "../controller/paymentController.js";

router.post("/", authenticate, isCustomer, makePayment);

export default router;
