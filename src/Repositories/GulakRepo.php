<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class GulakRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $pots = $pdo->query("SELECT * FROM gulak_pots ORDER BY created_at ASC")->fetchAll();
        $entriesStmt = $pdo->query("SELECT * FROM gulak_entries ORDER BY date DESC, created_at DESC");
        $allEntries = $entriesStmt->fetchAll();

        return array_map(function($p) use ($allEntries) {
            $entries = array_values(array_filter($allEntries, fn($e) => $e['potId'] === $p['id']));
            return self::formatPot($p, $entries);
        }, $pots);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM gulak_pots WHERE id = ?");
        $stmt->execute([$id]);
        $p = $stmt->fetch();
        if (!$p) return null;

        $eStmt = $pdo->prepare("SELECT * FROM gulak_entries WHERE potId = ? ORDER BY date DESC, created_at DESC");
        $eStmt->execute([$id]);
        $entries = $eStmt->fetchAll();

        return self::formatPot($p, $entries);
    }

    public static function create(array $pot): array {
        $pdo = Database::getInstance();
        $id = $pot['id'] ?? ('pot-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));

        $stmt = $pdo->prepare("
            INSERT INTO gulak_pots (id, name, targetAmount, currentBalance, icon, color, notes, isLocked, lockUntilDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $pot['name'],
            (float)($pot['targetAmount'] ?? 0),
            (float)($pot['currentBalance'] ?? 0),
            $pot['icon'] ?? 'PiggyBank',
            $pot['color'] ?? '#10B981',
            $pot['notes'] ?? null,
            !empty($pot['isLocked']) ? 1 : 0,
            $pot['lockUntilDate'] ?? null,
        ]);

        return self::getById($id) ?? $pot;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE gulak_pots SET 
                name = ?, targetAmount = ?, currentBalance = ?, icon = ?, color = ?, 
                notes = ?, isLocked = ?, lockUntilDate = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['name'],
            (float)$merged['targetAmount'],
            (float)$merged['currentBalance'],
            $merged['icon'] ?? 'PiggyBank',
            $merged['color'] ?? '#10B981',
            $merged['notes'] ?? null,
            !empty($merged['isLocked']) ? 1 : 0,
            $merged['lockUntilDate'] ?? null,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $stmt1 = $pdo->prepare("DELETE FROM gulak_entries WHERE potId = ?");
            $stmt1->execute([$id]);

            $stmt2 = $pdo->prepare("DELETE FROM gulak_pots WHERE id = ?");
            $stmt2->execute([$id]);

            $pdo->commit();
            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function addEntry(string $potId, array $entry): ?array {
        $pot = self::getById($potId);
        if (!$pot) return null;

        $pdo = Database::getInstance();
        $id = $entry['id'] ?? ('ge-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $amount = (float)$entry['amount'];
        $type = ($entry['type'] ?? 'deposit') === 'withdraw' ? 'withdraw' : 'deposit';
        $breakdown = is_array($entry['breakdown'] ?? null) ? json_encode($entry['breakdown']) : '{}';

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO gulak_entries (id, potId, type, amount, title, date, notes, breakdown)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $potId,
                $type,
                $amount,
                $entry['title'] ?? ($type === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal'),
                $entry['date'] ?? date('Y-m-d'),
                $entry['notes'] ?? null,
                $breakdown,
            ]);

            $delta = ($type === 'deposit') ? $amount : -$amount;
            $newBalance = max(0.0, (float)$pot['currentBalance'] + $delta);

            $uStmt = $pdo->prepare("UPDATE gulak_pots SET currentBalance = ? WHERE id = ?");
            $uStmt->execute([$newBalance, $potId]);

            $pdo->commit();
            return self::getById($potId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function smash(string $potId, ?string $note = null): ?array {
        $pot = self::getById($potId);
        if (!$pot || (float)$pot['currentBalance'] <= 0) return $pot;

        $pdo = Database::getInstance();
        $amount = (float)$pot['currentBalance'];
        $entryId = 'ge-smash-' . round(microtime(true) * 1000);
        $date = date('Y-m-d');
        $title = '🔨 Smashed Piggy Bank Payout';

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO gulak_entries (id, potId, type, amount, title, date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $entryId,
                $potId,
                'withdraw',
                $amount,
                $title,
                $date,
                $note ?? 'Gulak broken & cash withdrawn',
            ]);

            $uStmt = $pdo->prepare("UPDATE gulak_pots SET currentBalance = 0 WHERE id = ?");
            $uStmt->execute([$potId]);

            $pdo->commit();
            return self::getById($potId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function deleteEntry(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM gulak_entries WHERE id = ?");
        $stmt->execute([$id]);
        $entry = $stmt->fetch();
        if (!$entry) return null;

        $potId = (string)$entry['potId'];
        $amount = (float)$entry['amount'];
        $type = (string)$entry['type'];

        $pdo->beginTransaction();
        try {
            $delStmt = $pdo->prepare("DELETE FROM gulak_entries WHERE id = ?");
            $delStmt->execute([$id]);

            $pot = self::getById($potId);
            if ($pot) {
                $delta = ($type === 'deposit') ? -$amount : $amount;
                $newBalance = max(0.0, (float)$pot['currentBalance'] + $delta);
                $uStmt = $pdo->prepare("UPDATE gulak_pots SET currentBalance = ? WHERE id = ?");
                $uStmt->execute([$newBalance, $potId]);
            }

            $pdo->commit();
            return self::getById($potId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private static function formatPot(array $p, array $entries): array {
        return [
            'id' => (string)$p['id'],
            'name' => (string)$p['name'],
            'targetAmount' => (float)($p['targetAmount'] ?? 0),
            'currentBalance' => (float)($p['currentBalance'] ?? 0),
            'icon' => $p['icon'] !== null ? (string)$p['icon'] : 'PiggyBank',
            'color' => $p['color'] !== null ? (string)$p['color'] : '#10B981',
            'notes' => $p['notes'] !== null ? (string)$p['notes'] : null,
            'isLocked' => (bool)$p['isLocked'],
            'lockUntilDate' => $p['lockUntilDate'] !== null ? (string)$p['lockUntilDate'] : null,
            'created_at' => $p['created_at'] ?? null,
            'entries' => array_map(function($e) {
                return [
                    'id' => (string)$e['id'],
                    'potId' => (string)$e['potId'],
                    'type' => (string)$e['type'],
                    'amount' => (float)$e['amount'],
                    'title' => (string)$e['title'],
                    'date' => (string)$e['date'],
                    'notes' => $e['notes'] !== null ? (string)$e['notes'] : null,
                    'breakdown' => !empty($e['breakdown']) ? json_decode($e['breakdown'], true) : new \stdClass(),
                    'created_at' => $e['created_at'] ?? null,
                ];
            }, $entries),
        ];
    }
}