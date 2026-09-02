# 📁 Boithok Khana Architecture & Admin Authentication

```
                 YOUR WEBSITE
                       │
            ┌──────────┴──────────┐
            ↓                     ↓
       Customer page          Admin page
   customer-entry.html         /admin
            │                     │
            ↓                     ↓
       Public API            🔐 LOGIN
  (POST /api/customers)           │
                                  ↓
                            Authenticated?
                             /         \
                           NO           YES
                           ↓             ↓
                         DENY      Admin dashboard
                                         │
                                         ↓
                                  Protected API
                              (GET /api/customers)
                              (GET /api/stats)
                              (DELETE /api/customers)
                              (GET /api/export)
                                         │
                                         ↓
                                  Neon PostgreSQL
                                 (`customers` table)
```

---

## 📁 Project Structure

```
📁 boithok-khana (d:/boithak khana website/boithok khana 3/)
│
├── 📁 public
│   ├── index.html            (Main landing page)
│   ├── customer-entry.html   (Customer Data Entry form)
│   └── admin.html            (🔐 Login View & Admin Dashboard)
│
├── 📁 api
│   ├── auth.js               (Handles POST /api/login and authentication checks)
│   ├── customers.js          (Neon DB: Public POST & Protected GET)
│   ├── stats.js              (Neon DB: Protected GET analytics)
│   ├── delete-customer.js    (Neon DB: Protected DELETE customer by ID)
│   └── export.js             (Neon DB: Protected GET CSV export)
│
├── server.js                 (Node.js Server with API & auth routing)
├── package.json
└── .gitignore 
```

---

## 🔐 Credentials & Default Admin Access

- **Username**: `admin`
- **Password**: `Arijitboithok26`

*(Configurable via environment variables `ADMIN_USER` and `ADMIN_PASS`)*

---

## 🚀 How to Run

1. Run server from `D:\boithak khana website\boithok khana 3`:
   ```bash
   node server.js
   ```

2. URLs:
   - **Main Website**: `http://localhost:3000/index.html`
   - **Customer Data Entry**: `http://localhost:3000/customer-entry.html`
   - **Admin Panel & Login**: `http://localhost:3000/admin` (Password Protected)
