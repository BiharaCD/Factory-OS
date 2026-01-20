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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { inventoryAPI } from '../services/api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
                {/*<TableCell><strong>SKU</strong></TableCell>*/}
                {/*<TableCell><strong>Category</strong></TableCell>*/}
                {/*<TableCell><strong>Container Type</strong></TableCell>*/}
                <TableCell><strong>Quantity</strong></TableCell>
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
                    {/*<TableCell>{item.SKU}</TableCell> */}
                    {/*<TableCell>{item.category}</TableCell>*/}
                    {/*<TableCell>{item.containerType || 'N/A'}</TableCell>*/}
                    <TableCell>{item.quantity}</TableCell>
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
    </Box>
  );
}
