import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticateToken);
router.use(requireRole("ADMINISTRATOR"));

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.post("/users/:id/reset-password", resetUserPassword);

export default router;
