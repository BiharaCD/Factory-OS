import express from "express";
import { register, login, getProfile, getPendingUsers, getApprovedUsers, approveUser, rejectUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);
router.get("/pending-users", verifyToken, getPendingUsers);
router.get("/approved-users", verifyToken, getApprovedUsers);
router.patch("/:userId/approve", verifyToken, approveUser);
router.patch("/:userId/reject", verifyToken, rejectUser);

export default router;
