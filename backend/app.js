import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Routes
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js";
import purchaseOrderRoutes from "./routes/purchaseOrder.js";
import grnRoutes from "./routes/grn.js";
import supplierBillRoutes from "./routes/supplierBill.js";
import productionBatchRoutes from "./routes/productionBatch.js";
import salesDispatchRoutes from "./routes/salesDispatch.js";
import customerInvoiceRoutes from "./routes/customerInvoice.js";
import supplierRoutes from "./routes/supplier.js";
import customerRoutes from "./routes/customer.js";

dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json()); // parse JSON

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/supplier-bills", supplierBillRoutes);
app.use("/api/production-batches", productionBatchRoutes);
app.use("/api/sales-dispatches", salesDispatchRoutes);
app.use("/api/customer-invoices", customerInvoiceRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);

// --- Test route ---
app.get("/", (req, res) => {
  res.send("FactoryOS API Running");
});

// --- Connect to MongoDB and start server ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB connected");
})
.catch((err) => console.log("MongoDB connection failed:", err));

// Optional: handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection:", err.message);
  process.exit(1);
});

export default app;
