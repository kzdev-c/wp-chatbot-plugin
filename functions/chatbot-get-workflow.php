<?php
/**
 * Fetches the workflow for the chatbot from the dashboard API.
 * Called via AJAX action 'chatbot_get_workflow'.
 */

$token = get_option('chatbot_token');

if (empty($token)) {
    echo json_encode(['error' => 'No chatbot token configured.']);
    wp_die();
}

$base_url = defined('CHATBOT_DASHBOARD_API_BASE_URL') ? CHATBOT_DASHBOARD_API_BASE_URL : 'https://chatbot-dashboard.local';
$api_url  = rtrim($base_url, '/') . '/api/livechat/workflow';

$result = chatbot_api_request('POST', $api_url, [
    'token' => $token,
]);

if (!$result['success']) {
    echo json_encode(['error' => 'Failed to fetch workflow: ' . $result['error']]);
    wp_die();
}

$http_code = $result['http_code'];
$data      = $result['data'];

// Handle different response scenarios
if ($http_code === 401) {
    echo json_encode(['error' => 'Invalid token']);
    wp_die();
}

if ($http_code === 404) {
    echo json_encode(['error' => 'No active workflow found']);
    wp_die();
}

if ($http_code === 200 && isset($data['success']) && $data['success'] === true && isset($data['workflow'])) {
    echo json_encode([
        'success'  => true,
        'workflow' => $data['workflow'],
    ]);
} else {
    echo json_encode(['error' => 'Unexpected workflow response.']);
}

wp_die();
