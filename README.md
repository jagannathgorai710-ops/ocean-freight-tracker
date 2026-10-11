# 🚢 Ocean Freight Rate & Shipment Tracker
> **Intelligent Rate Comparison, Real-Time Voyage Telemetry, Automated Invoice Auditing & NLP Email Sync**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-emerald.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.2+-cyan.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.2+-purple.svg)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-blue.svg)](https://sqlite.org)
[![Security](https://img.shields.io/badge/Auth-Bcrypt%20%2B%20JWT-amber.svg)](https://jwt.io)
[![Status](https://img.shields.io/badge/Status-100%25%20Operational-brightgreen.svg)]()

---

## 🌟 Executive Summary & Problem Overview

Global ocean freight operations frequently suffer from fragmented rate data, delayed tracking visibility, and manual billing errors. This comprehensive full-stack platform solves these challenges across 4 core operational modules:

1. **Rate Search & Comparison:** Instant search across global shipping lines with guaranteed cheapest-carrier recommendation and IMO Green Freight CO₂ metrics.
2. **Shipment Tracker & Live Map:** Real-time voyage status evaluation (*In Transit, Delivered, Delayed*) with interactive OpenStreetMap route visualization and port telemetry.
3. **Freight Invoice Checker:** Automated cross-auditing of carrier invoice billings against contracted master tariffs with automatic 1-click legal dispute notice generation.
4. **Email-Based Rate & Shipment Updates:** Fault-tolerant NLP/Regex extraction engine that parses plain-text operational dispatcher emails, skips noise/newsletters, and automatically updates live tariffs and voyage statuses.

---

## 🚀 The 4 Core Modules

### 🔍 Module 1: Rate Search & Sustainability Comparison
- **Smart Corridor Filtering:** Automatically lists connected destinations for selected origin ports (*Nhava Sheva, Mundra, Chennai, Kolkata* ➔ *Los Angeles, New York, Savannah, Houston, Long Beach, Norfolk*) for `20ft` and `40ft` containers.
- **Cheapest Option Highlighting:** Identifies lowest-cost shipping lines with price comparison metrics and savings against market averages.
- **IMO Green Freight Intelligence:** Computes nautical distance and carbon emissions (kg CO₂e per container) with an eco-efficiency rating and carbon savings vs air freight.
- **Dynamic Sorting:** Instant sorting by Price (Low ➔ High), Transit Time (Fastest First), and Price (High ➔ Low).

### 🚢 Module 2: Shipment Tracker & Interactive Ocean Map
- **Fleet Dashboard:** Tracks all monitored voyages with summary metrics for **In Transit**, **Delivered**, and **Delayed**.
- **Automated Delay Flagging:** Automatically evaluates expected arrival against the current date to detect and flag SLA voyage delays.
- **Interactive Maritime Route Map:** Powered by Leaflet & OpenStreetMap, displaying origin/destination port markers, nautical waypoint polylines, and live vessel positions.
- **Vessel Operations:** User-friendly "Add Shipment", "Update Status", and 1-click "Mark Delivered" actions.

### ⚖️ Module 3: Freight Invoice Checker & Dispute Generator
- **Contract Tariff Cross-Auditing:** Instant verification of invoiced amounts against contracted baseline rates for matching carrier, corridor, and container equipment.
- **Discrepancy Highlighting:** Flags exact matches and overcharges with dollar ($) and INR (₹) variances and percentage overage calculations.
- **1-Click Dispute Generator:** Automatically generates a formal **Notice of Freight Discrepancy & Dispute** with unique claim reference, line-item audit table, and demand for credit note.
- **Fleet Bulk Audit Matrix:** Full fleet audit matrix summarizing total recoverable overcharges across all historical shipments.

### 📨 Module 4: Email-Based Rate & Shipment Auto-Sync
- **Multi-Pattern NLP Engine:** Extracts carrier name, origin/destination ports, equipment size, revised rate amounts, shipment IDs, and delay reasons from unformatted emails.
- **Noise & Newsletter Filter:** Automatically filters marketing circulars (Email 11) and Out-of-Office auto-replies (Email 12).
- **1-Click Batch Synchronization:** Applies all actionable email updates directly to the database with a single click.
- **Live Interactive Sandbox:** Built-in email testing playground allowing custom operational emails to be parsed in real time.

---

## 🛡️ Bonus & Enterprise Features

- 📊 **Executive Analytics Dashboard:** Dynamic Chart.js visualizations for status distribution, carrier SLA reliability, and trade corridor rate spreads.
- 📥 **1-Click Excel & CSV Exporter:** Export Carrier Rates, Shipments Telemetry, and Invoice Audit Logs in `.xlsx` or `.csv`.
- 🔐 **Admin Console & Audit Trail:** Searchable audit logs of every tariff and shipment modification with user attribution, plus system health telemetry.
- 🎓 **Interactive 3-Slide Presentation:** Built-in slide deck covering Strategic Approach, System Engineering, and Value Delivery.
- ⏱️ **3-Minute Walkthrough Tour:** Built-in guided walkthrough guide for evaluation and live demos.
- 🔄 **One-Click Dataset Reset:** Instant factory restore button to re-seed pristine datasets at any time.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | **React 18 + Vite** | High-performance reactive single-page client |
| **Styling** | **Custom Maritime Theme + Tailwind** | Responsive cards, custom scrollbars, and dark aesthetics |
| **Maps & Geospatial** | **Leaflet + OpenStreetMap** | Global ocean corridor visualization and live vessel telemetry |
| **Data Visualization** | **Chart.js + React-Chartjs-2** | Interactive KPI doughnut and stacked carrier bar charts |
| **Backend API** | **Node.js + Express** | High-throughput REST API with CORS and JSON streaming |
| **Database** | **SQLite3 (Embedded)** | Relational database pre-seeded with rates, shipments, and emails |
| **Authentication** | **Bcrypt.js + JSON Web Tokens (JWT)** | Hashed password security and role-based access control (Admin / User) |
| **NLP Engine** | **Custom Multi-Pattern Regex Engine** | Extraction of rate revisions and shipment status alerts |
| **Data Export** | **SheetJS (XLSX)** | 1-click Excel (`.xlsx`) and CSV spreadsheet generation |

---

## 🔒 Authentication & Demo Accounts

Pre-configured demo profiles available in the login modal:
- **Admin Profile:** `admin@oceanfreight.com` / `admin123` *(Full access: Add/Edit rates, process emails, reset database, view audit logs)*
- **User Profile:** `user@oceanfreight.com` / `user123` *(Auditor access: Search rates, track shipments, check invoices)*

---

## 🏁 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

### 1. Start the Backend API Server (Port 5000)
```bash
cd server
npm install
node server.js
```
*The SQLite database (`ocean_freight.sqlite`) will automatically initialize and seed from `carrier_rates.csv`, `sample_shipments.csv`, and `sample_emails.txt`.*

### 2. Start the Frontend Client (Port 5173)
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

*(Alternatively, the Express backend serves the production client at **http://localhost:5000**).*

---

## 📂 Project Structure

```
d:\2026\jaganath\
├── carrier_rates.csv                    # 100 sample carrier rates across corridors
├── sample_shipments.csv                 # 20 active sample shipments
├── sample_emails.txt                    # 14 operational dispatcher emails
├── package.json                         # Root project configuration
├── README.md                            # Complete technical documentation
├── server/
│   ├── database.js                      # SQLite schema and query helpers
│   ├── seed.js                          # Automated CSV and email database seeder
│   ├── emailParser.js                   # Multi-pattern NLP extraction engine
│   ├── server.js                        # Express server entry point
│   └── routes/
│       ├── auth.js                      # Login, register, and JWT authentication
│       ├── rates.js                     # Rate search, green metrics, and CRUD
│       ├── shipments.js                 # Voyage telemetry and status computation
│       ├── invoices.js                  # Discrepancy audit and dispute generator
│       ├── emails.js                    # Inbox parsing, batch sync, and sandbox
│       ├── analytics.js                 # Summary metrics, charts, and Excel export
│       └── admin.js                     # System status, user directory, and audit logs
└── client/
    ├── index.html                       # HTML template with Google Fonts & Leaflet
    ├── vite.config.js                   # Vite dev server configuration with proxy
    └── src/
        ├── App.jsx                      # Main reactive application controller
        ├── main.jsx                     # React DOM bootstrap
        ├── index.css                    # Maritime dark design system
        ├── services/
        │   └── api.js                   # Unified REST API client
        └── components/
            ├── Navbar.jsx               # Navigation bar with role and currency toggle
            ├── RateSearch.jsx           # Module 1: Rate Search & Eco Comparison
            ├── ShipmentTracker.jsx      # Module 2: Live Shipment Tracker & Map
            ├── OceanMap.jsx             # Leaflet ocean shipping lanes map
            ├── InvoiceChecker.jsx       # Module 3: Invoice Auditor & Dispute Tool
            ├── DisputeModal.jsx         # Formal Dispute Notice copy/export modal
            ├── EmailParserModule.jsx    # Module 4: NLP Email Inbox & Sync Hub
            ├── RateDirectory.jsx        # Complete master tariff matrix
            ├── AnalyticsDashboard.jsx   # Executive Charts & Excel Export
            ├── AdminPanel.jsx           # System Admin & Audit Trail Console
            ├── PresentationSlides.jsx   # 3-Slide Architecture & Strategy Deck
            ├── DemoGuideModal.jsx       # 3-Minute Demo Walkthrough Guide
            └── AuthModal.jsx            # 1-Click Login & Account Registration
```

---

## ⚖️ License
Released under the MIT License.
