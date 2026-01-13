import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InsightsIcon from '@mui/icons-material/Insights';
import { inventoryAPI } from '../services/api';

const COLORS = {
  raw: '#0088FE',
  packaging: '#00C49F',
  finished: '#FFBB28',
  critical: '#FF4444',
  warning: '#FFA500',
  safe: '#00C49F',
};

// Calculate days until expiry
const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get expiry risk color
const getExpiryRiskColor = (daysUntilExpiry) => {
  if (daysUntilExpiry === null) return COLORS.safe;
  if (daysUntilExpiry < 0) return COLORS.critical; // Expired
  if (daysUntilExpiry <= 7) return COLORS.critical; // Critical
  if (daysUntilExpiry <= 30) return COLORS.warning; // Warning
  return COLORS.safe; // Safe
};

// Calculate batch age in days
const getBatchAge = (createdAt) => {
  if (!createdAt) return 0;
  const today = new Date();
  const created = new Date(createdAt);
  const diffTime = today - created;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// AI Prediction: Calculate days of stock left
const calculateDaysOfStockLeft = (item, allInventory) => {
  // Simple heuristic: assume average consumption based on category
  // In a real system, this would use historical consumption data
  const avgDailyConsumption = {
    'Raw Material': 0.5,
    'Packaging': 0.3,
    'Finished Goods': 0.2,
  };
  
  const consumption = avgDailyConsumption[item.category] || 0.5;
  if (consumption === 0 || item.quantity === 0) return null;
  
  const daysLeft = Math.floor(item.quantity / consumption);
  return daysLeft;
};

// Safety stock threshold (10% of average quantity or minimum 10 units)
const getSafetyStockThreshold = (item, categoryAvg) => {
  return Math.max(10, categoryAvg * 0.1);
};

export default function InventoryIntelligence() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll();
      setInventory(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process data for visualizations
  const processedData = useMemo(() => {
    if (!inventory.length) return null;

    // 1. Stock by Category
    const categoryData = inventory.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, quantity: 0 };
      }
      acc[category].value += item.quantity || 0;
      acc[category].quantity += item.quantity || 0;
      return acc;
    }, {});

    const stockByCategory = Object.values(categoryData).map((cat) => ({
      name: cat.name,
      value: cat.value,
    }));

    // 2. Batch-wise Aging
    const batchAging = inventory
      .filter((item) => item.batchID || item.createdAt)
      .map((item) => ({
        name: item.itemName?.substring(0, 20) || item.itemCode || 'Unknown',
        age: getBatchAge(item.createdAt),
        quantity: item.quantity || 0,
        batchID: item.batchID || 'N/A',
      }))
      .sort((a, b) => b.age - a.age)
      .slice(0, 10); // Top 10 oldest batches

    // 3. Lot Expiry Timeline
    const expiryData = inventory
      .filter((item) => item.expiryDate)
      .map((item) => {
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
        return {
          name: item.itemName?.substring(0, 20) || item.itemCode || 'Unknown',
          daysUntilExpiry,
          quantity: item.quantity || 0,
          expiryDate: item.expiryDate,
          risk: getExpiryRiskColor(daysUntilExpiry),
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 15); // Next 15 expiring items

    // 4. Safety Stock Breaches
    const categoryAverages = inventory.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += item.quantity || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    const categoryAvgs = Object.keys(categoryAverages).reduce((acc, cat) => {
      acc[cat] = categoryAverages[cat].total / categoryAverages[cat].count;
      return acc;
    }, {});

    const safetyStockBreaches = inventory
      .map((item) => {
        const category = item.category || 'Other';
        const threshold = getSafetyStockThreshold(item, categoryAvgs[category] || 0);
        const daysLeft = calculateDaysOfStockLeft(item, inventory);
        return {
          ...item,
          threshold,
          isBreach: (item.quantity || 0) < threshold,
          daysLeft,
          daysUntilExpiry: getDaysUntilExpiry(item.expiryDate),
        };
      })
      .filter((item) => item.isBreach)
      .sort((a, b) => a.quantity - b.quantity);

    // 5. AI Insights
    const insights = [];
    
    // Critical stock insights
    safetyStockBreaches.slice(0, 5).forEach((item) => {
      if (item.daysLeft !== null && item.daysLeft <= 14) {
        insights.push({
          type: 'critical',
          message: `${item.itemName} will reach critical level in ${item.daysLeft} days`,
          item: item.itemName,
          daysLeft: item.daysLeft,
        });
      }
    });

    // Expiry insights
    expiryData
      .filter((item) => item.daysUntilExpiry <= 30 && item.daysUntilExpiry > 0)
      .slice(0, 3)
      .forEach((item) => {
        insights.push({
          type: 'expiry',
          message: `${item.name} expires in ${item.daysUntilExpiry} days`,
          item: item.name,
          daysUntilExpiry: item.daysUntilExpiry,
        });
      });

    return {
      stockByCategory,
      batchAging,
      expiryData,
      safetyStockBreaches,
      insights,
    };
  }, [inventory]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error loading inventory data: {error}
      </Alert>
    );
  }

  if (!processedData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No inventory data available
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <InsightsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Inventory Intelligence Dashboard
        </Typography>
      </Box>

      {/* AI Insights Section */}
      {processedData.insights.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <InsightsIcon />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                AI Insights
              </Typography>
            </Box>
            <List>
              {processedData.insights.map((insight, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {insight.type === 'critical' ? (
                      <WarningIcon sx={{ color: COLORS.critical }} />
                    ) : (
                      <ScheduleIcon sx={{ color: COLORS.warning }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={insight.message}
                    secondary={
                      insight.type === 'critical'
                        ? `Current stock: ${inventory.find((i) => i.itemName === insight.item)?.quantity || 0} units`
                        : `Quantity: ${inventory.find((i) => i.itemName === insight.item)?.quantity || 0} units`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Stock by Category */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedData.stockByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {processedData.stockByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name.toLowerCase().includes('raw')
                            ? COLORS.raw
                            : entry.name.toLowerCase().includes('packaging')
                            ? COLORS.packaging
                            : entry.name.toLowerCase().includes('finished')
                            ? COLORS.finished
                            : COLORS.safe
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Safety Stock Breaches */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Safety Stock Breach Alerts
              </Typography>
              {processedData.safetyStockBreaches.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">No safety stock breaches</Typography>
                </Box>
              ) : (
                <Box>
                  {processedData.safetyStockBreaches.slice(0, 5).map((item, index) => {
                    const daysLeft = calculateDaysOfStockLeft(item, inventory);
                    return (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          mb: 1,
                          bgcolor: 'error.light',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {item.itemName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Current: {item.quantity} | Threshold: {item.threshold.toFixed(0)}
                          </Typography>
                          {daysLeft !== null && (
                            <Chip
                              label={`${daysLeft} days left`}
                              size="small"
                              color={daysLeft <= 7 ? 'error' : daysLeft <= 14 ? 'warning' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                        <WarningIcon sx={{ color: COLORS.critical }} />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Batch-wise Aging */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Batch-wise Aging (Top 10)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.batchAging}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={10}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="age" fill={COLORS.raw} name="Age (days)" />
                  <Bar dataKey="quantity" fill={COLORS.packaging} name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Lot Expiry Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lot Expiry Timeline (Next 15)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.expiryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    fontSize={10}
                  />
                  <Tooltip
                    formatter={(value) => `${value} days`}
                    labelFormatter={(label) => `Item: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="daysUntilExpiry"
                    name="Days Until Expiry"
                    fill="#8884d8"
                  >
                    {processedData.expiryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.risk} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Box mt={2} display="flex" gap={2} justifyContent="center">
                <Chip
                  label="Critical (≤7 days)"
                  size="small"
                  sx={{ bgcolor: COLORS.critical, color: 'white' }}
                />
                <Chip
                  label="Warning (8-30 days)"
                  size="small"
                  sx={{ bgcolor: COLORS.warning, color: 'white' }}
                />
                <Chip
                  label="Safe (>30 days)"
                  size="small"
                  sx={{ bgcolor: COLORS.safe, color: 'white' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Expiry Risk Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expiry Risk Analysis
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Item Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Quantity</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Expiry Date</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Days Until Expiry</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Risk Level</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Days of Stock Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory
                      .map((item) => {
                        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                        const daysLeft = calculateDaysOfStockLeft(item, inventory);
                        const riskColor = getExpiryRiskColor(daysUntilExpiry);
                        return {
                          ...item,
                          daysUntilExpiry,
                          daysLeft,
                          riskColor,
                        };
                      })
                      .sort((a, b) => {
                        // Sort by expiry risk first, then by days left
                        if (a.daysUntilExpiry === null && b.daysUntilExpiry === null) return 0;
                        if (a.daysUntilExpiry === null) return 1;
                        if (b.daysUntilExpiry === null) return -1;
                        return a.daysUntilExpiry - b.daysUntilExpiry;
                      })
                      .slice(0, 20)
                      .map((item, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor:
                              item.daysUntilExpiry !== null && item.daysUntilExpiry <= 7
                                ? '#ffebee'
                                : item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30
                                ? '#fff3e0'
                                : 'transparent',
                          }}
                        >
                          <td style={{ padding: '8px' }}>{item.itemName}</td>
                          <td style={{ padding: '8px' }}>{item.quantity || 0}</td>
                          <td style={{ padding: '8px' }}>
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {item.daysUntilExpiry !== null
                              ? `${item.daysUntilExpiry} days`
                              : 'N/A'}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Chip
                              label={
                                item.daysUntilExpiry === null
                                  ? 'Safe'
                                  : item.daysUntilExpiry < 0
                                  ? 'Expired'
                                  : item.daysUntilExpiry <= 7
                                  ? 'Critical'
                                  : item.daysUntilExpiry <= 30
                                  ? 'Warning'
                                  : 'Safe'
                              }
                              size="small"
                              sx={{
                                bgcolor: item.riskColor,
                                color: 'white',
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            {item.daysLeft !== null ? (
                              <Chip
                                label={`${item.daysLeft} days`}
                                size="small"
                                color={
                                  item.daysLeft <= 7
                                    ? 'error'
                                    : item.daysLeft <= 14
                                    ? 'warning'
                                    : 'default'
                                }
                              />
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
