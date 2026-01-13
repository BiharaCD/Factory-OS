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
import GetAppIcon from '@mui/icons-material/GetApp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; // missing
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supplierBillsAPI, suppliersAPI, purchaseOrdersAPI, grnAPI } from '../services/api';
//import { deleteSupplierBill } from '../../../backend/controllers/supplierBillController';

const STATUSES = ['Draft', 'Approved', 'Unpaid', 'Paid'];

export default function SupplierBills() {
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({
    supplierID: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    linkedPO: '',
    linkedGRN: '',
    items: [{ SKU: '', quantity: '', unitPrice: '' }],
    status: 'Draft',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, suppliersRes, poRes, grnRes] = await Promise.all([
        supplierBillsAPI.getAll(),
        suppliersAPI.getAll(),
        purchaseOrdersAPI.getAll(),
        grnAPI.getAll(),
      ]);
      setBills(billsRes.data);
      setSuppliers(suppliersRes.data);
      setPurchaseOrders(poRes.data);
      setGrns(grnRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      supplierID: '',
      billNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      linkedPO: '',
      linkedGRN: '',
      items: [{ SKU: '', quantity: '', unitPrice: '' }],
      status: 'Draft',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBill(null);
  };

  const handleStatusDialogOpen = (bill) => {
    setSelectedBill(bill);
    setNewStatus(bill.status);
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setSelectedBill(null);
    setNewStatus('');
  };
//handleDeleteBill
  const handleDeleteBill = async (bill) => {
    try {
      await supplierBillsAPI.delete(bill._id);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await supplierBillsAPI.updateStatus(selectedBill._id, newStatus);
      handleStatusDialogClose();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadPDF = (bill) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 10;

      // Header
      doc.setFontSize(16);
      doc.text('SUPPLIER BILL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Bill Details
      doc.setFontSize(10);
      doc.text(`Bill Number: ${bill.billNumber}`, 10, yPosition);
      yPosition += 6;
      doc.text(`Supplier: ${bill.supplierID?.name || 'N/A'}`, 10, yPosition);
      yPosition += 6;
      doc.text(`Bill Date: ${formatDate(bill.billDate)}`, 10, yPosition);
      yPosition += 6;
      doc.text(`Due Date: ${formatDate(bill.dueDate)}`, 10, yPosition);
      yPosition += 6;
      doc.text(`Status: ${bill.status}`, 10, yPosition);
      yPosition += 10;

      // Items Table
      doc.text('Items:', 10, yPosition);
      yPosition += 6;

      const tableData = bill.items.map((item) => [
        item.SKU,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `$${(item.quantity * item.unitPrice).toFixed(2)}`,
      ]);

      doc.autoTable({
        head: [['SKU', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        startY: yPosition,
        margin: 10,
      });

      // Total Amount
      const totalAmount = bill.items?.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice || 0),
        0
      ) || 0;

      yPosition = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 10, yPosition);

      // Save PDF
      doc.save(`supplier-bill-${bill.billNumber}.pdf`);
    } catch (err) {
      setError('Failed to generate PDF');
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { SKU: '', quantity: '', unitPrice: '' }],
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
          SKU: item.SKU,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        linkedPO: formData.linkedPO || undefined,
        linkedGRN: formData.linkedGRN || undefined,
        dueDate: formData.dueDate || undefined,
      };
      await supplierBillsAPI.create(data);
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'default',
      Approved: 'info',
      Unpaid: 'warning',
      Paid: 'success',
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
          Supplier Bills
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create Bill
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
                <TableCell><strong>Bill Number</strong></TableCell>
                <TableCell><strong>Supplier</strong></TableCell>
                <TableCell><strong>Bill Date</strong></TableCell>
                <TableCell><strong>Due Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No supplier bills found
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => {
                  const totalAmount = bill.items?.reduce(
                    (sum, item) => sum + (item.quantity * item.unitPrice || 0),
                    0
                  ) || 0;
                  return (
                    <TableRow key={bill._id} hover>
                      <TableCell>{bill.billNumber}</TableCell>
                      <TableCell>{bill.supplierID?.name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(bill.billDate)}</TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={bill.status}
                          color={getStatusColor(bill.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${totalAmount.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusDialogOpen(bill)}
                          title="Update Status"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteBill(bill)}
                          title="delete Bill"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(bill)}
                          title="Download PDF"
                        >
                          <GetAppIcon fontSize="small" />
                        </IconButton>
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
        <DialogTitle>Create Supplier Bill</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Note: Bills do NOT affect inventory. Can be linked to PO/GRN or created directly for services.
            </Typography>
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
            <TextField
              fullWidth
              label="Bill Number"
              value={formData.billNumber}
              onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Bill Date"
              type="date"
              value={formData.billDate}
              onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label="Linked Purchase Order (Optional)"
              value={formData.linkedPO}
              onChange={(e) => setFormData({ ...formData, linkedPO: e.target.value })}
              margin="normal"
            >
              <MenuItem value="">None</MenuItem>
              {purchaseOrders.map((po) => (
                <MenuItem key={po._id} value={po._id}>
                  PO-{po._id.slice(-8)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Linked GRN (Optional)"
              value={formData.linkedGRN}
              onChange={(e) => setFormData({ ...formData, linkedGRN: e.target.value })}
              margin="normal"
            >
              <MenuItem value="">None</MenuItem>
              {grns.map((grn) => (
                <MenuItem key={grn._id} value={grn._id}>
                  GRN-{grn._id.slice(-8)}
                </MenuItem>
              ))}
            </TextField>

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
                    value={item.SKU}
                    onChange={(e) => handleItemChange(index, 'SKU', e.target.value)}
                    size="small"
                    required
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.supplierID || !formData.billNumber || formData.items.some((item) => !item.SKU || !item.quantity || !item.unitPrice)}
          >
            Create Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Update Bill Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
            handleDeleteBill(selectedBill);
            handleStatusDialogClose();
          }} variant="contained">
            Delete Bill
          </Button>

          <Button onClick={handleStatusUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
