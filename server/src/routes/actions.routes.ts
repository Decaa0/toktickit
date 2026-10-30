import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  listActions,
  createAction,
  updateAction,
} from "../controllers/actions.controller";

const router = Router();

router.get("/tickets/:id/actions", authenticateToken, listActions);
router.post(
  "/tickets/:id/actions",
  authenticateToken,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  createAction
);
router.patch(
  "/tickets/:id/actions/:actionId",
  authenticateToken,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  updateAction
);

export default router;
