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
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { purchaseOrdersAPI, suppliersAPI } from '../services/api';

const STATUSES = ['Draft', 'Approved', 'Sent', 'Partially Received', 'Closed'];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    poNumber: '',
    supplierID: '',
    items: [{ itemName: '', quantity: '', unitPrice: '' }],
    expectedDeliveryDate: '',
    status: 'Draft',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes] = await Promise.all([
        purchaseOrdersAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      poNumber: '',
      supplierID: '',
      items: [{ itemName: '', quantity: '', unitPrice: '' }],
      expectedDeliveryDate: '',
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
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        items: formData.items.map((item) => ({
          itemName: item.itemName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      };
      await purchaseOrdersAPI.create(data);
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchaseOrdersAPI.delete(id);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDownloadPDF = (order) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });
    
    // PO Details
    doc.setFontSize(12);
    doc.text(`PO Number: ${order.poNumber}`, 14, 35);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 42);
    doc.text(`Status: ${order.status}`, 14, 49);
    
    // Supplier Details
    if (order.supplierID) {
      doc.setFontSize(12);
      doc.text('Supplier Information:', 14, 60);
      doc.setFontSize(10);
      doc.text(`Name: ${order.supplierID.name || 'N/A'}`, 14, 67);
      if (order.supplierID.address) {
        doc.text(`Address: ${order.supplierID.address}`, 14, 74);
      }
      if (order.supplierID.phone) {
        doc.text(`Phone: ${order.supplierID.phone}`, 14, 81);
      }
      if (order.supplierID.email) {
        doc.text(`Email: ${order.supplierID.email}`, 14, 88);
      }
    }
    
    // Expected Delivery Date
    if (order.expectedDeliveryDate) {
      doc.setFontSize(12);
      doc.text(`Expected Delivery: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}`, 14, 100);
    }
    
    // Items Table
    const tableData = order.items?.map((item, index) => [
      index + 1,
      item.itemName || 'N/A',
      item.quantity || 0,
      `$${item.unitPrice?.toFixed(2) || '0.00'}`,
      `$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`
    ]) || [];
    
    const totalAmount = order.items?.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;
    
    doc.autoTable({
      startY: 110,
      head: [['#', 'Item Name', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 }
      }
    });
    
    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, finalY);
    
    // Save the PDF
    doc.save(`PO-${order.poNumber}.pdf`);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await purchaseOrdersAPI.updateStatus(id, newStatus);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'default',
      Approved: 'info',
      Sent: 'primary',
      'Partially Received': 'warning',
      Closed: 'success',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Purchase Orders
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create PO
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
                <TableCell><strong>PO ID</strong></TableCell>
                <TableCell><strong>Supplier</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>Expected Delivery</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>{order.poNumber}</TableCell>
                    <TableCell>
                      {order.supplierID?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {order.items?.length || 0} item(s)
                    </TableCell>
                    <TableCell>{formatDate(order.expectedDeliveryDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} alignItems="center">
                        <TextField
                          select
                          size="small"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </TextField>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadPDF(order)}
                          title="Download PDF"
                        >
                          <PictureAsPdfIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(order._id)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* PO Number */}
            <TextField
              fullWidth
              label="PO Number"
              value={formData.poNumber || ''}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              margin="normal"
              required
            />

            {/* Supplier */}
            <TextField
              fullWidth
              select
              label="Supplier"
              value={formData.supplierID}
              onChange={(e) => setFormData({ ...formData, supplierID: e.target.value })}
              margin="normal"
              required
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Items */}
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Items</Typography>
                <Button size="small" onClick={handleAddItem}>
                  Add Item
                </Button>
              </Box>
              {formData.items.map((item, index) => (
                <Box key={index} display="flex" gap={2} mb={2}>
                  <TextField
                    label="Item Name"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                    size="small"
                    required
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    size="small"
                    required
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    size="small"
                    required
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

            {/* Expected Delivery Date */}
            <TextField
              fullWidth
              label="Expected Delivery Date"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.poNumber ||
              !formData.supplierID ||
              formData.items.some((item) => !item.itemName || !item.quantity || !item.unitPrice)
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
