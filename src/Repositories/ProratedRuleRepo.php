<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class ProratedRuleRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM prorated_rules ORDER BY month DESC, name ASC");
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM prorated_rules WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $rule): array {
        $pdo = Database::getInstance();
        $id = $rule['id'] ?? ('rule-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $tags = is_array($rule['targetTags'] ?? null) ? json_encode($rule['targetTags']) : '[]';

        $stmt = $pdo->prepare("
            INSERT INTO prorated_rules (id, name, categoryId, targetTags, monthlyMaxSpend, month, rolloverEnabled, rolloverAmount, alertThresholdPercent, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $rule['name'],
            $rule['categoryId'] ?? null,
            $tags,
            (float)$rule['monthlyMaxSpend'],
            $rule['month'] ?? date('Y-m'),
            !empty($rule['rolloverEnabled']) ? 1 : 0,
            (float)($rule['rolloverAmount'] ?? 0),
            (float)($rule['alertThresholdPercent'] ?? 100),
            $rule['notes'] ?? null,
        ]);

        return self::getById($id) ?? $rule;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);
        $tags = is_array($merged['targetTags'] ?? null) ? json_encode($merged['targetTags']) : '[]';

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE prorated_rules SET 
                name = ?, categoryId = ?, targetTags = ?, monthlyMaxSpend = ?, 
                month = ?, rolloverEnabled = ?, rolloverAmount = ?, 
                alertThresholdPercent = ?, notes = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['name'],
            $merged['categoryId'] ?? null,
            $tags,
            (float)$merged['monthlyMaxSpend'],
            $merged['month'],
            !empty($merged['rolloverEnabled']) ? 1 : 0,
            (float)($merged['rolloverAmount'] ?? 0),
            (float)($merged['alertThresholdPercent'] ?? 100),
            $merged['notes'] ?? null,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $stmt1 = $pdo->prepare("DELETE FROM prorated_spends WHERE ruleId = ?");
            $stmt1->execute([$id]);

            $stmt2 = $pdo->prepare("DELETE FROM prorated_rules WHERE id = ?");
            $stmt2->execute([$id]);

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
            'name' => (string)$r['name'],
            'categoryId' => $r['categoryId'] !== null ? (string)$r['categoryId'] : null,
            'targetTags' => !empty($r['targetTags']) ? json_decode($r['targetTags'], true) ?: [] : [],
            'monthlyMaxSpend' => (float)$r['monthlyMaxSpend'],
            'month' => (string)$r['month'],
            'rolloverEnabled' => (bool)$r['rolloverEnabled'],
            'rolloverAmount' => (float)($r['rolloverAmount'] ?? 0),
            'alertThresholdPercent' => (float)($r['alertThresholdPercent'] ?? 100),
            'notes' => $r['notes'] !== null ? (string)$r['notes'] : null,
        ];
    }
}