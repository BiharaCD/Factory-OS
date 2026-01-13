import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({

   poNumber: {
    type: String,
    unique: true,
    required: true
  },
  supplierID: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  items: [
    {
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
    }
  ],
  expectedDeliveryDate: { type: Date },
  status: { type: String, enum: ["Draft", "Approved", "Sent", "Partially Received", "Closed"], default: "Draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);

