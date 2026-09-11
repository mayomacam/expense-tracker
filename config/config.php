<?php
declare(strict_types=1);

/**
 * Global Configuration & Helper Functions
 */

// Error handling: log errors without leaking internals in API output
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Base path detection for XAMPP subdirectories
function getBasePath(): string {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $dir = str_replace('\\', '/', dirname($scriptName));
    return rtrim($dir, '/');
}

// Global JSON Response sender
function jsonResponse($data, int $status = 200, array $headers = []): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');

    foreach ($headers as $key => $val) {
        header("$key: $val");
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Global JSON Error sender
function jsonError(string $message, int $status = 400, $details = null): void {
    $response = ['error' => $message];
    if ($details !== null) {
        $response['details'] = $details;
    }
    jsonResponse($response, $status);
}

// Request Body JSON Parser with malformed JSON protection
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST ?? [];
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Invalid JSON format in request body.', 400);
    }
    return is_array($decoded) ? $decoded : [];
}

// Reset password resolver with persistent secret file
function getExpectedResetPassword(string $secretFilePath, string $defaultPassword): string {
    try {
        if (file_exists($secretFilePath)) {
            $pass = trim((string)file_get_contents($secretFilePath));
            if (!empty($pass)) {
                return $pass;
            }
        }
    } catch (\Throwable $e) {
        // Fallback
    }

    // Ensure directory exists and write secret key file if missing
    try {
        $dir = dirname($secretFilePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($secretFilePath, $defaultPassword);
    } catch (\Throwable $e) {
        // Suppress file write errors
    }

    return $defaultPassword;
}