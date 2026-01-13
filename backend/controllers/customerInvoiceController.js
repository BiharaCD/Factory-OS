import CustomerInvoice from "../models/customerInvoice.js";

// Create invoice (does not affect stock)
export const createInvoice = async (req, res) => {
  try {
    const invoice = new CustomerInvoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await CustomerInvoice.find().populate("customerID linkedDispatchID");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Invoice status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true }
    ).populate("customerID linkedDispatchID");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};