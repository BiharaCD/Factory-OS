import SalesDispatch from "../models/salesDispatch.js";
import Inventory from "../models/inventory.js";

/**
 * CREATE SALES DISPATCH
 * - Draft  → NO inventory change
 * - Dispatched → Inventory deducted
 */
export const createDispatch = async (req, res) => {
  try {
    const { customerID, invoiceNumber, items, dispatchDate, status } = req.body;

    /* =======================
       BASIC VALIDATION
    ======================= */
    if (!customerID) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    if (!invoiceNumber) {
      return res.status(400).json({ message: "Invoice number is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    /* =======================
       MAP & VALIDATE ITEMS
    ======================= */
    const mappedItems = items.map((item) => ({
      itemName: item.itemName?.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

    for (const item of mappedItems) {
      if (!item.itemName) {
        return res.status(400).json({ message: "Item name is required" });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than 0" });
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        return res.status(400).json({ message: "Unit price must be greater than 0" });
      }
    }

    /* =======================
       CREATE DISPATCH
    ======================= */
    const dispatch = new SalesDispatch({
      customerID,
      invoiceNumber,
      items: mappedItems,
      dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
      status: status || "Draft",
    });

    await dispatch.save();

    /* =======================
       INVENTORY DEDUCTION
       ONLY WHEN DISPATCHED
    ======================= */
    if (dispatch.status === "Dispatched") {
      for (const item of mappedItems) {
        const inventoryItem = await Inventory.findOne({
          itemName: item.itemName,
        });

        if (!inventoryItem) {
          return res.status(400).json({
            message: `Inventory item not found: ${item.itemName}`,
          });
        }

        if (inventoryItem.quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.itemName}. Available: ${inventoryItem.quantity}`,
          });
        }

        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();
      }
    }

    res.status(201).json(dispatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET ALL DISPATCHES
 */
export const getDispatches = async (req, res) => {
  try {
    const dispatches = await SalesDispatch.find()
      .populate("customerID")
      .sort({ createdAt: -1 });

    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE DISPATCH STATUS
 * - Draft → Dispatched = deduct inventory
 * - Delivered = no inventory change
 */
export const updateDispatchStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const dispatch = await SalesDispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: "Dispatch not found" });
    }

    /* =======================
       DEDUCT STOCK ONLY ON
       Draft → Dispatched
    ======================= */
    if (dispatch.status !== "Dispatched" && status === "Dispatched") {
      for (const item of dispatch.items) {
        const inventoryItem = await Inventory.findOne({
          itemName: item.itemName,
        });

        if (!inventoryItem) {
          return res.status(400).json({
            message: `Inventory item not found: ${item.itemName}`,
          });
        }

        if (inventoryItem.quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.itemName}`,
          });
        }

        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();
      }
    }

    dispatch.status = status;
    await dispatch.save();

    const updatedDispatch = await dispatch.populate("customerID");

    res.json(updatedDispatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
