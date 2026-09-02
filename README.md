# 💰 Expense & Prorated Budget Tracker

A full-stack personal finance application and prorated daily budget pacing system built with **React**, **TypeScript**, **Tailwind CSS**, **Express.js**, and an embedded **SQLite** database engine. Supports containerized deployment with **Kali Linux Docker** and **OpenSSH Server**.

---

## 🌟 Highlights & Core Capabilities

- ⏱️ **Prorated Daily Budget Engine**: Break down monthly budgets into dynamic daily spending limits `(Monthly Cap + Rollover) / Days in Month`. Real-time daily allowance tracking, pacing pace indicators, and overspend threshold alerts.
- 🇮🇳 **Default Currency (₹ INR) & Multi-Currency**: Native support for Indian Rupee (`₹` / `INR`) with Indian numbering format (`en-IN`), plus instant switching between `$`, `€`, `£`, `¥`, `C$`, and `A$`.
- 🗄️ **Persistent SQLite Database**: Embedded SQLite database (`data/budget.sqlite`) backed by RESTful API endpoints for resilient local and containerized data persistence in your current folder.
- 🐳 **Kali Linux Docker Container & OpenSSH**: Fully containerized environment using `kalilinux/kali-rolling` with OpenSSH server daemon on port `16000` (`ssh kali@localhost -p 16000`) and Web App on port `16001`.
- 💳 **Complete Transactions Ledger**: Filter by categories, payment methods, transaction types, custom tags, date ranges, and search keywords. Includes CSV import and export with instant statement generation.
- 🔁 **Recurring Bills & Auto-Apply**: Track subscriptions, utilities, and rent with automatic monthly transaction batch generation.
- 🎯 **Savings Goals & Celebrations**: Create milestone vaults, log deposits/withdrawals, track progress percentages, and celebrate completions with interactive confetti.
- 📉 **Debt Payoff & Amortization**: Track student loans, car loans, mortgages, and credit cards with principal vs. interest breakdown and installment history.
- 📊 **Executive Monthly Reports**: Comprehensive financial summaries, savings rates, burn rates, category distributions, and downloadable monthly audit CSVs.
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
               │ Host Volume Mount (./data:/app/data)
┌──────────────▼──────────────────────────────────────────────┐
│  Host Filesystem: ./data/budget.sqlite (Current Folder)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
├── docs/                        # Complete Documentation Suite
│   ├── ARCHITECTURE.md          # Technical architecture & state management
│   ├── DOCKER_SSH_GUIDE.md      # Docker container & OpenSSH setup guide
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
│   └── budget.sqlite            # SQLite database file (persisted in current folder)
├── Dockerfile                   # Kali Linux Docker configuration with OpenSSH
├── docker-compose.yml           # Container orchestration & volume mapping (Ports 16001 & 16000)
├── entrypoint.sh                # Container launcher script for SSHD & App
├── server.ts                    # Express server & API endpoints
├── index.html                   # Application entry point
├── package.json                 # Project dependencies and npm scripts
└── README.md                    # Project overview (this file)
```

---

## 🚀 Quick Start

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
npm run build
npm start
```

---

## 📖 Detailed Documentation

For in-depth guides and references, explore the **`docs/`** directory:

- 🐳 **[Docker & SSH Guide](docs/DOCKER_SSH_GUIDE.md)**: Kali Linux container architecture, SSH credentials, volume mounting, and management.
- 🏛️ **[System Architecture](docs/ARCHITECTURE.md)**: Full-stack design, component structure, state synchronization, and styling standards.
- 💡 **[Feature Overview](docs/FEATURES.md)**: Detailed breakdown of the Dashboard, Prorated Budgeting, Transactions, Recurring Items, Savings & Debt, and Reports.
- 📐 **[Prorated Budgeting Guide](docs/PRORATED_BUDGETING_GUIDE.md)**: Complete mathematical breakdown of daily allowances, linear vs. dynamic burn rates, and rollover surplus management.
- 🔌 **[REST API Reference](docs/API_REFERENCE.md)**: Specifications for all backend endpoints including payload formats and response examples.
- 🗃️ **[Database Schema](docs/DATABASE_SCHEMA.md)**: SQLite table structures, indexes, column types, and migration rules.

---

## 🧰 Technology Stack

- **Container**: Docker, Kali Linux (`kalilinux/kali-rolling`), OpenSSH Server (`sshd`).
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (SQL.js embedded engine with auto-persistence to host `./data/budget.sqlite`).
- **Tooling**: Vite, esbuild, tsx.

---

## 🔒 Security & Privacy

- All user data is stored locally in the embedded SQLite database on disk (`data/budget.sqlite`).
- OpenSSH daemon enabled on container port 16000 with configurable user accounts.
- Support for complete data reset and backup directly from the UI or SSH shell.
