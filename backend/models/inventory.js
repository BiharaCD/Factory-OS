import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  //SKU: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String },
  containerType: { type: String },
  lotNumber: { type: String },
  batchID: { type: String },
  quantity: { type: Number, default: 0 },
  threshold: { type: Number, default: 10 },
  expiryDate: { type: Date },
  alcoholFlag: { type: Boolean, default: false },
  QCstatus: { type: String, enum: ["Pass", "Fail"], default: "Pass" },
  yieldPercentage: { type: Number, default: 0 },
  lossReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Inventory", inventorySchema);
