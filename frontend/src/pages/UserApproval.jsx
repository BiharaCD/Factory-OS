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
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { authAPI } from '../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    user: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes] = await Promise.all([
        authAPI.getPendingUsers(),
        authAPI.getApprovedUsers(),
      ]);
      setPendingUsers(pendingRes.data);
      setApprovedUsers(approvedRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (user) => {
    setConfirmDialog({
      open: true,
      action: 'approve',
      user,
    });
  };

  const handleRejectClick = (user) => {
    setConfirmDialog({
      open: true,
      action: 'reject',
      user,
    });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({
      open: false,
      action: null,
      user: null,
    });
  };

  const handleConfirmAction = async () => {
    try {
      const { action, user } = confirmDialog;

      if (action === 'approve') {
        await authAPI.approveUser(user._id);
        setPendingUsers(pendingUsers.filter((u) => u._id !== user._id));
        setApprovedUsers([user, ...approvedUsers]);
      } else if (action === 'reject') {
        await authAPI.rejectUser(user._id);
        setPendingUsers(pendingUsers.filter((u) => u._id !== user._id));
      }

      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Access Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Approve or reject new user registrations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="user tabs"
        >
          <Tab label={`Pending Approvals (${pendingUsers.length})`} />
          <Tab label={`Approved Users (${approvedUsers.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {pendingUsers.length === 0 ? (
            <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
              No pending user approvals
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Registration Date</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleApproveClick(user)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleRejectClick(user)}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {approvedUsers.length === 0 ? (
            <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
              No approved users yet
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Approved Date</strong></TableCell>
                    <TableCell><strong>Approved By</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.approvedAt)}</TableCell>
                      <TableCell>
                        {user.approvedBy ? (
                          <Chip
                            label={user.approvedBy.name}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'approve' ? 'Approve User' : 'Reject User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            Are you sure you want to{' '}
            <strong>
              {confirmDialog.action === 'approve' ? 'approve' : 'reject'}
            </strong>{' '}
            <strong>{confirmDialog.user?.name}</strong> (
            {confirmDialog.user?.email})?
          </Typography>
          {confirmDialog.action === 'reject' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This user will be permanently removed from the system.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'approve' ? 'success' : 'error'}
          >
            {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
