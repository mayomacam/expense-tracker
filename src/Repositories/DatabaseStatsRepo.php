<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class DatabaseStatsRepo {
    public static function getStats(): array {
        $pdo = Database::getInstance();
        $dbPath = Database::getDatabasePath();

        $txCount = (int)$pdo->query("SELECT COUNT(*) FROM transactions")->fetchColumn();
        $catCount = (int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
        $rulesCount = (int)$pdo->query("SELECT COUNT(*) FROM prorated_rules")->fetchColumn();
        $spendsCount = (int)$pdo->query("SELECT COUNT(*) FROM prorated_spends")->fetchColumn();
        $savingsCount = (int)$pdo->query("SELECT COUNT(*) FROM savings_goals")->fetchColumn();
        $debtCount = (int)$pdo->query("SELECT COUNT(*) FROM debts")->fetchColumn();
        $recCount = (int)$pdo->query("SELECT COUNT(*) FROM recurring_items")->fetchColumn();
        $gulakCount = (int)$pdo->query("SELECT COUNT(*) FROM gulak_pots")->fetchColumn();

        $fileSizeKb = 0;
        if (file_exists($dbPath)) {
            $fileSizeKb = (int)round(filesize($dbPath) / 1024);
        }

        return [
            'success' => true,
            'engine' => 'SQLite (PHP PDO + File Persistence)',
            'databaseFile' => $dbPath,
            'fileSizeKb' => $fileSizeKb,
            'tables' => [
                'transactions' => $txCount,
                'categories' => $catCount,
                'prorated_rules' => $rulesCount,
                'prorated_spends' => $spendsCount,
                'savings_goals' => $savingsCount,
                'debts' => $debtCount,
                'recurring_items' => $recCount,
                'gulak_pots' => $gulakCount,
            ],
            'status' => 'online',
            'lastSync' => date('c'),
        ];
    }

    public static function resetAllDataToZero(string $providedPassword, array $config): array {
        $secretFile = $config['secret_key_file'] ?? '';
        $defaultPassword = $config['default_reset_password'] ?? 'admin123';
        $expected = getExpectedResetPassword($secretFile, $defaultPassword);

        if (!hash_equals($expected, $providedPassword)) {
            return [
                'success' => false,
                'status' => 401,
                'error' => 'Unauthorized: Invalid or missing reset password.',
            ];
        }

        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $pdo->exec("DELETE FROM transactions");
            $pdo->exec("DELETE FROM deleted_transactions");
            $pdo->exec("DELETE FROM categories");
            $pdo->exec("DELETE FROM prorated_rules");
            $pdo->exec("DELETE FROM prorated_spends");
            $pdo->exec("DELETE FROM savings_goals");
            $pdo->exec("DELETE FROM savings_history");
            $pdo->exec("DELETE FROM debts");
            $pdo->exec("DELETE FROM debt_payments");
            $pdo->exec("DELETE FROM recurring_items");
            $pdo->exec("DELETE FROM read_alerts");
            $pdo->exec("DELETE FROM user_settings");
            $pdo->exec("DELETE FROM gulak_entries");
            $pdo->exec("DELETE FROM gulak_pots");

            Database::seedIfEmpty();
            $pdo->commit();

            return [
                'success' => true,
                'status' => 200,
                'message' => 'Database wiped clean: all fake data reset to zero.',
            ];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}