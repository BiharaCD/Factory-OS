import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Supplier", supplierSchema);
