import { Router } from "express";
import { login, signup } from "../controller/authController.js";

const router: Router = Router();

// Auth routes
router.post("/login", login);
router.post("/signup", signup);

export default router;

