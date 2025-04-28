import { Router } from "express";

const router: Router = Router();
import { getMeterReadings, submitMeterReading } from "../controller/meterController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

// Submit new meter reading (Admin only) - Creates reading and generates bill
router.post("/meter-readings", authenticate, isAdmin, submitMeterReading);

// Get reading history - Returns paginated readings for a meter
router.get("/meter-readings/:meterId", authenticate, getMeterReadings);


export default router;