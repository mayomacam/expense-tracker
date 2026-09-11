<?php
declare(strict_types=1);

namespace ExpenseTracker\Controllers;

use ExpenseTracker\Router;
use ExpenseTracker\Repositories\TransactionRepo;
use ExpenseTracker\Repositories\DeletedTransactionRepo;
use ExpenseTracker\Repositories\CategoryRepo;
use ExpenseTracker\Repositories\ProratedRuleRepo;
use ExpenseTracker\Repositories\ProratedSpendRepo;
use ExpenseTracker\Repositories\SavingsGoalRepo;
use ExpenseTracker\Repositories\DebtRepo;
use ExpenseTracker\Repositories\RecurringRepo;
use ExpenseTracker\Repositories\SettingsRepo;
use ExpenseTracker\Repositories\ReadAlertsRepo;
use ExpenseTracker\Repositories\GulakRepo;
use ExpenseTracker\Repositories\DatabaseStatsRepo;

class ApiController {
    public static function registerRoutes(Router $router, array $dbConfig): void {
        // === Database Stats & Reset ===
        $router->get('/api/db/status', function() {
            jsonResponse(DatabaseStatsRepo::getStats());
        });

        $handleReset = function() use ($dbConfig) {
            $input = getJsonInput();
            $password = (string)($input['password'] ?? '');
            $res = DatabaseStatsRepo::resetAllDataToZero($password, $dbConfig);
            if (!$res['success']) {
                jsonError($res['error'], $res['status']);
            }
            jsonResponse(['success' => true, 'message' => $res['message']]);
        };

        $router->post('/api/db/reset', $handleReset);
        $router->post('/api/db/reset-to-zero', $handleReset);

        // === Transactions ===
        $router->get('/api/transactions', function() {
            jsonResponse(TransactionRepo::getAll());
        });

        $router->get('/api/transactions/:id', function($params) {
            $tx = TransactionRepo::getById($params['id']);
            if (!$tx) jsonError('Transaction not found', 404);
            jsonResponse($tx);
        });

        $router->post('/api/transactions', function() {
            $body = getJsonInput();
            if (!isset($body['title'], $body['amount'], $body['type'], $body['category'], $body['date'])) {
                jsonError('Missing required transaction fields', 400);
            }
            $created = TransactionRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->post('/api/transactions/import', function() {
            $body = getJsonInput();
            if (!isset($body['transactions']) || !is_array($body['transactions'])) {
                jsonError('transactions array is required', 400);
            }
            $imported = TransactionRepo::bulkInsert($body['transactions']);
            jsonResponse(['success' => true, 'count' => count($imported), 'transactions' => $imported], 201);
        });

        $router->put('/api/transactions/:id', function($params) {
            $body = getJsonInput();
            $updated = TransactionRepo::update($params['id'], $body);
            if (!$updated) jsonError('Transaction not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/transactions/:id', function($params) {
            TransactionRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        // === Deleted Transactions (Trash) ===
        $router->get('/api/deleted-transactions', function() {
            jsonResponse(DeletedTransactionRepo::getAll());
        });

        $router->post('/api/deleted-transactions/:id/restore', function($params) {
            $restored = DeletedTransactionRepo::restore($params['id']);
            if (!$restored) jsonError('Deleted transaction not found', 404);
            jsonResponse(['success' => true, 'restored' => $restored]);
        });

        $router->delete('/api/deleted-transactions', function() {
            DeletedTransactionRepo::emptyTrash();
            jsonResponse(['success' => true, 'message' => 'Trash bin emptied clean.']);
        });

        // === Categories ===
        $router->get('/api/categories', function() {
            jsonResponse(CategoryRepo::getAll());
        });

        $router->post('/api/categories', function() {
            $body = getJsonInput();
            if (empty($body['name'])) jsonError('Category name is required', 400);
            $created = CategoryRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->put('/api/categories/:id', function($params) {
            $body = getJsonInput();
            $updated = CategoryRepo::update($params['id'], $body);
            if (!$updated) jsonError('Category not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/categories/:id', function($params) {
            CategoryRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        // === Prorated Budget Rules ===
        $router->get('/api/prorated-rules', function() {
            jsonResponse(ProratedRuleRepo::getAll());
        });

        $router->post('/api/prorated-rules', function() {
            $body = getJsonInput();
            if (empty($body['name']) || !isset($body['monthlyMaxSpend'])) {
                jsonError('Rule name and monthlyMaxSpend are required', 400);
            }
            $created = ProratedRuleRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->put('/api/prorated-rules/:id', function($params) {
            $body = getJsonInput();
            $updated = ProratedRuleRepo::update($params['id'], $body);
            if (!$updated) jsonError('Prorated rule not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/prorated-rules/:id', function($params) {
            ProratedRuleRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        // === Prorated Spends ===
        $router->get('/api/prorated-spends', function() {
            $ruleId = $_GET['ruleId'] ?? null;
            if ($ruleId) {
                jsonResponse(ProratedSpendRepo::getByRuleId((string)$ruleId));
            } else {
                jsonResponse(ProratedSpendRepo::getAll());
            }
        });

        $router->post('/api/prorated-spends', function() {
            $body = getJsonInput();
            if (empty($body['ruleId']) || empty($body['title']) || !isset($body['amount'])) {
                jsonError('ruleId, title, and amount are required', 400);
            }
            $created = ProratedSpendRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->delete('/api/prorated-spends/:id', function($params) {
            ProratedSpendRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        // === Savings Goals ===
        $router->get('/api/savings-goals', function() {
            jsonResponse(SavingsGoalRepo::getAll());
        });

        $router->post('/api/savings-goals', function() {
            $body = getJsonInput();
            if (empty($body['name']) || !isset($body['targetAmount'])) {
                jsonError('Goal name and targetAmount are required', 400);
            }
            $created = SavingsGoalRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->put('/api/savings-goals/:id', function($params) {
            $body = getJsonInput();
            $updated = SavingsGoalRepo::update($params['id'], $body);
            if (!$updated) jsonError('Goal not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/savings-goals/:id', function($params) {
            SavingsGoalRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        $router->post('/api/savings-goals/:id/contributions', function($params) {
            $body = getJsonInput();
            if (!isset($body['amount'])) jsonError('Contribution amount is required', 400);
            $updated = SavingsGoalRepo::addContribution($params['id'], $body);
            if (!$updated) jsonError('Goal not found', 404);
            jsonResponse($updated, 201);
        });

        // === Debts ===
        $router->get('/api/debts', function() {
            jsonResponse(DebtRepo::getAll());
        });

        $router->post('/api/debts', function() {
            $body = getJsonInput();
            if (empty($body['name']) || !isset($body['totalPrincipal'])) {
                jsonError('Debt name and totalPrincipal are required', 400);
            }
            $created = DebtRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->put('/api/debts/:id', function($params) {
            $body = getJsonInput();
            $updated = DebtRepo::update($params['id'], $body);
            if (!$updated) jsonError('Debt not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/debts/:id', function($params) {
            DebtRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        $router->post('/api/debts/:id/payments', function($params) {
            $body = getJsonInput();
            if (!isset($body['amount'])) jsonError('Payment amount is required', 400);
            $updated = DebtRepo::recordPayment($params['id'], $body);
            if (!$updated) jsonError('Debt not found', 404);
            jsonResponse($updated, 201);
        });

        $router->delete('/api/debts/:debtId/payments/:paymentId', function($params) {
            $updated = DebtRepo::deletePayment($params['debtId'], $params['paymentId']);
            if (!$updated) jsonError('Debt or payment log not found', 404);
            jsonResponse($updated);
        });

        // === Recurring Items ===
        $router->get('/api/recurring', function() {
            jsonResponse(RecurringRepo::getAll());
        });

        $router->post('/api/recurring', function() {
            $body = getJsonInput();
            if (empty($body['title']) || !isset($body['amount'], $body['category'])) {
                jsonError('title, amount, and category are required', 400);
            }
            $created = RecurringRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->put('/api/recurring/:id', function($params) {
            $body = getJsonInput();
            $updated = RecurringRepo::update($params['id'], $body);
            if (!$updated) jsonError('Recurring item not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/recurring/:id', function($params) {
            RecurringRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        $router->post('/api/recurring/apply', function() {
            $body = getJsonInput();
            $month = (string)($body['month'] ?? '');
            $forceAll = !empty($body['forceAll']);
            $res = RecurringRepo::applyRecurring($month, $forceAll);
            jsonResponse($res);
        });

        // === Settings ===
        $router->get('/api/settings', function() {
            jsonResponse(SettingsRepo::get());
        });

        $router->put('/api/settings', function() {
            $body = getJsonInput();
            $updated = SettingsRepo::update($body);
            jsonResponse($updated);
        });

        // === Alerts Read State ===
        $router->get('/api/alerts/read', function() {
            jsonResponse(ReadAlertsRepo::getAllReadIds());
        });

        $router->post('/api/alerts/read', function() {
            $body = getJsonInput();
            if (!empty($body['alertId'])) {
                ReadAlertsRepo::markRead((string)$body['alertId']);
            }
            jsonResponse(['success' => true]);
        });

        $router->post('/api/alerts/read/all', function() {
            $body = getJsonInput();
            if (!empty($body['alertIds']) && is_array($body['alertIds'])) {
                ReadAlertsRepo::markAllRead($body['alertIds']);
            }
            jsonResponse(['success' => true]);
        });

        $router->delete('/api/alerts/read', function() {
            ReadAlertsRepo::clearAll();
            jsonResponse(['success' => true]);
        });

        // === Gulak (Piggy Bank) ===
        $router->get('/api/gulak/pots', function() {
            jsonResponse(GulakRepo::getAll());
        });

        $router->post('/api/gulak/pots', function() {
            $body = getJsonInput();
            if (empty($body['name'])) jsonError('Pot name is required', 400);
            $created = GulakRepo::create($body);
            jsonResponse($created, 201);
        });

        $router->put('/api/gulak/pots/:id', function($params) {
            $body = getJsonInput();
            $updated = GulakRepo::update($params['id'], $body);
            if (!$updated) jsonError('Gulak pot not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/gulak/pots/:id', function($params) {
            GulakRepo::delete($params['id']);
            jsonResponse(['success' => true, 'id' => $params['id']]);
        });

        $router->post('/api/gulak/pots/:id/entries', function($params) {
            $body = getJsonInput();
            if (!isset($body['amount'])) jsonError('Entry amount is required', 400);
            $updated = GulakRepo::addEntry($params['id'], $body);
            if (!$updated) jsonError('Gulak pot not found', 404);
            jsonResponse($updated, 201);
        });

        $router->post('/api/gulak/pots/:id/smash', function($params) {
            $body = getJsonInput();
            $note = isset($body['note']) ? (string)$body['note'] : null;
            $updated = GulakRepo::smash($params['id'], $note);
            if (!$updated) jsonError('Gulak pot not found', 404);
            jsonResponse($updated);
        });

        $router->delete('/api/gulak/entries/:id', function($params) {
            $updated = GulakRepo::deleteEntry($params['id']);
            jsonResponse(['success' => true, 'pot' => $updated]);
        });
    }
}