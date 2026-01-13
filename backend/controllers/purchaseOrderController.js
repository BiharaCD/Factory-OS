import PurchaseOrder from "../models/purchaseOrder.js";

// Create Purchase Order
export const createPO = async (req, res) => {
  try {
    const po = new PurchaseOrder(req.body);
    await po.save();
    res.status(201).json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all POs
export const getPOs = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().populate("supplierID");
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single PO
export const getPOById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate("supplierID");
    if (!po) return res.status(404).json({ message: "PO not found" });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update PO status
export const updatePOStatus = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Purchase Order
export const deletePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) return res.status(404).json({ message: "Purchase Order not found" });
    res.json({ message: "Purchase Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


