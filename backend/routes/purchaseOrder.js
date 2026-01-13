import express from "express";
import { createPO, getPOs, getPOById, updatePOStatus, deletePO } from "../controllers/purchaseOrderController.js";

const router = express.Router();

router.post("/", createPO);
router.get("/", getPOs);
router.get("/:id", getPOById);
router.patch("/:id/status", updatePOStatus);
router.delete("/:id", deletePO);

export default router;
