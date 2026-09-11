<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class SettingsRepo {
    public static function get(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM user_settings LIMIT 1");
        $r = $stmt->fetch();

        if (!$r) {
            return [
                'currency' => '₹',
                'currencyCode' => 'INR',
                'pushNotificationsEnabled' => true,
                'dailyBudgetAlertThreshold' => 100.0,
                'monthlyBudgetWarningThreshold' => 80.0,
                'enableRolloverByDefault' => true,
                'selectedMonth' => date('Y-m'),
                'userName' => 'Financial Explorer',
            ];
        }

        return [
            'currency' => (string)($r['currency'] ?? '₹'),
            'currencyCode' => (string)($r['currencyCode'] ?? 'INR'),
            'pushNotificationsEnabled' => (bool)$r['pushNotificationsEnabled'],
            'dailyBudgetAlertThreshold' => (float)($r['dailyBudgetAlertThreshold'] ?? 100),
            'monthlyBudgetWarningThreshold' => (float)($r['monthlyBudgetWarningThreshold'] ?? 80),
            'enableRolloverByDefault' => (bool)$r['enableRolloverByDefault'],
            'selectedMonth' => (string)($r['selectedMonth'] ?? date('Y-m')),
            'userName' => (string)($r['userName'] ?? 'Financial Explorer'),
        ];
    }

    public static function update(array $updates): array {
        $existing = self::get();
        $merged = array_merge($existing, $updates);

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            INSERT OR REPLACE INTO user_settings (id, currency, currencyCode, pushNotificationsEnabled, dailyBudgetAlertThreshold, monthlyBudgetWarningThreshold, enableRolloverByDefault, selectedMonth, userName)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'default',
            $merged['currency'],
            $merged['currencyCode'],
            !empty($merged['pushNotificationsEnabled']) ? 1 : 0,
            (float)$merged['dailyBudgetAlertThreshold'],
            (float)$merged['monthlyBudgetWarningThreshold'],
            !empty($merged['enableRolloverByDefault']) ? 1 : 0,
            $merged['selectedMonth'],
            $merged['userName'],
        ]);

        return self::get();
    }
}