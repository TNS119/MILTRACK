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
│   │   ├── authController.js
│   │   ├── assetController.js    # Dashboard aggregation (CTEs)
│   │   ├── purchaseController.js
│   │   ├── transferController.js # Atomic BEGIN/COMMIT transactions
│   │   ├── assignmentController.js
│   │   └── expenditureController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── rbacMiddleware.js     # Role + base-scope enforcement
│   │   └── loggerMiddleware.js   # Morgan request logger
│   ├── routes/                   # Express routers (7 files)
│   ├── services/auditService.js  # Shared audit log writer
│   ├── sql/schema.sql            # Full DDL (8 tables + 10 indexes)
│   ├── seed.js                   # Idempotent demo-data seeder
│   └── server.js                 # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx       # RBAC-driven navigation
    │   │   ├── StatCard.jsx
    │   │   ├── NetMoveModal.jsx  # Recharts breakdown modal
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx         # Military-themed auth page
    │   │   ├── Dashboard.jsx     # 5 stat cards + bar chart + filters
    │   │   ├── Purchases.jsx     # Log & view purchases
    │   │   ├── Transfers.jsx     # Inter-base transfers
    │   │   └── Assignments.jsx   # Assignments + Expenditures tabs
    │   ├── context/AuthContext.jsx
    │   └── services/api.js       # Axios + JWT interceptors
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

---

## 📡 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login → JWT |
| GET | `/api/auth/me` | 🔒 | Current user profile |
| GET | `/api/assets/dashboard` | 🔒 | Inventory metrics (filterable) |
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
| GET | `/health` | Public | Health check |

---

## 🗄️ Database Schema

8 tables: `bases`, `users`, `equipment_types`, `purchases`, `transfers`, `assignments`, `expenditures`, `audit_logs`

Full DDL: [`backend/sql/schema.sql`](./backend/sql/schema.sql)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Lucide React, Axios |
| Backend | Node.js, Express.js (ES Modules) |
| Database | PostgreSQL (raw SQL via `pg` — no ORM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, CORS with origin allowlist, RBAC middleware |
