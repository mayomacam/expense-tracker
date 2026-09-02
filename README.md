# 💰 Expense & Prorated Budget Tracker

<<<<<<< HEAD
A full-stack personal finance application and prorated daily budget pacing system built with **React**, **TypeScript**, **Tailwind CSS**, **Express.js**, and an embedded **SQLite** database engine. Supports containerized deployment with **Kali Linux Docker** and **OpenSSH Server**.
=======
A full-stack personal finance application and prorated daily budget pacing system built with **React**, **TypeScript**, **Tailwind CSS**, **Express.js**, and an embedded **SQLite** database engine.
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879

---

## 🌟 Highlights & Core Capabilities

- ⏱️ **Prorated Daily Budget Engine**: Break down monthly budgets into dynamic daily spending limits `(Monthly Cap + Rollover) / Days in Month`. Real-time daily allowance tracking, pacing pace indicators, and overspend threshold alerts.
- 🇮🇳 **Default Currency (₹ INR) & Multi-Currency**: Native support for Indian Rupee (`₹` / `INR`) with Indian numbering format (`en-IN`), plus instant switching between `$`, `€`, `£`, `¥`, `C$`, and `A$`.
<<<<<<< HEAD
- 🗄️ **Persistent SQLite Database**: Embedded SQLite database (`data/budget.sqlite`) backed by RESTful API endpoints for resilient local and containerized data persistence in your current folder.
- 🐳 **Kali Linux Docker Container & OpenSSH**: Fully containerized environment using `kalilinux/kali-rolling` with OpenSSH server daemon on port `16000` (`ssh kali@localhost -p 16000`) and Web App on port `16001`.
=======
- 🗄️ **Persistent SQLite Database**: Embedded SQLite database (`data/budget.sqlite`) backed by RESTful API endpoints for resilient local and containerized data persistence.
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
- 💳 **Complete Transactions Ledger**: Filter by categories, payment methods, transaction types, custom tags, date ranges, and search keywords. Includes CSV import and export with instant statement generation.
- 🔁 **Recurring Bills & Auto-Apply**: Track subscriptions, utilities, and rent with automatic monthly transaction batch generation.
- 🎯 **Savings Goals & Celebrations**: Create milestone vaults, log deposits/withdrawals, track progress percentages, and celebrate completions with interactive confetti.
- 📉 **Debt Payoff & Amortization**: Track student loans, car loans, mortgages, and credit cards with principal vs. interest breakdown and installment history.
- 📊 **Executive Monthly Reports**: Comprehensive financial summaries, savings rates, burn rates, category distributions, and downloadable monthly audit CSVs.
- 🛠️ **SQLite Manager**: Live disk storage inspector, table row counters, database re-seed, zero-state wipe, and demo data loader.

---

## 🏗️ System Architecture

```
<<<<<<< HEAD
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
               │ Host Volume Mount (./data:/app/data)
┌──────────────▼──────────────────────────────────────────────┐
│  Host Filesystem: ./data/budget.sqlite (Current Folder)     │
└─────────────────────────────────────────────────────────────┘
=======
┌─────────────────────────────────────────────────────────┐
│                 Client (React + Vite)                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │   ExpenseContext (React State & Sync Engine)     │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │    REST API Client (/src/api/client.ts)          │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────▼─────────────────────────────┐
│                 Backend (Express.js)                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         API Routes (server.ts /api/*)            │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │    SQLite Repository Layer (src/server/db.ts)    │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │      data/budget.sqlite (Persistent File)        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
```

---

## 📁 Project Structure

```
├── docs/                        # Complete Documentation Suite
│   ├── ARCHITECTURE.md          # Technical architecture & state management
<<<<<<< HEAD
│   ├── DOCKER_SSH_GUIDE.md      # Docker container & OpenSSH setup guide
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
│   ├── FEATURES.md              # Deep dive into all 7 views and tool modals
│   ├── PRORATED_BUDGETING_GUIDE.md # Math formulas and pacing logic
│   ├── API_REFERENCE.md         # Full REST API endpoint reference
│   └── DATABASE_SCHEMA.md       # SQLite schema, tables, and relationships
├── src/
│   ├── api/
│   │   └── client.ts            # Client-side API fetch client
│   ├── components/
│   │   ├── modals/              # Action modals (Transaction, Rule, Goal, Debt, etc.)
│   │   ├── views/               # Primary application views (Dashboard, Ledger, etc.)
│   │   └── Navbar.tsx           # Global header with stats & currency selector
│   ├── context/
│   │   └── ExpenseContext.tsx   # React global state provider & sync engine
│   ├── data/
│   │   └── seedData.ts          # Default categories and seed data generators
│   ├── server/
│   │   └── db.ts                # SQLite database repositories and initialization
│   ├── types.ts                 # TypeScript type definitions and interfaces
│   └── utils/
│   │   └── formatters.ts        # Currency, date, and CSV formatting utilities
├── data/
<<<<<<< HEAD
│   └── budget.sqlite            # SQLite database file (persisted in current folder)
├── Dockerfile                   # Kali Linux Docker configuration with OpenSSH
├── docker-compose.yml           # Container orchestration & volume mapping (Ports 16001 & 16000)
├── entrypoint.sh                # Container launcher script for SSHD & App
=======
│   └── budget.sqlite            # SQLite database file
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
├── server.ts                    # Express server & API endpoints
├── index.html                   # Application entry point
├── package.json                 # Project dependencies and npm scripts
└── README.md                    # Project overview (this file)
```

---

## 🚀 Quick Start

<<<<<<< HEAD
### Option 1: Docker Container with Kali Linux & OpenSSH (Recommended)

1. Run the PowerShell helper script or docker run command:
   ```powershell
   .\docker-start.ps1
   ```
   Or manually run via WSL Kali Linux:
   ```bash
   wsl -d kali-linux docker run -d --name expense-tracker-server --restart unless-stopped -p 16001:3000 -p 16000:22 -v /mnt/e/projects/expense-tracker/data:/app/data expense-tracker-kali
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
=======
### 1. Installation

```bash
npm install
```

### 2. Development Mode

Starts both the Vite client and the Express backend on port `3000`:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 3. Production Build

Builds the static assets and bundles the Node backend server:

```bash
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
npm run build
npm start
```

---

## 📖 Detailed Documentation

For in-depth guides and references, explore the **`docs/`** directory:

<<<<<<< HEAD
- 🐳 **[Docker & SSH Guide](docs/DOCKER_SSH_GUIDE.md)**: Kali Linux container architecture, SSH credentials, volume mounting, and management.
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
- 🏛️ **[System Architecture](docs/ARCHITECTURE.md)**: Full-stack design, component structure, state synchronization, and styling standards.
- 💡 **[Feature Overview](docs/FEATURES.md)**: Detailed breakdown of the Dashboard, Prorated Budgeting, Transactions, Recurring Items, Savings & Debt, and Reports.
- 📐 **[Prorated Budgeting Guide](docs/PRORATED_BUDGETING_GUIDE.md)**: Complete mathematical breakdown of daily allowances, linear vs. dynamic burn rates, and rollover surplus management.
- 🔌 **[REST API Reference](docs/API_REFERENCE.md)**: Specifications for all backend endpoints including payload formats and response examples.
- 🗃️ **[Database Schema](docs/DATABASE_SCHEMA.md)**: SQLite table structures, indexes, column types, and migration rules.

---

## 🧰 Technology Stack

<<<<<<< HEAD
- **Container**: Docker, Kali Linux (`kalilinux/kali-rolling`), OpenSSH Server (`sshd`).
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (SQL.js embedded engine with auto-persistence to host `./data/budget.sqlite`).
=======
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (SQL.js embedded engine with auto-persistence to disk).
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
- **Tooling**: Vite, esbuild, tsx.

---

## 🔒 Security & Privacy

- All user data is stored locally in the embedded SQLite database on disk (`data/budget.sqlite`).
<<<<<<< HEAD
- OpenSSH daemon enabled on container port 16000 with configurable user accounts.
- Support for complete data reset and backup directly from the UI or SSH shell.
=======
- No external third-party data tracking or telemetry.
- Support for complete data reset and backup directly from the UI.
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
