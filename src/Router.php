<?php
declare(strict_types=1);

namespace ExpenseTracker;

class Router {
    private array $routes = [];

    public function get(string $path, callable $handler): self {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): self {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): self {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): self {
        return $this->addRoute('DELETE', $path, $handler);
    }

    public function options(string $path, callable $handler): self {
        return $this->addRoute('OPTIONS', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable $handler): self {
        $pattern = preg_replace('#:([a-zA-Z0-9_]+)#', '(?P<$1>[^/]+)', $path);
        $regex = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'regex' => $regex,
            'handler' => $handler,
        ];
        return $this;
    }

    public function dispatch(string $method, string $uri): void {
        // Strip query string
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';

        // Normalize base path for subfolder deployments (e.g. /php_version)
        $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
        if ($scriptDir !== '/' && str_starts_with($path, $scriptDir)) {
            $path = substr($path, strlen($scriptDir));
        }

        $path = '/' . trim($path, '/');
        $method = strtoupper($method);

        // Preflight CORS handler
        if ($method === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            http_response_code(204);
            exit;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['regex'], $path, $matches)) {
                $params = [];
                foreach ($matches as $key => $val) {
                    if (is_string($key)) {
                        $params[$key] = urldecode($val);
                    }
                }

                try {
                    call_user_func($route['handler'], $params);
                    return;
                } catch (\Throwable $e) {
                    error_log('API Error in ' . $route['path'] . ': ' . $e->getMessage());
                    jsonError('An internal server error occurred.', 500);
                }
            }
        }

        // Route not found
        jsonError("Route not found: {$method} {$path}", 404);
    }
}