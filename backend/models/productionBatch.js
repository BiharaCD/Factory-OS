import mongoose from "mongoose";

const productionBatchSchema = new mongoose.Schema({
  batchID: { type: String, required: true, unique: true },
  SKU: { type: String, required: true },
  status: { type: String, enum: ["Opened", "In-Process", "QC", "Filling", "Sealed", "Labeled", "SecondaryPacked", "Closed"], default: "Opened" },
  containerType: { type: String },
  alcoholFlag: { type: Boolean, default: false },
  QCresult: { type: String, enum: ["Pass", "Fail"], default: "Pass" },
  yieldPercentage: { type: Number, default: 0 },
  lossReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("ProductionBatch", productionBatchSchema);
