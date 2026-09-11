<?php
declare(strict_types=1);

namespace ExpenseTracker;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;
    private static string $dbPath = '';
    private static array $config = [];

    public static function init(array $config): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        self::$config = $config;
        self::$dbPath = $config['sqlite_path'];

        $dbDir = dirname(self::$dbPath);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        $isNew = !file_exists(self::$dbPath);

        try {
            $pdo = new PDO('sqlite:' . self::$dbPath, null, null, $config['options'] ?? []);
            
            // Security and Concurrency PRAGMAs
            $pdo->exec('PRAGMA foreign_keys = ON;');
            $pdo->exec('PRAGMA journal_mode = WAL;');
            $pdo->exec('PRAGMA busy_timeout = 5000;');
            $pdo->exec('PRAGMA synchronous = NORMAL;');

            self::$instance = $pdo;

            // Ensure schema exists and seed defaults if empty
            self::createSchema();
            self::seedIfEmpty();

            return self::$instance;
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new \RuntimeException('Database connection could not be established.');
        }
    }

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../config/database.php';
            return self::init($config);
        }
        return self::$instance;
    }

    public static function getDatabasePath(): string {
        return self::$dbPath;
    }

    public static function createSchema(): void {
        $pdo = self::$instance;
        if (!$pdo) return;

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                monthlyBudget REAL DEFAULT 0,
                isCustom INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                notes TEXT,
                paymentMethod TEXT NOT NULL,
                isRecurring INTEGER DEFAULT 0,
                recurringFrequency TEXT,
                receiptUrl TEXT,
                proratedRuleId TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS deleted_transactions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                notes TEXT,
                paymentMethod TEXT NOT NULL,
                isRecurring INTEGER DEFAULT 0,
                recurringFrequency TEXT,
                receiptUrl TEXT,
                proratedRuleId TEXT,
                deleted_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS prorated_rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                categoryId TEXT,
                targetTags TEXT DEFAULT '[]',
                monthlyMaxSpend REAL NOT NULL,
                month TEXT NOT NULL,
                rolloverEnabled INTEGER DEFAULT 0,
                rolloverAmount REAL DEFAULT 0,
                alertThresholdPercent REAL DEFAULT 100,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS prorated_spends (
                id TEXT PRIMARY KEY,
                ruleId TEXT NOT NULL,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                addToMainTransactions INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(ruleId) REFERENCES prorated_rules(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS savings_goals (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                targetAmount REAL NOT NULL,
                currentAmount REAL DEFAULT 0,
                targetDate TEXT NOT NULL,
                icon TEXT,
                color TEXT,
                category TEXT,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS savings_history (
                id TEXT PRIMARY KEY,
                goalId TEXT NOT NULL,
                date TEXT NOT NULL,
                amount REAL NOT NULL,
                note TEXT,
                type TEXT NOT NULL,
                FOREIGN KEY(goalId) REFERENCES savings_goals(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS debts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                lenderName TEXT,
                debtType TEXT DEFAULT 'borrowed',
                totalPrincipal REAL NOT NULL,
                remainingBalance REAL NOT NULL,
                interestRate REAL DEFAULT 0,
                minimumPayment REAL DEFAULT 0,
                dueDay INTEGER DEFAULT 1,
                notes TEXT,
                color TEXT
            );

            CREATE TABLE IF NOT EXISTS debt_payments (
                id TEXT PRIMARY KEY,
                debtId TEXT NOT NULL,
                date TEXT NOT NULL,
                amount REAL NOT NULL,
                principalPaid REAL NOT NULL,
                interestPaid REAL DEFAULT 0,
                note TEXT,
                FOREIGN KEY(debtId) REFERENCES debts(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS recurring_items (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                frequency TEXT NOT NULL,
                dayOfMonth INTEGER DEFAULT 1,
                autoApply INTEGER DEFAULT 1,
                tags TEXT DEFAULT '[]',
                paymentMethod TEXT NOT NULL,
                lastAppliedMonth TEXT,
                isActive INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS user_settings (
                id TEXT PRIMARY KEY,
                currency TEXT DEFAULT '₹',
                currencyCode TEXT DEFAULT 'INR',
                pushNotificationsEnabled INTEGER DEFAULT 1,
                dailyBudgetAlertThreshold REAL DEFAULT 100,
                monthlyBudgetWarningThreshold REAL DEFAULT 80,
                enableRolloverByDefault INTEGER DEFAULT 1,
                selectedMonth TEXT NOT NULL,
                userName TEXT DEFAULT 'User'
            );

            CREATE TABLE IF NOT EXISTS read_alerts (
                alertId TEXT PRIMARY KEY,
                dismissed_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS gulak_pots (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                targetAmount REAL DEFAULT 0,
                currentBalance REAL DEFAULT 0,
                icon TEXT,
                color TEXT,
                notes TEXT,
                isLocked INTEGER DEFAULT 0,
                lockUntilDate TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS gulak_entries (
                id TEXT PRIMARY KEY,
                potId TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                breakdown TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(potId) REFERENCES gulak_pots(id) ON DELETE CASCADE
            );
        ");

        // Gracefully apply column migrations if needed
        try {
            $pdo->exec("ALTER TABLE transactions ADD COLUMN proratedRuleId TEXT");
        } catch (\Throwable $e) {}
    }

    public static function seedIfEmpty(): void {
        $pdo = self::$instance;
        if (!$pdo) return;

        // Check if categories exist
        $count = (int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
        if ($count === 0) {
            $defaultCategories = [
                ['cat-food', 'Food & Dining', 'Utensils', '#F97316', 8000, 0],
                ['cat-transport', 'Transportation', 'Car', '#3B82F6', 4000, 0],
                ['cat-utilities', 'Utilities & Bills', 'Zap', '#EAB308', 3500, 0],
                ['cat-shopping', 'Shopping', 'ShoppingBag', '#EC4899', 5000, 0],
                ['cat-entertainment', 'Entertainment', 'Film', '#8B5CF6', 3000, 0],
                ['cat-health', 'Health & Medical', 'HeartPulse', '#EF4444', 2500, 0],
                ['cat-housing', 'Rent & Housing', 'Home', '#10B981', 15000, 0],
                ['cat-education', 'Education', 'GraduationCap', '#06B6D4', 2000, 0],
                ['cat-personal', 'Personal Care', 'User', '#F43F5E', 1500, 0],
                ['cat-income', 'Salary & Income', 'Briefcase', '#22C55E', 0, 0],
                ['cat-investment', 'Investments', 'TrendingUp', '#6366F1', 0, 0],
                ['cat-other', 'Other', 'MoreHorizontal', '#64748B', 1000, 0],
            ];

            $stmt = $pdo->prepare("INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($defaultCategories as $cat) {
                $stmt->execute($cat);
            }
        }

        // Check user settings
        $settingsCount = (int)$pdo->query("SELECT COUNT(*) FROM user_settings")->fetchColumn();
        if ($settingsCount === 0) {
            $currentMonth = date('Y-m');
            $stmt = $pdo->prepare("INSERT INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName) VALUES ('default', '₹', 'INR', 1, 100, 80, 1, ?, 'User')");
            $stmt->execute([$currentMonth]);
        }
    }
}