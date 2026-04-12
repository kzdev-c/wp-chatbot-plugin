<?php
/**
 * Handles sending a typing indicator via the Live Chat API.
 * Called via AJAX action 'livechat_typing'.
 */

$session_id  = sanitize_text_field($_POST['session_id']);

$token    = get_option('chatbot_token');
$base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if (empty($token)) {
    echo json_encode(['error' => 'Live chat is not configured.']);
    wp_die();
}

if (empty($session_id)) {
    echo json_encode(['error' => 'Session ID is required.']);
    wp_die();
}

$api_url = rtrim($base_url, '/') . '/typing';

$post_data = [
    'token'       => $token,
    'session_id'  => $session_id,
    'sender_type' => 'visitor',
];

$result = chatbot_api_request('POST', $api_url, $post_data, [], 10);

if (!$result['success']) {
    echo json_encode(['error' => $result['error']]);
} else {
    echo json_encode(['success' => true, 'data' => $result['data']]);
}

wp_die();
