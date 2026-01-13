import mongoose from "mongoose";

const salesDispatchSchema = new mongoose.Schema({
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  invoiceNumber: { type: String, required: true },
  items: [
    {
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
    }
  ],
  dispatchDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Draft", "Dispatched", "Delivered"], default: "Draft" },
}, { timestamps: true });

export default mongoose.model("SalesDispatch", salesDispatchSchema);
