import SupplierBill from "../models/supplierBill.js";

// Create Supplier Bill
export const createSupplierBill = async (req, res) => {
  try {
    const bill = new SupplierBill(req.body);
    await bill.save();
    const bills = await SupplierBill.find()
      .populate("items.inventoryID", "name SKU"); // populate name and SKU from Inventory
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all Bills
export const getSupplierBills = async (req, res) => {
  try {
    const bills = await SupplierBill.find().populate("supplierID linkedPO linkedGRN");
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Supplier Bill status
export const updateSupplierBillStatus = async (req, res) => {
  try {
    const bill = await SupplierBill.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true }
    ).populate("supplierID linkedPO linkedGRN");
    if (!bill) return res.status(404).json({ message: "Supplier bill not found" });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Supplier Bill
export const deleteSupplierBill = async (req, res) => {
  try {
    const bill = await SupplierBill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ message: "Supplier bill not found" });
    res.json({ message: "Supplier bill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }   
};