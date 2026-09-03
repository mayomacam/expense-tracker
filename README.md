# 💰 Expense & Prorated Budget Tracker

A full-stack personal finance application and prorated daily budget pacing system built with **React**, **TypeScript**, **Tailwind CSS**, **Express.js**, and an embedded **SQLite** database engine. Supports containerized deployment with **Kali Linux Docker** and **OpenSSH Server**.

---

## 🌟 Highlights & Core Capabilities

- ⏱️ **Prorated Daily Budget Engine**: Break down monthly budgets into dynamic daily spending limits `(Monthly Cap + Rollover) / Days in Month`. Real-time daily allowance tracking, pacing velocity indicators, and overspend threshold alerts.
- ⚡ **Streamlined Prorated Quick-Spend Logger**: Dedicated lightweight logger modal (`LogProratedSpendModal`) for recording daily prorated spending in 1 click without going through general expense forms.
- 📄 **PDF Report Generation**: Download & print styled monthly PDF financial statements complete with executive cashflow totals, prorated status, and itemized ledgers.
- 🎛️ **1-Click Tracker Switcher**: Instant switching between prorated trackers (*Snacks & Treats*, *Travel*, *Food*, etc.) directly via the Sidebar or the top Pill Tab Bar.
- 🇮🇳 **Default Currency (₹ INR) & Multi-Currency**: Native support for Indian Rupee (`₹` / `INR`) with Indian numbering format (`en-IN`), plus instant switching between `$`, `€`, `£`, `¥`, `C$`, and `A$`.
- 🗄️ **Persistent SQLite Database**: Embedded SQLite database (`data/budget.sqlite`) backed by RESTful API endpoints for resilient local and containerized data persistence in your current folder.
- 🐳 **Kali Linux Docker Container & OpenSSH**: Fully containerized environment using `kalilinux/kali-rolling` with OpenSSH server daemon on port `16000` (`ssh kali@localhost -p 16000`), Web App on port `16001`, and live source/dist volume mounts.
- 💳 **Complete Transactions Ledger**: Filter by categories, payment methods, transaction types, custom tags, date ranges, and search keywords. Includes CSV & PDF exports.
- 🔁 **Recurring Bills & Auto-Apply**: Track subscriptions, utilities, and rent with automatic monthly transaction batch generation.
- 🎯 **Savings Goals & Celebrations**: Create milestone vaults, log deposits/withdrawals, track progress percentages, and celebrate completions with interactive confetti.
- 📉 **Debt Payoff & Amortization**: Track student loans, car loans, mortgages, and credit cards with principal vs. interest breakdown and installment history.
- 🛠️ **SQLite Manager**: Live disk storage inspector, table row counters, database re-seed, zero-state wipe, and demo data loader.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Host System                           │
│                                                             │
│   Web Browser                  Terminal / SSH Client        │
│   http://localhost:16001       ssh kali@localhost -p 16000  │
│         │                               │                   │
└─────────┼───────────────────────────────┼───────────────────┘
          │ Port 16001                    │ Port 16000
┌─────────▼───────────────────────────────▼───────────────────┐
│              Docker Container (Kali Linux)                  │
│                                                             │
│   ┌──────────────────────┐    ┌─────────────────────────┐   │
│   │ Express App & API    │    │ OpenSSH Server (sshd)   │   │
│   │ (Port 3000)          │    │ (Port 22)               │   │
│   └──────────┬───────────┘    └─────────────────────────┘   │
│              │                                              │
│              │ SQLite Read / Write                          │
│   ┌──────────▼───────────┐                                  │
│   │ /app/data            │                                  │
│   └──────────┬───────────┘                                  │
└──────────────┼──────────────────────────────────────────────┘
               │ Host Volume Mounts (./data, ./dist, ./src)
┌──────────────▼──────────────────────────────────────────────┐
│  Host Filesystem: ./data/budget.sqlite (Current Folder)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
├── src/
│   ├── features/                # Modular Feature Exports Index
│   ├── components/
│   │   ├── views/               # Multi-page Views (Prorated, Dashboard, Ledger, etc.)
│   │   ├── modals/              # LogProratedSpendModal, AddTransactionModal, ExportReportModal
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   └── Sidebar.tsx          # Sidebar with 1-click tracker switcher & cashflow stats
│   ├── context/                 # ExpenseContext state provider
│   ├── utils/                   # budgetCalculations, formatters (PDF & CSV generators)
│   └── types.ts                 # TypeScript type declarations
├── docs/                        # Complete Documentation Suite
│   ├── ARCHITECTURE.md          # Technical architecture & state management
│   └── DOCKER_SSH_GUIDE.md      # Docker container & OpenSSH setup guide
├── docker-start.ps1             # PowerShell script to launch Docker container with mounts
├── server.ts                    # Express server & API endpoints
├── index.html                   # Application entry point
├── package.json                 # Project dependencies and npm scripts
└── README.md                    # Project overview (this file)
```

---

## 🚀 Quick Start

### Option 1: Docker Container with Kali Linux & OpenSSH (Recommended)

1. Run the PowerShell helper script:
   ```powershell
   .\docker-start.ps1
   ```
   Or manually run via WSL Kali Linux:
   ```bash
   wsl -d kali-linux docker run -d --name expense-tracker-server --restart unless-stopped -p 16001:3000 -p 16000:22 -v /mnt/e/projects/expense-tracker/data:/app/data -v /mnt/e/projects/expense-tracker/dist:/app/dist expense-tracker-kali
   ```

2. Access the Application:
   - **Web UI & REST API**: [http://localhost:16001](http://localhost:16001)
   - **SSH into Kali Container**: `ssh kali@localhost -p 16000` (Password: `kali`)

3. **Persistent Data**: SQLite database is automatically written to `./data/budget.sqlite` in your current host directory!

---

### Option 2: Local Node.js Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Production build
npm run build
npm start
```

---

## 📖 Detailed Documentation

For in-depth guides and references, explore the **`docs/`** directory:

- 🐳 **[Docker & SSH Guide](docs/DOCKER_SSH_GUIDE.md)**: Kali Linux container architecture, SSH credentials, volume mounting, and management.
- 🏗️ **[Architecture Guide](docs/ARCHITECTURE.md)**: Application architecture, state management, and SQLite engine.

---

## 🔒 Security & Privacy

- All user data is stored locally in the embedded SQLite database on disk (`data/budget.sqlite`).
- OpenSSH daemon enabled on container port 16000 with configurable user accounts.
- Support for complete data reset and backup directly from the UI or SSH shell.
