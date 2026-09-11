<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class TransactionRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM transactions ORDER BY date DESC, created_at DESC");
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $tx): array {
        $pdo = Database::getInstance();
        $id = $tx['id'] ?? ('tx-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(4)), 0, 5));
        $tags = is_array($tx['tags'] ?? null) ? json_encode($tx['tags']) : '[]';

        $stmt = $pdo->prepare("
            INSERT INTO transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl, proratedRuleId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $tx['title'],
            (float)$tx['amount'],
            $tx['type'],
            $tx['category'],
            $tx['date'],
            $tags,
            $tx['notes'] ?? null,
            $tx['paymentMethod'] ?? 'credit_card',
            !empty($tx['isRecurring']) ? 1 : 0,
            $tx['recurringFrequency'] ?? null,
            $tx['receiptUrl'] ?? null,
            $tx['proratedRuleId'] ?? null,
        ]);

        return self::getById($id) ?? $tx;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);
        $tags = is_array($merged['tags'] ?? null) ? json_encode($merged['tags']) : '[]';

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE transactions SET 
                title = ?, amount = ?, type = ?, category = ?, date = ?, 
                tags = ?, notes = ?, paymentMethod = ?, isRecurring = ?, 
                recurringFrequency = ?, receiptUrl = ?, proratedRuleId = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['title'],
            (float)$merged['amount'],
            $merged['type'],
            $merged['category'],
            $merged['date'],
            $tags,
            $merged['notes'] ?? null,
            $merged['paymentMethod'] ?? 'credit_card',
            !empty($merged['isRecurring']) ? 1 : 0,
            $merged['recurringFrequency'] ?? null,
            $merged['receiptUrl'] ?? null,
            $merged['proratedRuleId'] ?? null,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $existing = self::getById($id);
        if ($existing) {
            $pdo = Database::getInstance();
            $stmt = $pdo->prepare("
                INSERT INTO deleted_transactions (id, title, amount, type, category, date, tags, notes, paymentMethod, isRecurring, recurringFrequency, receiptUrl)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $tags = is_array($existing['tags'] ?? null) ? json_encode($existing['tags']) : '[]';
            $stmt->execute([
                $existing['id'],
                $existing['title'],
                (float)$existing['amount'],
                $existing['type'],
                $existing['category'],
                $existing['date'],
                $tags,
                $existing['notes'] ?? null,
                $existing['paymentMethod'] ?? 'credit_card',
                !empty($existing['isRecurring']) ? 1 : 0,
                $existing['recurringFrequency'] ?? null,
                $existing['receiptUrl'] ?? null,
            ]);

            $delStmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
            $delStmt->execute([$id]);
            return true;
        }
        return false;
    }

    public static function bulkInsert(array $txs): array {
        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $created = [];
            foreach ($txs as $tx) {
                $created[] = self::create($tx);
            }
            $pdo->commit();
            return $created;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
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
            'proratedRuleId' => !empty($r['proratedRuleId']) ? (string)$r['proratedRuleId'] : null,
            'created_at' => $r['created_at'] ?? null,
        ];
    }
}