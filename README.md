# 🗄️ RackVision v2 — Professional Rack Management SaaS

Full-stack IT infrastructure rack management with switch port mapping, AI insights, drag-and-drop, and PDF/PNG export.

---

## 📁 Complete File Structure

```
rackvision2/
├── backend/
│   ├── models/
│   │   ├── User.js           # Auth user with bcrypt
│   │   ├── Rack.js           # Rack with UUID share token
│   │   └── Device.js         # Device + Port[] sub-schema (auto-generates ports)
│   ├── routes/
│   │   ├── auth.js           # POST /login /register, GET /me
│   │   ├── rack.js           # CRUD + public share endpoint
│   │   ├── device.js         # CRUD + U-slot conflict detection + search
│   │   ├── port.js           # GET/PUT single port, PUT bulk
│   │   └── ai.js             # Rules-based AI analysis endpoint
│   ├── middleware/auth.js    # JWT protect + optionalAuth
│   ├── utils/seed.js         # Demo data with 48-port switch pre-filled
│   ├── server.js             # Express entry
│   └── .env
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx                        # Root layout
        │   ├── page.tsx                          # Root redirect
        │   ├── globals.css                       # Dark theme + rack CSS
        │   ├── auth/login/page.tsx               # Login
        │   ├── auth/register/page.tsx            # Register
        │   ├── share/[token]/page.tsx            # Public read-only view
        │   └── dashboard/
        │       ├── layout.tsx                    # Auth guard + sidebar
        │       ├── page.tsx                      # Multi-rack dashboard
        │       ├── create/page.tsx               # Create rack with preview
        │       └── rack/[id]/
        │           ├── page.tsx                  # Main rack detail view
        │           └── edit/page.tsx             # Edit rack metadata
        ├── components/
        │   ├── rack/RackCanvas.tsx               # ★ Visual rack with drag-drop
        │   ├── device/
        │   │   ├── DeviceModal.tsx               # Add/edit with slot validator
        │   │   └── DevicePanel.tsx               # Right-panel device info
        │   ├── switch/PortManager.tsx            # ★ Full 48-port grid + edit modal
        │   ├── export/ExportButton.tsx           # ★ PDF (with port tables) + PNG
        │   └── ui/
        │       ├── AiPanel.tsx                   # ★ AI insights panel
        │       ├── Sidebar.tsx                   # Navigation
        │       ├── AuthGuard.tsx                 # Route protection
        │       └── Providers.tsx                 # QueryClient + hydration
        ├── lib/
        │   ├── api.ts                            # Axios client + all API methods
        │   ├── authStore.ts                      # Zustand auth state
        │   └── utils.ts                          # Color helpers, timeAgo
        └── types/index.ts                        # All TypeScript types + constants
```

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **MongoDB** v6+ (local or Atlas)
- **npm** (or yarn)

---

## 🚀 Setup — Step by Step

### Step 1 — Backend

```bash
cd rackvision2/backend

# Install dependencies
npm install

# (Optional) Seed demo data
node utils/seed.js
# → Creates: admin@demo.com / password123
# → 2 racks, 10 devices, 48-port switch with demo connections

# Start backend
npm run dev        # nodemon (development)
# OR
npm start          # production
```

Backend → **http://localhost:5000**

### Step 2 — Frontend

```bash
cd rackvision2/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend → **http://localhost:3000**

### Step 3 — Login

- Email: `admin@demo.com`
- Password: `password123`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rackvision
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📡 Complete API Reference

### Auth
| Method | Endpoint              | Auth | Description            |
|--------|-----------------------|------|------------------------|
| POST   | `/api/auth/register`  | ❌   | Create account         |
| POST   | `/api/auth/login`     | ❌   | Login → JWT            |
| GET    | `/api/auth/me`        | ✅   | Current user           |

### Racks
| Method | Endpoint                   | Auth | Description                  |
|--------|----------------------------|------|------------------------------|
| GET    | `/api/racks`               | ✅   | List all user racks          |
| POST   | `/api/racks`               | ✅   | Create rack                  |
| GET    | `/api/racks/:id`           | ✅   | Get rack by ID               |
| PUT    | `/api/racks/:id`           | ✅   | Update rack                  |
| DELETE | `/api/racks/:id`           | ✅   | Delete rack + all devices    |
| GET    | `/api/racks/share/:token`  | ❌   | Public shared view           |
| GET    | `/api/racks/:id/devices`   | ❌   | Devices in rack              |

### Devices
| Method | Endpoint                       | Auth | Description                     |
|--------|--------------------------------|------|---------------------------------|
| POST   | `/api/devices`                 | ✅   | Add device (with conflict check)|
| GET    | `/api/devices/:id`             | ✅   | Get device                      |
| PUT    | `/api/devices/:id`             | ✅   | Update device (move/edit)       |
| DELETE | `/api/devices/:id`             | ✅   | Delete device                   |
| GET    | `/api/devices/search/:rackId`  | ✅   | Search devices in rack          |

### Ports
| Method | Endpoint                          | Auth | Description          |
|--------|-----------------------------------|------|----------------------|
| GET    | `/api/ports/:deviceId`            | ✅   | All ports for switch |
| PUT    | `/api/ports/:deviceId/:portNum`   | ✅   | Update single port   |
| PUT    | `/api/ports/:deviceId/bulk`       | ✅   | Bulk update ports    |

### AI
| Method | Endpoint                   | Auth | Description              |
|--------|----------------------------|------|--------------------------|
| GET    | `/api/ai/analyze/:rackId`  | ✅   | Rules-based AI analysis  |

---

## ⭐ Feature Highlights

### 1. Switch Port Management (Priority #1)
- Visual grid of all ports (8–96)
- Color coded: 🟢 Active · ⚫ Inactive · 🔴 Error  
- Click any port → modal with: IP, Device Type, Connected Device, VLAN, Speed, Label, Notes
- Port status shown as mini strip on switch device in rack view
- Port stats bar (active / inactive / error counts)

### 2. AI Insights (Priority #2)
- **Rack Overloaded** → alert at 90%+ utilization
- **Near Capacity** → warning at 75%+
- **Low Utilization** → tip if < 20%
- **Unused Ports Detected** → when ≥ 80% of switch ports are inactive
- **Active Ports Missing IP** → for connected ports without IP
- **Port Errors** → flags error-status ports
- **No UPS** → recommendation if rack has 2+ devices
- **No Firewall** → recommendation if 2+ servers present
- **Fragmented Free Space** → detects non-contiguous free U slots
- **Health Score** (0–100) with ring visualization

### 3. Drag & Drop (Priority #3)
- Drag any device in the rack to a new U position
- Real-time conflict detection during hover
- Blue highlight on valid drop targets, blocked on conflicts
- API call to persist new position on drop

### 4. PDF Export with Port Details (Priority #4)
- Full A4 PDF with dark-themed styling
- Title page with rack info and utilization bar
- Device inventory table (all devices)
- Per-switch port mapping table (IP, VLAN, status, speed, connected device)
- Multi-page support with page numbers
- Also supports PNG screenshot export

### 5. Multi-Rack Dashboard (Priority #5)
- Grid view with mini rack utilization bar chart
- Stats: total racks, devices, U space, avg utilization
- Per-rack: device count, free U, creation time
- Search racks by name/location
- One-click share link copy
- Inline delete with confirmation

---

## 🎨 Device Types & Colors

| Type        | Color  | Icon | Description          |
|-------------|--------|------|----------------------|
| Server      | Blue   | 🖥️  | Compute servers      |
| Switch      | Green  | 🔀  | Network switches     |
| Storage     | Cyan   | 💾  | SAN/NAS/storage      |
| Firewall    | Red    | 🛡️  | Firewall appliances  |
| Router      | Purple | 🌐  | Network routers      |
| Patch Panel | Amber  | 🔌  | Patch panels         |
| UPS         | Orange | ⚡  | Power supplies       |
| KVM         | Pink   | 🖱️  | KVM switches         |

## 🔌 Port Device Types

Camera · Access Point · Data · Server · Printer · VoIP · Other

---

## 🛡️ Production Deployment

1. Set strong `JWT_SECRET` (64+ random chars)
2. Use `MONGODB_URI` pointing to Atlas or secured MongoDB
3. Set `NODE_ENV=production`
4. Update `FRONTEND_URL` in backend `.env` to your domain
5. Update `NEXT_PUBLIC_API_URL` in frontend `.env.local` to your API domain
6. Run `npm run build` in frontend, deploy to Vercel / server
7. Use HTTPS everywhere

---

## 📝 Sample cURL Requests

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password123"}'

# Create a rack
curl -X POST http://localhost:5000/api/racks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"DC1 Rack A","location":"Room 101","totalU":42}'

# Add a 48-port switch
curl -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rackId":"RACK_ID","name":"CORE-SW-01","deviceType":"switch","ipAddress":"192.168.1.1","uStart":1,"uSize":2,"portCount":48}'

# Update port 5 on a switch
curl -X PUT http://localhost:5000/api/ports/DEVICE_ID/5 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active","ipAddress":"192.168.1.100","deviceType":"server","connectedDevice":"WEB-01","vlanId":10}'

# Get AI analysis
curl http://localhost:5000/api/ai/analyze/RACK_ID \
  -H "Authorization: Bearer TOKEN"
```
