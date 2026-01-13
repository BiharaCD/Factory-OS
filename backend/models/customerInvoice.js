import mongoose from "mongoose";

const customerInvoiceSchema = new mongoose.Schema({
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  linkedDispatchID: { type: mongoose.Schema.Types.ObjectId, ref: "SalesDispatch" },
  items: [
    {
      SKU: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number },
    }
  ],
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Draft", "Issued", "Paid", "Overdue"], default: "Draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("CustomerInvoice", customerInvoiceSchema);
