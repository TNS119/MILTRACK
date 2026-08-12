# 🛡️ MILTRACK — Military Asset Management System

An enterprise-grade system for tracking vehicles, weapons, and ammunition across multiple military bases with full RBAC, real-time inventory math, and audit trails.

---

## 📐 Inventory Model

```
Closing Balance = Opening Balance + Net Movement − Assigned − Expended
Net Movement    = Purchases + Transfers In − Transfers Out
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- A PostgreSQL instance (Neon/Supabase recommended — free tier works)

### 1. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL` to your Neon/Supabase connection string:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

### 2. Initialize the Database

Run the schema SQL against your PostgreSQL instance (use the Neon/Supabase SQL editor):

```sql
-- Paste contents of backend/sql/schema.sql
```

Then seed demo data:

```bash
npm install
npm run seed
```

The seed script prints all login credentials to the console.

### 3. Start the Backend

```bash
npm run dev
# → Server listening on http://localhost:5000
# → Health check: GET http://localhost:5000/health
```

### 4. Start the Frontend

```bash
cd ../frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

---

## 🔑 Sample Test Accounts

| Role | Username | Password | Base Access |
|---|---|---|---|
| **Admin** | `admin_user` | `AdminPass123!` | All Bases (Global) |
| **Base Commander** | `commander_north` | `CommandPass123!` | Northern Command Base (Base #1) only |
| **Logistics Officer** | `logistics_officer` | `LogisticsPass123!` | Global Ops |

---

## 🏗️ Project Structure

```
military-asset-management/
├── backend/
│   ├── config/db.js              # PostgreSQL pool (pg)
│   ├── controllers/              # Business logic
│   │   ├── authController.js     # HTTP-only dynamic cookies
│   │   ├── assetController.js    # Dashboard aggregation (CTEs) & Inventory
│   │   ├── purchaseController.js
│   │   ├── transferController.js # Atomic BEGIN/COMMIT transactions
│   │   ├── assignmentController.js
│   │   └── expenditureController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── rbacMiddleware.js     # Role + base-scope enforcement
│   │   └── loggerMiddleware.js   # Morgan request logger
│   ├── routes/                   # Express routers (8 files)
│   ├── services/
│   │   ├── auditService.js       # Shared audit log writer
│   │   └── stockService.js       # Live transactional stock calculator
│   ├── sql/schema.sql            # Full DDL (8 tables + 10 indexes)
│   ├── seed.js                   # Relative dynamic Indian military seeder
│   └── server.js                 # Express app entry point (trust proxy, CORS)
│
└── frontend/
    ├── src/
        ├── components/
        │   ├── Navbar.jsx        # Command badge bar
        │   ├── Sidebar.jsx       # RBAC-driven navigation links
        │   ├── StatCard.jsx
        │   ├── NetMoveModal.jsx  # Recharts breakdown modal
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Login.jsx         # Military-themed auth page
        │   ├── Dashboard.jsx     # 5 stat cards + bar chart + filters
        │   ├── Purchases.jsx     # Log & view purchases
        │   ├── Transfers.jsx     # Stock-capped inter-base transfers
        │   ├── Assignments.jsx   # Stock-capped Assignments + Expenditures
        │   ├── AuditLogs.jsx     # Admin-only audit logs inspector
        │   └── Inventory.jsx     # Global/Base inventory details page
        ├── context/AuthContext.jsx
        └── services/api.js       # Axios + Cookies interceptors
    └── tailwind.config.js
```

---

## 🔐 RBAC Authorization Matrix

| Endpoint | ADMIN | BASE_COMMANDER | LOGISTICS_OFFICER |
|---|---|---|---|
| Dashboard (all bases) | ✅ | ✅ (own base only) | ✅ |
| Purchases — create | ✅ | ❌ | ✅ |
| Purchases — read | ✅ | ✅ (own base) | ✅ |
| Transfers — create | ✅ | ❌ | ✅ |
| Transfers — read | ✅ | ✅ (own base) | ✅ |
| Assignments — CRUD | ✅ | ✅ (own base) | ❌ |
| Expenditures — CRUD | ✅ | ✅ (own base) | ❌ |
| Audit Logs | ✅ | ❌ | ❌ |
| Base Inventory | ✅ | ✅ (own base) | ❌ |

---

## 📡 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login → JWT Cookie |
| POST | `/api/auth/logout` | 🔒 | Clear session |
| GET | `/api/auth/me` | 🔒 | Current user profile |
| GET | `/api/assets/dashboard` | 🔒 | Inventory metrics (filterable) |
| GET | `/api/assets/stock` | 🔒 | Available stock level check |
| GET | `/api/assets/inventory` | Admin, Commander | Detailed base equipment inventory |
| GET | `/api/bases` | 🔒 | All bases (for dropdowns) |
| GET | `/api/equipment-types` | 🔒 | All equipment types |
| POST | `/api/purchases` | Admin, Logistics | Log new stock |
| GET | `/api/purchases` | 🔒 | Purchase history |
| POST | `/api/transfers` | Admin, Logistics | Create transfer (atomic) |
| GET | `/api/transfers` | 🔒 | Transfer history |
| POST | `/api/assignments` | Admin, Commander | Assign to unit |
| GET | `/api/assignments` | 🔒 | Assignment history |
| POST | `/api/expenditures` | Admin, Commander | Record expenditure |
| GET | `/api/expenditures` | 🔒 | Expenditure history |
| GET | `/api/audit-logs` | Admin | System audit logs list |
| GET | `/health` | Public | Health check |

---

## 🛑 Negative Stock Prevention & Visual Checks

The application strictly guards against negative inventory levels:
1. **Dropdown Disabling**: In the Transfer and Field Operations forms, selecting a base updates the equipment options to display available quantities (e.g. `INSAS Rifle (Available: 80)`). Items with `0` stock display `(Out of Stock)` and are disabled from selection.
2. **Quantity Capping**: The input field for Quantity sets a `max` bound matching the selected item's stock and clamps user-entered numbers instantly.
3. **Double Backend Guard**: If a request bypasses the client-side UI, the controllers re-verify stock levels within the database connection client before final execution, rolling back transfers on failure.

---

## 🌐 Production Deployment Considerations

### Secure Cross-Site Cookies
To support authentication when the React app (e.g. Vercel) and the Express API (e.g. Render) are deployed on different domains, the system implements a self-healing cookie configuration:
- In production (detected dynamically via `req.secure` and proxy protocol checks), the login cookie is issued with `Secure: true` and `SameSite: None`.
- Locally, the cookie automatically falls back to HTTP compatible `Secure: false` and `SameSite: Lax`.
- **Express Proxy Trust**: The backend enables `app.set('trust proxy', 1)` to accurately detect secure requests behind HTTPS reverse proxies.

### Environment Variable Setup
Ensure the following variables are configured in production:
* **Backend (Render)**:
  - `DATABASE_URL`: Connection string.
  - `CLIENT_URL`: URL of the deployed frontend (e.g., `https://miltrack.vercel.app` - no trailing slash).
  - `JWT_SECRET`: Safe cryptographic string.
* **Frontend (Vercel)**:
  - `VITE_API_BASE_URL`: URL of the deployed API (e.g., `https://miltrack-api.onrender.com/api`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Vanilla CSS, Recharts, Lucide React, Axios |
| Backend | Node.js, Express.js (ES Modules) |
| Database | PostgreSQL (raw SQL via `pg` — no ORM) |
| Auth | JWT (jsonwebtoken) + cookieParser |
| Security | Helmet, CORS (credentials allowlist), Express trust proxy, RBAC middleware |
