import GRN from "../models/grn.js";
import Inventory from "../models/inventory.js";

// Create GRN and update inventory
export const createGRN = async (req, res) => {
  try {
    const { poID, items, QC } = req.body;
    const grn = new GRN({ poID, items, QC });
    
    await grn.save();

    // Update inventory - match by itemName
    for (const item of items) {
      const inv = await Inventory.findOne({ itemName: item.itemName });
      if (inv) {
        inv.quantity += item.quantityReceived;
        if (item.lotNumber) inv.lotNumber = item.lotNumber;
        if (item.expiryDate) inv.expiryDate = item.expiryDate;
        // Update QC status from GRN
        if (QC) {
          inv.QCstatus = QC;
        }
        await inv.save();
      } else {
        // If inventory item doesn't exist, create it
        const newInv = new Inventory({
          itemCode: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          itemName: item.itemName,
          SKU: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: 'Raw Material',
          quantity: item.quantityReceived,
          lotNumber: item.lotNumber,
          expiryDate: item.expiryDate,
          QCstatus: QC || 'Pass',
        });
        await newInv.save();
      }
    }

    res.status(201).json(grn);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all GRNs
export const getGRNs = async (req, res) => {
  try {
    const grns = await GRN.find().populate("poID");
    res.json(grns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update GRN status
export const updateGRNStatus = async (req, res) => {
  try {
    const grn = await GRN.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true }
    ).populate("poID");
    if (!grn) return res.status(404).json({ message: "GRN not found" });
    res.json(grn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};