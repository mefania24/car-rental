# 🚗 PrimeAuto 3D — Full-Stack Car Rental System

A modern, full-stack car rental platform featuring real-time **interactive 3D vehicle inspection**, customer booking reservations, and an **Admin Fleet & Contact Management Dashboard**. Ready for instant deployment on **Render** and version control on **Git / GitHub**.

---

## ✨ Features

### 👤 Customer & User Experience
* **Live Interactive 3D Vehicle Inspection**:
  * 360° orbit rotation, zoom, studio floor lighting, and headlight controls.
  * Real-time paint color customizer (Silver, Obsidian Black, Pearl White, Royal Blue, Crimson Red, Emerald Green).
  * Smooth fallback 3D procedural models (8-Seater Van, SUV, Sedan, Sports) + custom `.glb` 3D model support.
* **Car Catalog & Filtering**:
  * Filter by category: **Van (8-Seater)**, **SUV**, **Sedan**, **Sports**.
  * Filter by minimum seat capacity (5+, 7+, 8+ seats).
  * Search bar matching car names, brands, or features (*"8-seated"*, *"air conditioner"*, *"leather"*, etc.).
* **Detailed Vehicle Specs**:
  * Capacity badges (e.g. *8-Seater*, *Dual Climate A/C*, *Automatic Transmission*, *Fuel type*).
* **Instant Rental Reservation**:
  * Pick-up and return date picker with automated day count and total price calculation.
  * Customer reservation tracking ("My Rentals" tab).
* **Direct Admin Contact**:
  * Click-to-call phone number.
  * Facebook Messenger / Profile button.
  * Direct Gmail / Email button.

### 🛡️ Admin Fleet & Contact Management
* **Secure Admin Authentication**.
* **Vehicle Fleet Management**:
  * Add new rental cars with picture upload (or image URL).
  * Configure specs: seat capacity, daily rental price, transmission, fuel, A/C toggle, description.
  * Select 3D model preset ('van', 'suv', 'sedan', 'sports') or upload a custom `.glb` 3D model.
  * Delete or update existing cars.
* **Admin Contact Settings**:
  * Update official phone number, Facebook link, Gmail / email, WhatsApp, and office address in real-time.
* **Customer Reservation Management**:
  * View all customer bookings and update status (*Pending*, *Confirmed*, *Completed*, *Cancelled*).

---

## 🔑 Demo Accounts

Use these pre-configured credentials or create new accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rental.com` | `admin123` |
| **Customer** | `customer@rental.com` | `customer123` |

*(Quick demo buttons are also provided directly inside the login modal for 1-click login)*

---

## 🚀 Local Development Setup

### 1. Prerequisites
* Node.js v18+ and npm installed

### 2. Install Dependencies
```bash
# In the client directory
cd client
npm install

# In the server directory
cd ../server
npm install
```

### 3. Run Locally
**Terminal 1 (Backend API on port 5000):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend with hot-reloading on port 3000):**
```bash
cd client
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🌐 Deploy to Git & Render (Step-by-Step)

### Step 1: Initialize Git and Commit
```bash
git init
git add .
git commit -m "Initial commit: 3D Car Rental system with Admin and Customer portals"
```

### Step 2: Push to GitHub / GitLab
Create a new repository on [GitHub](https://github.com/new) and run:
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render
1. Log in to [Render.com](https://render.com).
2. Click **New +** and select **Web Service** (or **Blueprint** using `render.yaml`).
3. Connect your GitHub repository.
4. Configure the settings:
   * **Name**: `car-rental-3d`
   * **Environment**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
5. Click **Deploy Web Service**!

Render will install dependencies, build the client production bundle, and start the Express server. Your live app will be accessible at `https://car-rental-3d.onrender.com`.

---

## 📁 Project Architecture

```
car-rental/
├── client/                      # React 19 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Car3DViewer.jsx      # Three.js 3D vehicle canvas & controls
│   │   │   ├── CarDetailModal.jsx   # 3D inspection modal & booking form
│   │   │   ├── Navbar.jsx           # Header & admin contact strip
│   │   │   ├── LoginModal.jsx       # Auth modal with 1-click demo buttons
│   │   │   ├── AdminDashboard.jsx   # Admin fleet, contacts & bookings
│   │   │   └── Icons.jsx            # SVG icons
│   │   ├── App.jsx              # Main catalog & search view
│   │   └── index.css            # Tailwind CSS styling
│   └── package.json
├── server/                      # Express backend & database
│   ├── data/
│   │   └── db.json              # Persistent JSON database with sample fleet
│   ├── uploads/                 # Storage for photos and custom .glb 3D files
│   ├── db.js                    # Database read/write & auto-seeding
│   ├── index.js                 # REST API endpoints & static serving
│   └── package.json
├── render.yaml                  # 1-Click Render Blueprint configuration
├── package.json                 # Monorepo build and start scripts
└── README.md
```
