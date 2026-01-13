import express from "express";
import { createSupplierBill, getSupplierBills, updateSupplierBillStatus, deleteSupplierBill } from "../controllers/supplierBillController.js";

const router = express.Router();

router.post("/", createSupplierBill);
router.get("/", getSupplierBills);
router.patch("/:id/status", updateSupplierBillStatus);
router.delete("/:id", deleteSupplierBill);
  // Implement delete functionality

export default router;
