<?php
/**
 * Handles closing a chat session via the Live Chat API.
 * Called via AJAX action 'livechat_close'.
 */

$chat_id = intval($_POST['chat_id']);

$token    = get_option('chatbot_token');
$base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if (empty($token)) {
    echo json_encode(['error' => 'Live chat is not configured.']);
    wp_die();
}

if (empty($chat_id)) {
    echo json_encode(['error' => 'Chat ID is required.']);
    wp_die();
}

$api_url = rtrim($base_url, '/') . '/close';

$post_data = [
    'token'   => $token,
    'chat_id' => $chat_id,
];

$result = chatbot_api_request('POST', $api_url, $post_data, [], 10);

if (!$result['success']) {
    echo json_encode(['error' => $result['error']]);
} else {
    echo json_encode(['success' => true, 'data' => $result['data']]);
}

wp_die();
