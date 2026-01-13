# FactoryOS Frontend

A modern React-based frontend for the FactoryOS Inventory, Production & Sales Automation System.

## Features

- **Dashboard**: Overview statistics and system information
- **Inventory Management**: Read-only view of inventory items (changes only through transactions)
- **Suppliers & Customers**: Full CRUD operations for supplier and customer management
- **Purchase Orders**: Create and manage purchase orders with status workflow
- **GRN (Goods Receipt Notes)**: Create GRNs linked to Purchase Orders (increases inventory)
- **Supplier Bills**: Manage supplier bills with optional PO/GRN linking
- **Production Batches**: Track production workflow with status management
- **Sales Dispatch**: Create dispatches that reduce inventory
- **Customer Invoices**: Create invoices linked to dispatches (does not affect inventory)

## Technology Stack

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Material-UI (MUI)**: Component library for UI
- **Axios**: HTTP client for API calls
- **Vite**: Fast build tool and dev server

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Build for Production

Build the production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Configuration

The frontend is configured to proxy API requests to `http://localhost:5001` by default. This can be changed in `vite.config.js`.

To use a different API URL, create a `.env` file:
```
VITE_API_URL=http://your-api-url:port/api
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.jsx   # Main layout with navigation
│   ├── pages/          # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── Suppliers.jsx
│   │   ├── Customers.jsx
│   │   ├── PurchaseOrders.jsx
│   │   ├── GRN.jsx
│   │   ├── SupplierBills.jsx
│   │   ├── ProductionBatches.jsx
│   │   ├── SalesDispatch.jsx
│   │   └── CustomerInvoices.jsx
│   ├── services/       # API service layer
│   │   └── api.js       # API client functions
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Key Features

### Inventory Controls
- Inventory is read-only in the UI
- All inventory changes occur through transactions:
  - GRN (Goods Receipt) - increases stock
  - Production Output - creates finished goods
  - Issue to Production - consumes raw materials
  - Dispatch - reduces stock

### Status Workflows
- Purchase Orders: Draft → Approved → Sent → Partially Received → Closed
- Production Batches: Opened → In-Process → QC → Filling → Sealed → Labeled → SecondaryPacked → Closed
- Sales Dispatch: Draft → Dispatched → Delivered
- Invoices: Draft → Issued → Paid / Overdue

### Data Relationships
- GRN must reference a Purchase Order
- Supplier Bills can optionally link to PO/GRN
- Customer Invoices should reference Sales Dispatch
- Production Batches track SKU and container type

## Notes

- The frontend assumes the backend API is running on port 5001
- All API endpoints are prefixed with `/api`
- The system follows a ledger-based approach where inventory changes only occur through transactions
- Formulation details are protected and not visible in the production batch UI
