<?php
declare(strict_types=1);

/**
 * Front Controller for Expense & Prorated Budget Tracker
 * Serves API requests, static assets, and the Single Page Dashboard
 */

require_once __DIR__ . '/config/config.php';
$dbConfig = require __DIR__ . '/config/database.php';

// Autoloader
spl_autoload_register(function (string $class) {
    $prefix = 'ExpenseTracker\\';
    $baseDir = __DIR__ . '/src/';

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

$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?? '/';

// Normalize path relative to this script directory
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
if ($scriptDir !== '/' && str_starts_with($path, $scriptDir)) {
    $path = substr($path, strlen($scriptDir));
}
$path = '/' . trim($path, '/');

// Security Defense-in-Depth: Reject any request targeting sensitive extensions
if (preg_match('/\.(sqlite|db|key|env|sql|log)$/i', $path)) {
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    echo "<h1>403 Forbidden</h1><p>Access to sensitive data files is strictly forbidden.</p>";
    exit;
}

// 1. Dispatch API routes
if (str_starts_with($path, '/api')) {
    ExpenseTracker\Database::init($dbConfig);
    $router = new ExpenseTracker\Router();
    ExpenseTracker\Controllers\ApiController::registerRoutes($router, $dbConfig);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $router->dispatch($method, $uri);
    exit;
}

// 2. Serve static assets if requested directly
if (str_starts_with($path, '/assets/')) {
    $assetFile = __DIR__ . $path;
    if (file_exists($assetFile) && is_file($assetFile)) {
        $ext = pathinfo($assetFile, PATHINFO_EXTENSION);
        $mimes = [
            'js' => 'application/javascript; charset=utf-8',
            'css' => 'text/css; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
        ];
        $contentType = $mimes[$ext] ?? 'application/octet-stream';
        header("Content-Type: {$contentType}");
        readfile($assetFile);
        exit;
    }
}

// 3. Serve Frontend Single Page App
$htmlFile = __DIR__ . '/index.html';
if (file_exists($htmlFile)) {
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $basePath = ($scriptDir === '/' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');
    
    $html = file_get_contents($htmlFile);
    $injected = "<script>window.__APP_BASE__ = " . json_encode($basePath) . ";</script>";
    $html = str_replace('<head>', "<head>\n    " . $injected, $html);

    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

echo "<h1>Expense Tracker</h1><p>Frontend template not found. Please ensure index.html exists in the application root.</p>";