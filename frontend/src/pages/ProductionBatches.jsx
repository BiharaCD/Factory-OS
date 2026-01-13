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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { productionBatchesAPI } from '../services/api';

const STATUSES = ['Opened', 'In-Process', 'QC', 'Filling', 'Sealed', 'Labeled', 'SecondaryPacked', 'Closed'];

export default function ProductionBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    batchID: '',
    SKU: '',
    containerType: '',
    alcoholFlag: false,
    status: 'Opened',
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await productionBatchesAPI.getAll();
      setBatches(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      batchID: '',
      SKU: '',
      containerType: '',
      alcoholFlag: false,
      QCresult: 'Pass',
      status: 'Opened',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      await productionBatchesAPI.create(formData);
      handleClose();
      fetchBatches();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await productionBatchesAPI.updateStatus(id, newStatus);
      fetchBatches();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQCresultChange = async (id, newQCresult) => {
    try {
      await productionBatchesAPI.updateQCresult(id, newQCresult);
      fetchBatches();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Opened: 'default',
      'In-Process': 'info',
      QC: 'warning',
      Filling: 'primary',
      Sealed: 'secondary',
      Labeled: 'success',
      SecondaryPacked: 'success',
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
          Production Batches
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Create Batch
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
                <TableCell><strong>Batch ID</strong></TableCell>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Container Type</strong></TableCell>
                <TableCell><strong>Alcohol Flag</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>QC Result</strong></TableCell>
                <TableCell><strong>Created Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No production batches found
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch._id} hover>
                    <TableCell>{batch.batchID}</TableCell>
                    <TableCell>{batch.SKU}</TableCell>
                    <TableCell>{batch.containerType || 'N/A'}</TableCell>
                    <TableCell>
                      {batch.alcoholFlag ? (
                        <Chip label="Yes" color="warning" size="small" />
                      ) : (
                        <Chip label="No" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={batch.status}
                        color={getStatusColor(batch.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={batch.QCresult || 'Pass'}
                        color={batch.QCresult === 'Fail' ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(batch.createdAt)}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={batch.status}
                        onChange={(e) => handleStatusChange(batch._id, e.target.value)}
                        sx={{ minWidth: 150 }}
                      >
                        {STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        value={batch.QCresult || "Pass"} // Default to 'Pass' if undefined
                        onChange={(e) => handleQCresultChange(batch._id, e.target.value)}
                        sx={{ minWidth: 150 }}
                        >
                        {["Pass", "Fail"].map((result) => (
                        <MenuItem key={result} value={result}>
                            {result}
                          </MenuItem>
                        ))}
                      </TextField>      
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Production Batch</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Production batches track the manufacturing workflow. Formulation details are protected.
            </Typography>
            <TextField
              fullWidth
              label="Batch ID"
              value={formData.batchID}
              onChange={(e) => setFormData({ ...formData, batchID: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="SKU"
              value={formData.SKU}
              onChange={(e) => setFormData({ ...formData, SKU: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Container Type"
              value={formData.containerType}
              onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
              margin="normal"
              placeholder="e.g., Glass, Aluminium"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.alcoholFlag}
                  onChange={(e) => setFormData({ ...formData, alcoholFlag: e.target.checked })}
                />
              }
              label="Alcohol Product (Excise Controlled)"
            />
            <TextField
              fullWidth
              select
              label="QC Result"
              value={formData.QCresult}
              onChange={(e) => setFormData({ ...formData, QCresult: e.target.value })}
              margin="normal"
              >
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
            disabled={!formData.batchID || !formData.SKU}
          >
            Create Batch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
