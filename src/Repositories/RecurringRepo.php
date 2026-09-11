<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class RecurringRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM recurring_items ORDER BY dayOfMonth ASC");
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM recurring_items WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $item): array {
        $pdo = Database::getInstance();
        $id = $item['id'] ?? ('rec-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $tags = is_array($item['tags'] ?? null) ? json_encode($item['tags']) : '[]';

        $stmt = $pdo->prepare("
            INSERT INTO recurring_items (id, title, amount, type, category, frequency, dayOfMonth, autoApply, tags, paymentMethod, lastAppliedMonth, isActive)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $item['title'],
            (float)$item['amount'],
            $item['type'] ?? 'expense',
            $item['category'],
            $item['frequency'] ?? 'monthly',
            (int)($item['dayOfMonth'] ?? 1),
            ($item['autoApply'] ?? true) ? 1 : 0,
            $tags,
            $item['paymentMethod'] ?? 'credit_card',
            $item['lastAppliedMonth'] ?? null,
            ($item['isActive'] ?? true) ? 1 : 0,
        ]);

        return self::getById($id) ?? $item;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);
        $tags = is_array($merged['tags'] ?? null) ? json_encode($merged['tags']) : '[]';

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE recurring_items SET 
                title = ?, amount = ?, type = ?, category = ?, 
                frequency = ?, dayOfMonth = ?, autoApply = ?, 
                tags = ?, paymentMethod = ?, lastAppliedMonth = ?, 
                isActive = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['title'],
            (float)$merged['amount'],
            $merged['type'],
            $merged['category'],
            $merged['frequency'],
            (int)$merged['dayOfMonth'],
            !empty($merged['autoApply']) ? 1 : 0,
            $tags,
            $merged['paymentMethod'],
            $merged['lastAppliedMonth'] ?? null,
            !empty($merged['isActive']) ? 1 : 0,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("DELETE FROM recurring_items WHERE id = ?");
        $stmt->execute([$id]);
        return true;
    }

    public static function applyRecurring(string $month = '', bool $forceAll = false): array {
        $targetMonth = !empty($month) ? $month : date('Y-m');
        $allRecurring = self::getAll();
        $addedCount = 0;
        $clonedTitles = [];

        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            foreach ($allRecurring as $rec) {
                if (empty($rec['isActive'])) continue;
                if (!$forceAll && empty($rec['autoApply'])) continue;
                if (($rec['lastAppliedMonth'] ?? '') === $targetMonth) continue;

                $day = min(28, max(1, (int)($rec['dayOfMonth'] ?? 1)));
                $dayStr = str_pad((string)$day, 2, '0', STR_PAD_LEFT);
                $txDate = "{$targetMonth}-{$dayStr}";

                $txId = 'tx-rec-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
                $recTags = is_array($rec['tags'] ?? null) ? $rec['tags'] : [];
                $recTags[] = 'recurring_auto';

                TransactionRepo::create([
                    'id' => $txId,
                    'title' => $rec['title'] . ' (Recurring)',
                    'amount' => (float)$rec['amount'],
                    'type' => $rec['type'],
                    'category' => $rec['category'],
                    'date' => $txDate,
                    'tags' => array_values(array_unique($recTags)),
                    'paymentMethod' => $rec['paymentMethod'] ?? 'credit_card',
                    'isRecurring' => true,
                    'recurringFrequency' => $rec['frequency'],
                    'notes' => "Auto-cloned recurring item for {$targetMonth}",
                ]);

                self::update($rec['id'], ['lastAppliedMonth' => $targetMonth]);
                $addedCount++;
                $clonedTitles[] = $rec['title'];
            }

            $pdo->commit();
            return [
                'success' => true,
                'addedCount' => $addedCount,
                'month' => $targetMonth,
                'clonedTitles' => $clonedTitles,
            ];
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
            'frequency' => (string)$r['frequency'],
            'dayOfMonth' => (int)$r['dayOfMonth'],
            'autoApply' => (bool)$r['autoApply'],
            'isActive' => (bool)$r['isActive'],
            'tags' => !empty($r['tags']) ? json_decode($r['tags'], true) ?: [] : [],
            'paymentMethod' => (string)$r['paymentMethod'],
            'lastAppliedMonth' => $r['lastAppliedMonth'] !== null ? (string)$r['lastAppliedMonth'] : null,
        ];
    }
}