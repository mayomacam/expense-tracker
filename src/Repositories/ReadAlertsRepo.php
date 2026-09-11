<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class ReadAlertsRepo {
    public static function getAllReadIds(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT alertId FROM read_alerts");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public static function markRead(string $alertId): bool {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("INSERT OR IGNORE INTO read_alerts (alertId) VALUES (?)");
        $stmt->execute([$alertId]);
        return true;
    }

    public static function markAllRead(array $alertIds): bool {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("INSERT OR IGNORE INTO read_alerts (alertId) VALUES (?)");
        $pdo->beginTransaction();
        try {
            foreach ($alertIds as $id) {
                if (is_string($id)) {
                    $stmt->execute([$id]);
                }
            }
            $pdo->commit();
            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function clearAll(): bool {
        $pdo = Database::getInstance();
        $pdo->exec("DELETE FROM read_alerts");
        return true;
    }
}