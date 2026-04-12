<?php
/**
 * Handles rating a chat session via the Live Chat API.
 * Called via AJAX action 'livechat_rate'.
 */

$chat_id = intval($_POST['chat_id']);
$rating  = floatval($_POST['rating']);
$comment = isset($_POST['comment']) ? sanitize_text_field($_POST['comment']) : '';

$token    = get_option('chatbot_token');
$base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if (empty($token)) {
    echo json_encode(['error' => 'Live chat is not configured.']);
    wp_die();
}

if (empty($chat_id) || $rating < 0.5 || $rating > 5) {
    echo json_encode(['error' => 'Valid Chat ID and rating (0.5-5) are required.']);
    wp_die();
}

$api_url = rtrim($base_url, '/') . '/rate';

$post_data = [
    'token'   => $token,
    'chat_id' => $chat_id,
    'rating'  => $rating,
];

if (!empty($comment)) {
    $post_data['comment'] = $comment;
}

$result = chatbot_api_request('POST', $api_url, $post_data, [], 10);

if (!$result['success']) {
    echo json_encode(['error' => $result['error']]);
} else {
    echo json_encode(['success' => true, 'data' => $result['data']]);
}

wp_die();
