import { Router } from "express";
import { login, getCurrentUser, changePassword } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.get("/me", authenticateToken, getCurrentUser);
router.post("/change-password", authenticateToken, changePassword);

export default router;
