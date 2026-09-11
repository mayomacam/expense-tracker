<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class DeletedTransactionRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM deleted_transactions ORDER BY deleted_at DESC");
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM deleted_transactions WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::formatRow($row) : null;
    }

    public static function restore(string $id): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $delStmt = $pdo->prepare("DELETE FROM deleted_transactions WHERE id = ?");
            $delStmt->execute([$id]);

            TransactionRepo::create($existing);
            $pdo->commit();
            return $existing;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function emptyTrash(): bool {
        $pdo = Database::getInstance();
        $pdo->exec("DELETE FROM deleted_transactions");
        return true;
    }

    private static function formatRow(array $r): array {
        return [
            'id' => (string)$r['id'],
            'title' => (string)$r['title'],
            'amount' => (float)$r['amount'],
            'type' => (string)$r['type'],
            'category' => (string)$r['category'],
            'date' => (string)$r['date'],
            'tags' => !empty($r['tags']) ? json_decode($r['tags'], true) ?: [] : [],
            'notes' => $r['notes'] !== null ? (string)$r['notes'] : null,
            'paymentMethod' => (string)$r['paymentMethod'],
            'isRecurring' => (bool)$r['isRecurring'],
            'recurringFrequency' => $r['recurringFrequency'] !== null ? (string)$r['recurringFrequency'] : null,
            'receiptUrl' => $r['receiptUrl'] !== null ? (string)$r['receiptUrl'] : null,
            'proratedRuleId' => !empty($r['proratedRuleId'] ?? null) ? (string)$r['proratedRuleId'] : null,
            'deleted_at' => $r['deleted_at'] ?? null,
        ];
    }
}