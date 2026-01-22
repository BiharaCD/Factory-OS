import mongoose from "mongoose";

const grnSchema = new mongoose.Schema({
  poID: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
  grnNumber: { type: String, unique: true },
  items: [
    {
      itemName: { type: String, required: true },
      category: { type: String, required: true },
      quantityReceived: { type: Number, required: true }, // <--- added
      lotNumber: { type: String },
      expiryDate: { type: Date },
    }
  ],
  QC: { type: String, enum: ["Check", "Pass", "Fail"], default: "Check" },
}, { timestamps: true }); // auto createdAt/updatedAt);

// Auto-generate GRN number if not provided
grnSchema.pre("save", function(next) {
  if (!this.grnNumber) {
    this.grnNumber = `GRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model("GRN", grnSchema);
