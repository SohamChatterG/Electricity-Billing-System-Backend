import { Router } from "express";

const router: Router = Router();
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";
import { generateExcelReport, generatePDFReport, generateReport } from "../controller/reportController.js";

router.get("/", authenticate, isAdmin, generateReport);

// PDF report generation (Admin only) - Exports formatted PDF reports
router.get("/pdf", authenticate, isAdmin, generatePDFReport);

// Excel export (Admin only) - Downloads Excel spreadsheet
router.get("/excel", authenticate, isAdmin, generateExcelReport);

// Customer consumption analytics - Returns usage trends
// router.get("/reports/consumption", authenticate, consumptionAnalytics);


export default router;
