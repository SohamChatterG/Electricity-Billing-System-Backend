import { Router } from "express";

const router: Router = Router();

import { authenticate, isAdmin } from "../middleware/authMiddleware.js";
import { getAllCustomers, getCustomerDetails, sendnotification } from "../controller/customerController.js";

// Get all customers (Admin only) 
router.get("/", authenticate, isAdmin, getAllCustomers);

// Get single customer details 
router.get("/:id", authenticate, getCustomerDetails);
router.post("/:id/send-notification", authenticate, isAdmin, sendnotification);


export default router;