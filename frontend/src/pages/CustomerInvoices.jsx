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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { customerInvoicesAPI, customersAPI, salesDispatchAPI } from '../services/api';

const STATUSES = ['Draft', 'Issued', 'Paid', 'Overdue'];

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerID: '',
    linkedDispatchID: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [{ SKU: '', quantity: '', unitPrice: '' }],
    status: 'Draft',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, dispatchesRes] = await Promise.all([
        customerInvoicesAPI.getAll(),
        customersAPI.getAll(),
        salesDispatchAPI.getAll(),
      ]);
      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
      setDispatches(dispatchesRes.data);
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
      linkedDispatchID: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      items: [{ SKU: '', quantity: '', unitPrice: '' }],
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
          unitPrice: Number(item.unitPrice) || undefined,
        })),
        linkedDispatchID: formData.linkedDispatchID || undefined,
      };
      await customerInvoicesAPI.create(data);
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await customerInvoicesAPI.updateStatus(id, newStatus);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'default',
      Issued: 'info',
      Paid: 'success',
      Overdue: 'error',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const downloadPDF = (invoice) => {
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.text('FactoryOS', 20, 20);
    doc.setFontSize(10);
    doc.text('Invoice', 20, 28);
    
    // Invoice Details
    doc.setFontSize(9);
    let yPos = 40;
    
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, yPos);
    yPos += 6;
    doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, 20, yPos);
    yPos += 6;
    doc.text(`Status: ${invoice.status}`, 20, yPos);
    yPos += 10;
    
    // Customer Details
    doc.setFontSize(10);
    doc.text('Bill To:', 20, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.text(`Customer: ${invoice.customerID?.name || 'N/A'}`, 20, yPos);
    yPos += 5;
    if (invoice.customerID?.email) {
      doc.text(`Email: ${invoice.customerID.email}`, 20, yPos);
      yPos += 5;
    }
    if (invoice.customerID?.phone) {
      doc.text(`Phone: ${invoice.customerID.phone}`, 20, yPos);
      yPos += 5;
    }
    if (invoice.customerID?.address) {
      doc.text(`Address: ${invoice.customerID.address}`, 20, yPos);
      yPos += 5;
    }
    yPos += 5;
    
    // Items Table
    const tableData = invoice.items?.map((item) => [
      item.SKU || 'N/A',
      item.quantity || 0,
      `$${(item.unitPrice || 0).toFixed(2)}`,
      `$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`,
    ]) || [];
    
    doc.autoTable({
      startY: yPos,
      head: [['Item/SKU', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
    // Calculate total
    const totalAmount = invoice.items?.reduce(
      (sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)),
      0
    ) || 0;
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Total Amount
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 150, yPos);
    
    // Footer
    yPos = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', 20, yPos);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos + 5);
    
    // Download PDF
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Customer Invoices
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create Invoice
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
                <TableCell><strong>Invoice Number</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Invoice Date</strong></TableCell>
                <TableCell><strong>Linked Dispatch</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const totalAmount = invoice.items?.reduce(
                    (sum, item) => sum + (item.quantity * (item.unitPrice || 0)),
                    0
                  ) || 0;
                  return (
                    <TableRow key={invoice._id} hover>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerID?.name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>
                        {invoice.linkedDispatchID?._id
                          ? `Dispatch-${invoice.linkedDispatchID._id.slice(-8)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <TextField
                            select
                            size="small"
                            value={invoice.status}
                            onChange={(e) => handleStatusChange(invoice._id, e.target.value)}
                            sx={{ minWidth: 120 }}
                          >
                            {STATUSES.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </TextField>
                          <IconButton
                            title="Download PDF"
                            onClick={() => downloadPDF(invoice)}
                            size="small"
                            color="primary"
                          >
                            <FileDownloadIcon />
                          </IconButton>
                        </Box>
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
        <DialogTitle>Create Customer Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Note: Invoices do NOT affect inventory. Should reference a Sales Dispatch.
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
              label="Invoice Date"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              select
              label="Linked Dispatch (Optional)"
              value={formData.linkedDispatchID}
              onChange={(e) => setFormData({ ...formData, linkedDispatchID: e.target.value })}
              margin="normal"
            >
              <MenuItem value="">None</MenuItem>
              {dispatches.map((dispatch) => (
                <MenuItem key={dispatch._id} value={dispatch._id}>
                  Dispatch-{dispatch._id.slice(-8)} - {dispatch.customerID?.name || 'N/A'}
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
            disabled={!formData.customerID || !formData.invoiceNumber || formData.items.some((item) => !item.SKU || !item.quantity)}
          >
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
