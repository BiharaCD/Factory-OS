import express from "express";
import { getInventory, getInventoryById } from "../controllers/inventoryController.js";

const router = express.Router();

// Read-only routes for inventory
router.get("/", getInventory);
router.get("/:id", getInventoryById);

export default router;
