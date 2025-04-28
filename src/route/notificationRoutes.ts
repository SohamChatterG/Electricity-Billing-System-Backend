import { Router } from "express";

const router: Router = Router();
import { getNotifications, markAsRead } from "../controller/notificationController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

// Get user notifications - Returns unread notifications first
router.get("/notifications", authenticate, getNotifications);

// Mark notification as read - Updates notification status
router.patch("/notifications/:id/read", authenticate, markAsRead);


export default router;