import express from "express";
import { createBatch, getBatches, updateBatchStatus, updateQCresult } from "../controllers/productionBatchController.js";

const router = express.Router();

router.post("/", createBatch);
router.get("/", getBatches);
router.patch("/:id/status", updateBatchStatus);
router.patch("/:id/QCresult", updateQCresult);

export default router;
