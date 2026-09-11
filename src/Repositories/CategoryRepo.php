<?php
declare(strict_types=1);

namespace ExpenseTracker\Repositories;

use ExpenseTracker\Database;
use PDO;

class CategoryRepo {
    public static function getAll(): array {
        $pdo = Database::getInstance();
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatRow'], $rows);
    }

    public static function getById(string $id): ?array {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::formatRow($row) : null;
    }

    public static function create(array $cat): array {
        $pdo = Database::getInstance();
        $id = $cat['id'] ?? ('cat-' . round(microtime(true) * 1000) . '-' . substr(bin2hex(random_bytes(3)), 0, 4));

        $stmt = $pdo->prepare("
            INSERT INTO categories (id, name, icon, color, monthlyBudget, isCustom)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $cat['name'],
            $cat['icon'] ?? 'Tag',
            $cat['color'] ?? '#6366F1',
            (float)($cat['monthlyBudget'] ?? 0),
            !empty($cat['isCustom']) ? 1 : 0,
        ]);

        return self::getById($id) ?? $cat;
    }

    public static function update(string $id, array $updates): ?array {
        $existing = self::getById($id);
        if (!$existing) return null;

        $merged = array_merge($existing, $updates);

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            UPDATE categories SET 
                name = ?, icon = ?, color = ?, monthlyBudget = ?, isCustom = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $merged['name'],
            $merged['icon'],
            $merged['color'],
            (float)$merged['monthlyBudget'],
            !empty($merged['isCustom']) ? 1 : 0,
            $id,
        ]);

        return self::getById($id);
    }

    public static function delete(string $id): bool {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        return true;
    }

    private static function formatRow(array $r): array {
        return [
            'id' => (string)$r['id'],
            'name' => (string)$r['name'],
            'icon' => (string)$r['icon'],
            'color' => (string)$r['color'],
            'monthlyBudget' => (float)($r['monthlyBudget'] ?? 0),
            'isCustom' => (bool)$r['isCustom'],
        ];
    }
}