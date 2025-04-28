import { Router } from "express";
import { getCustomerConnections, createConnection, updateConnection, deactivateConnection } from "../controller/connectionController.js"
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";
const router: Router = Router();

router.post("/create-connection", authenticate, isAdmin, createConnection);
router.delete("/deactivate-connection/:id", authenticate, isAdmin, deactivateConnection);
router.put("/update-connection/:connectionId", authenticate, isAdmin, updateConnection);
router.get("/get-connection/:customerId", authenticate, getCustomerConnections);
export default router;
