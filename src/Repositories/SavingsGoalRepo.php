<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class SavingsGoalRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $goals = $pdo->query("SELECT * FROM savings_goals ORDER BY targetDate ASC")->fetchAll();
        $historyStmt = $pdo->query("SELECT * FROM savings_history ORDER BY date DESC");
        $allHistory = $historyStmt->fetchAll();

        return array_map(function($g) use ($allHistory) {
            $history = array_values(array_filter($allHistory, fn($h) => $h['goalId'] === $g['id']));
            return self::formatGoal($g, $history);
        }, $goals);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM savings_goals WHERE id = ?");
        $stmt->execute([$id]);
        $g = $stmt->fetch();
        if (!$g) return null;

        $hStmt = $pdo->prepare("SELECT * FROM savings_history WHERE goalId = ? ORDER BY date DESC");
        $hStmt->execute([$id]);
        $history = $hStmt->fetchAll();

        return self::formatGoal($g, $history);
    }

    public static function create(array $goal): array {
        $pdo = Database::getInstance();
        $id = $goal['id'] ?? ('goal-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));

        $stmt = $pdo->prepare("
            INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, icon, color, category, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $goal['name'],
            (float)$goal['targetAmount'],
            (float)($goal['currentAmount'] ?? 0),
            $goal['targetDate'],
            $goal['icon'] ?? 'PiggyBank',
            $goal['color'] ?? '#10B981',
            $goal['category'] ?? 'General',
            $goal['notes'] ?? null,
        ]);

        return self::getById($id) ?? $goal;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE savings_goals SET 
                name = ?, targetAmount = ?, currentAmount = ?, targetDate = ?, 
                icon = ?, color = ?, category = ?, notes = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['name'],
            (float)$merged['targetAmount'],
            (float)$merged['currentAmount'],
            $merged['targetDate'],
            $merged['icon'] ?? null,
            $merged['color'] ?? null,
            $merged['category'] ?? null,
            $merged['notes'] ?? null,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $stmt1 = $pdo->prepare("DELETE FROM savings_history WHERE goalId = ?");
            $stmt1->execute([$id]);

            $stmt2 = $pdo->prepare("DELETE FROM savings_goals WHERE id = ?");
            $stmt2->execute([$id]);

            $pdo->commit();
            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function addContribution(string $goalId, array $item): ?array {
        $existing = self::getById($goalId);
        if (!$existing) return null;

        $pdo = Database::getInstance();
        $id = $item['id'] ?? ('contrib-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $amount = (float)$item['amount'];
        $type = $item['type'] ?? 'deposit';

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO savings_history (id, goalId, date, amount, note, type)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $goalId,
                $item['date'] ?? date('Y-m-d'),
                $amount,
                $item['note'] ?? null,
                $type,
            ]);

            $delta = ($type === 'deposit') ? $amount : -$amount;
            $newCurrent = max(0.0, (float)$existing['currentAmount'] + $delta);

            $updateStmt = $pdo->prepare("UPDATE savings_goals SET currentAmount = ? WHERE id = ?");
            $updateStmt->execute([$newCurrent, $goalId]);

            $pdo->commit();
            return self::getById($goalId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private static function formatGoal(array $g, array $history): array {
        return [
            'id' => (string)$g['id'],
            'name' => (string)$g['name'],
            'targetAmount' => (float)$g['targetAmount'],
            'currentAmount' => (float)($g['currentAmount'] ?? 0),
            'targetDate' => (string)$g['targetDate'],
            'icon' => $g['icon'] !== null ? (string)$g['icon'] : 'PiggyBank',
            'color' => $g['color'] !== null ? (string)$g['color'] : '#10B981',
            'category' => $g['category'] !== null ? (string)$g['category'] : 'General',
            'notes' => $g['notes'] !== null ? (string)$g['notes'] : null,
            'history' => array_map(function($h) {
                return [
                    'id' => (string)$h['id'],
                    'date' => (string)$h['date'],
                    'amount' => (float)$h['amount'],
                    'note' => $h['note'] !== null ? (string)$h['note'] : null,
                    'type' => (string)$h['type'],
                ];
            }, $history),
        ];
    }
}