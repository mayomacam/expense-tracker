<?php
declare(strict_types=1);

/**
 * Dedicated API Gateway
 */

require_once __DIR__ . '/../config/config.php';
$dbConfig = require __DIR__ . '/../config/database.php';

// Autoload application classes
spl_autoload_register(function (string $class) {
    $prefix = 'ExpenseTracker\\';
    $baseDir = dirname(__DIR__) . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// Initialize Database singleton
ExpenseTracker\Database::init($dbConfig);

// Setup router and register API routes
$router = new ExpenseTracker\Router();
ExpenseTracker\Controllers\ApiController::registerRoutes($router, $dbConfig);

// Dispatch request
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/api';
$router->dispatch($method, $uri);