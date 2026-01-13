import ProductionBatch from "../models/productionBatch.js";

// Create production batch
export const createBatch = async (req, res) => {
  try {
    const batch = new ProductionBatch(req.body);
    await batch.save();
    res.status(201).json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update batch status
export const updateBatchStatus = async (req, res) => {
  try {
    const batch = await ProductionBatch.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all batches
export const getBatches = async (req, res) => {
  try {
    const batches = await ProductionBatch.find();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update QC result
export const updateQCresult = async (req, res) => {
  try {
    const batch = await ProductionBatch.findByIdAndUpdate(req.params.id, { QCresult: req.body.QCresult }, { new: true });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};