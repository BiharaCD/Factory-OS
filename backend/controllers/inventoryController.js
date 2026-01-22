import Inventory from "../models/inventory.js";

// Get all inventory
export const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single inventory item
export const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update inventory threshold
export const updateThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined || threshold === null) {
      return res.status(400).json({ message: "Threshold value is required" });
    }

    if (isNaN(threshold) || threshold < 0) {
      return res.status(400).json({ message: "Threshold must be a non-negative number" });
    }

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { threshold: Number(threshold), updatedAt: Date.now() },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
