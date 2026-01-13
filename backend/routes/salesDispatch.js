import express from "express";
import { createDispatch, getDispatches, updateDispatchStatus } from "../controllers/salesDispatchController.js";

const router = express.Router();

router.post("/", createDispatch);
router.get("/", getDispatches);
router.patch("/:id/status", updateDispatchStatus);

export default router;
