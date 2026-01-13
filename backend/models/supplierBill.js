import mongoose from "mongoose";

const supplierBillSchema = new mongoose.Schema({
  supplierID: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  billNumber: { type: String, required: true },
  billDate: { type: Date, required: true },
  dueDate: { type: Date },
  linkedPO: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
  linkedGRN: { type: mongoose.Schema.Types.ObjectId, ref: "GRN" },
  items: [
    {
      inventoryID: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
      quantity: { type: Number },
      unitPrice: { type: Number },
    }
  ],
  status: { type: String, enum: ["Draft", "Approved", "Unpaid", "Paid"], default: "Draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("SupplierBill", supplierBillSchema);
