import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Factory as FactoryIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { inventoryAPI, purchaseOrdersAPI, productionBatchesAPI, salesDispatchAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    inventory: { total: 0, loading: true },
    purchaseOrders: { total: 0, loading: true },
    productionBatches: { total: 0, loading: true },
    salesDispatch: { total: 0, loading: true },
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [inventoryRes, poRes, batchesRes, dispatchRes] = await Promise.all([
          inventoryAPI.getAll(),
          purchaseOrdersAPI.getAll(),
          productionBatchesAPI.getAll(),
          salesDispatchAPI.getAll(),
        ]);

        setStats({
          inventory: { total: inventoryRes.data.length, loading: false },
          purchaseOrders: { total: poRes.data.length, loading: false },
          productionBatches: { total: batchesRes.data.length, loading: false },
          salesDispatch: { total: dispatchRes.data.length, loading: false },
        });
      } catch (err) {
        setError(err.message);
        setStats({
          inventory: { loading: false },
          purchaseOrders: { loading: false },
          productionBatches: { loading: false },
          salesDispatch: { loading: false },
        });
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4">
              {value === undefined ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading dashboard data: {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inventory Items"
            value={stats.inventory.total}
            icon={<InventoryIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Purchase Orders"
            value={stats.purchaseOrders.total}
            icon={<ShoppingCartIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Production Batches"
            value={stats.productionBatches.total}
            icon={<FactoryIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sales Dispatches"
            value={stats.salesDispatch.total}
            icon={<LocalShippingIcon />}
            color="info.main"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              FactoryOS is a comprehensive inventory, production, and sales automation system
              designed for beverage manufacturing. The system ensures full traceability,
              compliance, and data-driven decision-making.
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              <strong>Key Features:</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" component="div">
              <ul>
                <li>Ledger-based inventory management with transaction-only updates</li>
                <li>Batch tracking for full traceability</li>
                <li>Production workflow management</li>
                <li>Purchase Orders and Goods Receipt Notes (GRN)</li>
                <li>Supplier Bills and Customer Invoices</li>
                <li>Sales Dispatch management</li>
                <li>Alcohol product controls and excise compliance</li>
              </ul>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
