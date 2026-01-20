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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { grnAPI, purchaseOrdersAPI } from '../services/api';

const STATUSES = ['Draft', 'Approved', 'Partially Received', 'Closed'];

export default function GRN() {
  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    poID: '',
    items: [{ itemName: '', quantityReceived: '', lotNumber: '', expiryDate: '' }],
    QC: 'Check',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grnsRes, poRes] = await Promise.all([
        grnAPI.getAll(),
        purchaseOrdersAPI.getAll(),
      ]);
      setGrns(grnsRes.data);
      setPurchaseOrders(poRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      poID: '',
      items: [{ itemName: '', quantityReceived: '', lotNumber: '', expiryDate: '' }],
      QC: 'Check',
    });
    setOpen(true);
  };

  const handlePOChange = (poId) => {
    const selectedPO = purchaseOrders.find(po => po._id === poId);
    if (selectedPO && selectedPO.items) {
      // Pre-populate items from the selected Purchase Order
      const poItems = selectedPO.items.map(item => ({
        itemName: item.itemName || '',
        quantityReceived: Number(item.quantity || 0),
        lotNumber: '',
        expiryDate: '',
      }));
      setFormData({
        ...formData,
        poID: poId,
        items: poItems.length > 0 ? poItems : [{ itemName: '', quantityReceived: '', lotNumber: '', expiryDate: '' }],
      });
    } else {
      setFormData({
        ...formData,
        poID: poId,
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantityReceived: '', lotNumber: '', expiryDate: '' }],
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.poID) {
        setError('Please select a Purchase Order');
        return;
      }

      if (!formData.QC) {
        setError('Please select QC Status');
        return;
      }

      if (formData.items.some((item) => !item.itemName || !item.quantityReceived)) {
        setError('All items must have a name and quantity');
        return;
      }

      const data = {
        poID: formData.poID,
        items: formData.items.map((item) => ({
          itemName: item.itemName,
          quantityReceived: Number(item.quantityReceived),
          ...(item.lotNumber && { lotNumber: item.lotNumber }),
          ...(item.expiryDate && { expiryDate: item.expiryDate }),
        })),
        QC: formData.QC,
      };
      
      await grnAPI.create(data);
      setError(null);
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create GRN');
    }
  };

  const getQCColor = (qc) => {
    const colors = {
      Pass: 'success',
      Fail: 'error',
      Check: 'warning',
    };
    return colors[qc] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Goods Receipt Notes (GRN)
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create GRN
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
                <TableCell><strong>GRN Number</strong></TableCell>
                <TableCell><strong>Purchase Order</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>QC</strong></TableCell>
                <TableCell><strong>Created Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No GRNs found
                  </TableCell>
                </TableRow>
              ) : (
                grns.map((grn) => (
                  <TableRow key={grn._id} hover>
                    <TableCell>{grn.grnNumber || grn._id.slice(-8)}</TableCell>
                    <TableCell>
                      {grn.poID?.poNumber || (grn.poID?._id ? `PO-${grn.poID._id.slice(-8)}` : 'N/A')}
                    </TableCell>
                    <TableCell>
                      {grn.items?.length || 0} item(s)
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={grn.QC || 'Check'}
                        color={getQCColor(grn.QC)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(grn.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Goods Receipt Note</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Note: GRN increases inventory. Must reference a Purchase Order.
            </Typography>
            <TextField
              fullWidth
              select
              label="Purchase Order"
              value={formData.poID}
              onChange={(e) => handlePOChange(e.target.value)}
              margin="normal"
              required
            >
              {purchaseOrders.map((po) => (
                <MenuItem key={po._id} value={po._id}>
                  {po.poNumber || `PO-${po._id.slice(-8)}`} - {po.supplierID?.name || 'N/A'}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Received Items</Typography>
                <Button size="small" onClick={handleAddItem}>
                  Add Item
                </Button>
              </Box>
              {formData.items.map((item, index) => (
                <Box key={index} display="flex" gap={1} mb={2} flexWrap="wrap">
                  <TextField
                    label="Item Name"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                    size="small"
                    required
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="Quantity Received"
                    type="number"
                    value={item.quantityReceived}
                    onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                    size="small"
                    required
                  />
                  <TextField
                    label="Lot Number"
                    value={item.lotNumber}
                    onChange={(e) => handleItemChange(index, 'lotNumber', e.target.value)}
                    size="small"
                  />
                  <TextField
                    label="Expiry Date"
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <IconButton
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    <AddIcon sx={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* QC Status Field */}
            <TextField
              fullWidth
              select
              label="QC Status"
              value={formData.QC}
              onChange={(e) => setFormData({ ...formData, QC: e.target.value })}
              margin="normal"
              required
            >
              <MenuItem value="Check">Check</MenuItem>
              <MenuItem value="Pass">Pass</MenuItem>
              <MenuItem value="Fail">Fail</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.poID || !formData.QC || formData.items.some((item) => !item.itemName || !item.quantityReceived)}
          >
            Create GRN
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
