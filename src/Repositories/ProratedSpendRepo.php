<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class ProratedSpendRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM prorated_spends ORDER BY date DESC, created_at DESC");
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getByRuleId(string $ruleId): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM prorated_spends WHERE ruleId = ? ORDER BY date DESC, created_at DESC");
        $stmt->execute([$ruleId]);
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM prorated_spends WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $spend): array {
        $pdo = Database::getInstance();
        $id = $spend['id'] ?? ('pspend-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $addToMain = !empty($spend['addToMainTransactions']);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO prorated_spends (id, ruleId, title, amount, date, notes, addToMainTransactions)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $spend['ruleId'],
                $spend['title'],
                (float)$spend['amount'],
                $spend['date'],
                $spend['notes'] ?? null,
                $addToMain ? 1 : 0,
            ]);

            if ($addToMain) {
                $txId = 'tx-prorated-' . $id;
                $rule = ProratedRuleRepo::getById($spend['ruleId']);
                TransactionRepo::create([
                    'id' => $txId,
                    'title' => $spend['title'],
                    'amount' => (float)$spend['amount'],
                    'type' => 'expense',
                    'category' => $rule['categoryId'] ?? 'food',
                    'date' => $spend['date'],
                    'tags' => ['prorated'],
                    'notes' => $spend['notes'] ?? ('Prorated spend for ' . ($rule['name'] ?? $spend['ruleId'])),
                    'paymentMethod' => 'credit_card',
                    'isRecurring' => false,
                    'proratedRuleId' => $spend['ruleId'],
                ]);
            }

            $pdo->commit();
            return self::getById($id) ?? $spend;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $stmt1 = $pdo->prepare("DELETE FROM prorated_spends WHERE id = ?");
            $stmt1->execute([$id]);

            $stmt2 = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
            $stmt2->execute(['tx-prorated-' . $id]);

            $pdo->commit();
            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private static function formatRow(array $r): array {
        return [
            'id' => (string)$r['id'],
            'ruleId' => (string)$r['ruleId'],
            'title' => (string)$r['title'],
            'amount' => (float)$r['amount'],
            'date' => (string)$r['date'],
            'notes' => $r['notes'] !== null ? (string)$r['notes'] : null,
            'addToMainTransactions' => (bool)$r['addToMainTransactions'],
            'created_at' => $r['created_at'] ?? null,
        ];
    }
}