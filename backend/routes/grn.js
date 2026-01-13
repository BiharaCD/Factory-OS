import express from "express";
import { createGRN, getGRNs, updateGRNStatus } from "../controllers/grnController.js";

const router = express.Router();

router.post("/", createGRN);
router.get("/", getGRNs);
router.patch("/:id/status", updateGRNStatus);

export default router;
