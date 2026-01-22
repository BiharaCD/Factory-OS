import express from "express";
import { getInventory, getInventoryById, updateThreshold } from "../controllers/inventoryController.js";

const router = express.Router();

// Read-only routes for inventory
router.get("/", getInventory);
router.get("/:id", getInventoryById);

// Update threshold for an item
router.patch("/:id/threshold", updateThreshold);

export default router;
