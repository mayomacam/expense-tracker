<?php
declare(strict_types=1);

/**
 * Universal Database Configuration (PHP 8.3+)
 * Portable across local XAMPP and Linux/cPanel Web Hosting
 */

// 1. Check for environment override (e.g. Docker, VPS, or cloud host)
$envPath = getenv('DATABASE_PATH');

// 2. Primary portable self-contained database path inside this package
$localPackageDb = dirname(__DIR__) . '/data/budget.sqlite';

// 3. Fallback to external project database if present
$externalDb = dirname(__DIR__, 2) . '/data/budget.sqlite';

if (!empty($envPath) && is_string($envPath)) {
    $resolvedDbPath = $envPath;
} elseif (file_exists($localPackageDb)) {
    $resolvedDbPath = $localPackageDb;
} elseif (file_exists($externalDb)) {
    $resolvedDbPath = $externalDb;
} else {
    $resolvedDbPath = $localPackageDb;
}

// Resolve secret key file location for admin resets
$secretKeyFile = dirname($resolvedDbPath) . '/.secret_reset_password.key';

return [
    'sqlite_path' => $resolvedDbPath,
    'secret_key_file' => $secretKeyFile,
    'default_reset_password' => getenv('RESET_PASSWORD') ?: 'admin123',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ],
];