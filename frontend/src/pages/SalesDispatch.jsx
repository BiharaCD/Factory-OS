import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  MenuItem,
  IconButton,
  FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { salesDispatchAPI, customersAPI, inventoryAPI } from '../services/api';

const STATUSES = ['Draft', 'Dispatched', 'Delivered'];

export default function SalesDispatch() {
  const [dispatches, setDispatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerID: '',
    invoiceNumber: '',
    items: [{ itemName: '', quantity: '', unitPrice: '' }],
    dispatchDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dispatchesRes, customersRes, inventoryRes] = await Promise.all([
        salesDispatchAPI.getAll(),
        customersAPI.getAll(),
        inventoryAPI.getAll(),
      ]);
      setDispatches(dispatchesRes.data);
      setCustomers(customersRes.data);
      setInventory(inventoryRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      customerID: '',
      invoiceNumber: '',
      items: [{ itemName: '', quantity: '', unitPrice: '' }],
      dispatchDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantity: '', unitPrice: '' }],
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'itemName') {
      // When item is selected, auto-populate unitPrice from inventory
      const selectedItem = inventory.find(inv => inv.itemName === value);
      newItems[index][field] = value;
      if (selectedItem) {
        newItems[index].unitPrice = selectedItem.unitPrice || 0;
      }
    } else {
      newItems[index][field] = value;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    try {
      // Validate all items have required fields
      for (const item of formData.items) {
        if (!item.itemName || !item.quantity || !item.unitPrice) {
          setError('All items must have a name, quantity, and unit price');
          return;
        }

        // Validate quantity doesn't exceed available stock
        const availableQuantity = getAvailableQuantity(item.itemName);
        if (Number(item.quantity) > availableQuantity) {
          setError(`${item.itemName} only has ${availableQuantity} units available`);
          return;
        }
      }

      const data = {
        customerID: formData.customerID,
        invoiceNumber: formData.invoiceNumber,
        dispatchDate: formData.dispatchDate,
        status: formData.status,
        items: formData.items.map((item) => ({
          itemName: item.itemName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };
      await salesDispatchAPI.create(data);
      setError(null);
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to create dispatch');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await salesDispatchAPI.updateStatus(id, newStatus);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'default',
      Dispatched: 'info',
      Delivered: 'success',
    };
    return colors[status] || 'default';
  };

  const getAvailableQuantity = (itemName) => {
    const item = inventory.find(inv => inv.itemName === itemName);
    return item?.quantity || 0;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Sales Dispatch
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create Dispatch
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Dispatch ID</strong></TableCell>
                <TableCell><strong>Invoice Number</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>Total Amount</strong></TableCell>
                <TableCell><strong>Dispatch Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No dispatches found
                  </TableCell>
                </TableRow>
              ) : (
                dispatches.map((dispatch) => {
                  // Calculate total amount - handle both old format (SKU) and new format (itemName)
                  const totalAmount = dispatch.items?.reduce((sum, item) => {
                    const quantity = Number(item.quantity) || 0;
                    const unitPrice = Number(item.unitPrice) || 0;
                    return sum + (quantity * unitPrice);
                  }, 0) || 0;
                  
                  return (
                    <TableRow key={dispatch._id} hover>
                      <TableCell>{dispatch._id.slice(-8)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {dispatch.invoiceNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{dispatch.customerID?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Box>
                          {dispatch.items?.length > 0 ? (
                            dispatch.items.map((item, idx) => {
                              const itemName = item.itemName || item.SKU || 'N/A';
                              const quantity = Number(item.quantity) || 0;
                              const unitPrice = Number(item.unitPrice) || 0;
                              return (
                                <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                                  {itemName} - Qty: {quantity} @ ${unitPrice.toFixed(2)}
                                </Typography>
                              );
                            })
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No items
                            </Typography>
                          )}
                          <Typography variant="caption" color="textSecondary">
                            {dispatch.items?.length || 0} item(s)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          ${totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(dispatch.dispatchDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={dispatch.status}
                          color={getStatusColor(dispatch.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={dispatch.status}
                          onChange={(e) => handleStatusChange(dispatch._id, e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Sales Dispatch</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Note: Dispatch reduces inventory stock. Create invoice after dispatch.
            </Typography>
            <TextField
              fullWidth
              select
              label="Customer"
              value={formData.customerID}
              onChange={(e) => setFormData({ ...formData, customerID: e.target.value })}
              margin="normal"
              required
            >
              {customers.map((customer) => (
                <MenuItem key={customer._id} value={customer._id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Invoice Number"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Dispatch Date"
              type="date"
              value={formData.dispatchDate}
              onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />

            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Items</Typography>
                <Button size="small" onClick={handleAddItem}>
                  Add Item
                </Button>
              </Box>
              {formData.items.map((item, index) => {
                const availableQuantity = getAvailableQuantity(item.itemName);
                const quantityError = item.quantity && Number(item.quantity) > availableQuantity;
                
                return (
                  <Box key={index} display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <TextField
                        fullWidth
                        select
                        label="Item Name"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        size="small"
                        required
                      >
                        {inventory.map((inv) => (
                          <MenuItem key={inv._id} value={inv.itemName}>
                            {inv.itemName} (Available: {inv.quantity})
                          </MenuItem>
                        ))}
                      </TextField>
                      {item.itemName && (
                        <FormHelperText>
                          Available: {availableQuantity} units
                        </FormHelperText>
                      )}
                    </Box>
                    <Box>
                      <TextField
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        size="small"
                        required
                        error={quantityError}
                        helperText={quantityError ? `Max: ${availableQuantity}` : ''}
                        inputProps={{ min: 1 }}
                      />
                    </Box>
                    <TextField
                      label="Unit Price"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      size="small"
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <IconButton
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <AddIcon sx={{ transform: 'rotate(45deg)' }} />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.customerID || !formData.invoiceNumber || formData.items.some((item) => !item.itemName || !item.quantity || !item.unitPrice)}
          >
            Create Dispatch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
