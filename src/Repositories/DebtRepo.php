<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class DebtRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $debts = $pdo->query("SELECT * FROM debts ORDER BY dueDay ASC")->fetchAll();
        $paymentsStmt = $pdo->query("SELECT * FROM debt_payments ORDER BY date DESC");
        $allPayments = $paymentsStmt->fetchAll();

        return array_map(function($d) use ($allPayments) {
            $payments = array_values(array_filter($allPayments, fn($p) => $p['debtId'] === $d['id']));
            return self::formatDebt($d, $payments);
        }, $debts);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM debts WHERE id = ?");
        $stmt->execute([$id]);
        $d = $stmt->fetch();
        if (!$d) return null;

        $pStmt = $pdo->prepare("SELECT * FROM debt_payments WHERE debtId = ? ORDER BY date DESC");
        $pStmt->execute([$id]);
        $payments = $pStmt->fetchAll();

        return self::formatDebt($d, $payments);
    }

    public static function create(array $debt): array {
        $pdo = Database::getInstance();
        $id = $debt['id'] ?? ('debt-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $principal = (float)$debt['totalPrincipal'];
        $remaining = isset($debt['remainingBalance']) ? (float)$debt['remainingBalance'] : $principal;

        $stmt = $pdo->prepare("
            INSERT INTO debts (id, name, lenderName, debtType, totalPrincipal, remainingBalance, interestRate, minimumPayment, dueDay, notes, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $debt['name'],
            $debt['lenderName'] ?? null,
            $debt['debtType'] ?? 'borrowed',
            $principal,
            $remaining,
            (float)($debt['interestRate'] ?? 0),
            (float)($debt['minimumPayment'] ?? 0),
            (int)($debt['dueDay'] ?? 1),
            $debt['notes'] ?? null,
            $debt['color'] ?? '#F43F5E',
        ]);

        return self::getById($id) ?? $debt;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE debts SET 
                name = ?, lenderName = ?, debtType = ?, totalPrincipal = ?, remainingBalance = ?, 
                interestRate = ?, minimumPayment = ?, dueDay = ?, 
                notes = ?, color = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['name'],
            $merged['lenderName'] ?? null,
            $merged['debtType'] ?? 'borrowed',
            (float)$merged['totalPrincipal'],
            (float)$merged['remainingBalance'],
            (float)($merged['interestRate'] ?? 0),
            (float)($merged['minimumPayment'] ?? 0),
            (int)($merged['dueDay'] ?? 1),
            $merged['notes'] ?? null,
            $merged['color'] ?? null,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $stmt1 = $pdo->prepare("DELETE FROM debt_payments WHERE debtId = ?");
            $stmt1->execute([$id]);

            $stmt2 = $pdo->prepare("DELETE FROM debts WHERE id = ?");
            $stmt2->execute([$id]);

            $pdo->commit();
            return true;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function recordPayment(string $debtId, array $payment): ?array {
        $existing = self::getById($debtId);
        if (!$existing) return null;

        $pdo = Database::getInstance();
        $id = $payment['id'] ?? ('pay-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));
        $amount = (float)$payment['amount'];
        $principalPaid = (float)($payment['principalPaid'] ?? $amount);
        $interestPaid = (float)($payment['interestPaid'] ?? 0);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO debt_payments (id, debtId, date, amount, principalPaid, interestPaid, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $debtId,
                $payment['date'] ?? date('Y-m-d'),
                $amount,
                $principalPaid,
                $interestPaid,
                $payment['note'] ?? null,
            ]);

            $newBalance = max(0.0, (float)$existing['remainingBalance'] - $principalPaid);
            $uStmt = $pdo->prepare("UPDATE debts SET remainingBalance = ? WHERE id = ?");
            $uStmt->execute([$newBalance, $debtId]);

            $pdo->commit();
            return self::getById($debtId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function deletePayment(string $debtId, string $paymentId): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM debt_payments WHERE id = ? AND debtId = ?");
        $stmt->execute([$paymentId, $debtId]);
        $p = $stmt->fetch();
        if (!$p) return null;

        $pdo->beginTransaction();
        try {
            $delStmt = $pdo->prepare("DELETE FROM debt_payments WHERE id = ?");
            $delStmt->execute([$paymentId]);

            $debt = self::getById($debtId);
            if ($debt) {
                $newBalance = min((float)$debt['totalPrincipal'], (float)$debt['remainingBalance'] + (float)$p['principalPaid']);
                $uStmt = $pdo->prepare("UPDATE debts SET remainingBalance = ? WHERE id = ?");
                $uStmt->execute([$newBalance, $debtId]);
            }

            $pdo->commit();
            return self::getById($debtId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private static function formatDebt(array $d, array $payments): array {
        return [
            'id' => (string)$d['id'],
            'name' => (string)$d['name'],
            'lenderName' => $d['lenderName'] !== null ? (string)$d['lenderName'] : null,
            'debtType' => (string)($d['debtType'] ?? 'borrowed'),
            'totalPrincipal' => (float)$d['totalPrincipal'],
            'remainingBalance' => (float)$d['remainingBalance'],
            'interestRate' => (float)($d['interestRate'] ?? 0),
            'minimumPayment' => (float)($d['minimumPayment'] ?? 0),
            'dueDay' => (int)($d['dueDay'] ?? 1),
            'notes' => $d['notes'] !== null ? (string)$d['notes'] : null,
            'color' => $d['color'] !== null ? (string)$d['color'] : '#F43F5E',
            'payments' => array_map(function($p) {
                return [
                    'id' => (string)$p['id'],
                    'date' => (string)$p['date'],
                    'amount' => (float)$p['amount'],
                    'principalPaid' => (float)$p['principalPaid'],
                    'interestPaid' => (float)($p['interestPaid'] ?? 0),
                    'note' => $p['note'] !== null ? (string)$p['note'] : null,
                ];
            }, $payments),
        ];
    }
}