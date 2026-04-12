<?php
/**
 * Handles fetching existing messages for a live chat session.
 * Called via AJAX action 'livechat_get_messages'.
 */

$session_id = sanitize_text_field($_POST['session_id']);
$token      = get_option('chatbot_token');
$base_url   = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if (empty($token)) {
    echo json_encode(['error' => 'Live chat is not configured. Please set the Token in Credentials settings.']);
    wp_die();
}

if (empty($session_id)) {
    echo json_encode(['error' => 'Session ID is required.']);
    wp_die();
}

$api_url = rtrim($base_url, '/') . '/get-messages';

$post_data = [
    'token'      => $token,
    'session_id' => $session_id,
];

$result = chatbot_api_request('POST', $api_url, $post_data);


if (!$result['success']) {
    echo json_encode(['error' => 'Live chat error: ' . $result['error']]);
} else {
    $decoded = $result['data'];
    if (isset($decoded['error'])) {
        // "Chat not found" — no existing session
        echo json_encode(['error' => $decoded['error']]);
    } else {
        // Return success + messages array
        echo json_encode([
            'success'      => true,
            'messages'     => isset($decoded['messages']) ? $decoded['messages'] : [],
            'ai_messages'  => isset($decoded['ai_messages']) ? $decoded['ai_messages'] : [],
            'has_rate_key' => array_key_exists('rate', $decoded),
            'rate'         => isset($decoded['rate']) ? $decoded['rate'] : null,
        ]);
    }
}

wp_die();
