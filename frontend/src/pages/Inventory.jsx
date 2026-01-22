import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import { inventoryAPI } from '../services/api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newThreshold, setNewThreshold] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const filtered = inventory.filter(
      (item) =>
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.SKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchTerm, inventory]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll();
      setInventory(response.data);
      setFilteredInventory(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const handleEditThreshold = (item) => {
    setSelectedItem(item);
    setNewThreshold(item.threshold || 10);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setNewThreshold('');
  };

  const handleSaveThreshold = async () => {
    try {
      if (newThreshold === '' || isNaN(newThreshold) || newThreshold < 0) {
        setError('Please enter a valid threshold value');
        return;
      }

      await inventoryAPI.updateThreshold(selectedItem._id, {
        threshold: Number(newThreshold),
      });

      // Update local state
      setInventory(inventory.map(item =>
        item._id === selectedItem._id
          ? { ...item, threshold: Number(newThreshold) }
          : item
      ));

      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update threshold');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Inventory
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Read-only view - Inventory changes only through transactions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading inventory: {error}
        </Alert>
      )}

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search by item name, SKU, or item code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Item Code</strong></TableCell>
                <TableCell><strong>Item Name</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                {/*<TableCell><strong>SKU</strong></TableCell>*/}
                {/*<TableCell><strong>Container Type</strong></TableCell>*/}
                <TableCell><strong>Quantity</strong></TableCell>
                <TableCell><strong>Threshold</strong></TableCell>
                <TableCell><strong>Lot Number</strong></TableCell>
                {/*<TableCell><strong>Batch ID</strong></TableCell>*/}
                <TableCell><strong>Expiry Date</strong></TableCell>
                {/*<TableCell><strong>Alcohol Flag</strong></TableCell>*/}
                <TableCell><strong>QC Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item._id} hover>
                    <TableCell>{item.itemCode}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    {/*<TableCell>{item.SKU}</TableCell> */}
                    {/*<TableCell>{item.containerType || 'N/A'}</TableCell>*/}
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{item.threshold || 10}</span>
                        <IconButton
                          size="small"
                          onClick={() => handleEditThreshold(item)}
                          title="Edit threshold"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{item.lotNumber || 'N/A'}</TableCell>
                    {/*<TableCell>{item.batchID || 'N/A'}</TableCell>*/}
                    <TableCell>{formatDate(item.expiryDate)}</TableCell>
                    {/*<TableCell>
                      {item.alcoholFlag ? (
                        <Chip label="Yes" color="warning" size="small" />
                      ) : (
                        <Chip label="No" size="small" />
                      )}
                    </TableCell>*/}
                    <TableCell>
                      <Chip
                        label={item.QCstatus || 'Pass'}
                        color={
                          item.QCstatus === 'Fail' 
                            ? 'error' 
                            : item.QCstatus === 'Check' 
                            ? 'warning' 
                            : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={editDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Edit Threshold</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedItem && (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Item: {selectedItem.itemName}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Threshold Value"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                inputProps={{ min: 0, step: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveThreshold}
            variant="contained"
            disabled={newThreshold === '' || isNaN(newThreshold)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
