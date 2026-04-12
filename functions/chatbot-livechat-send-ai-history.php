<?php
/**
 * Handles sending the AI conversation history to the API when a live chat starts.
 * Called via AJAX action 'livechat_send_ai_history'.
 */

$session_id  = sanitize_text_field($_POST['session_id']);
$conversations_raw = isset($_POST['conversations']) ? $_POST['conversations'] : [];

$token    = get_option('chatbot_token');
$base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if (empty($token)) {
    echo json_encode(['error' => 'Live chat is not configured. Please set the Token in Credentials settings.']);
    wp_die();
}

if (empty($session_id) || empty($conversations_raw)) {
    echo json_encode(['error' => 'Session ID and conversations are required.']);
    wp_die();
}

// Sanitize conversations array
$conversations = [];
foreach ($conversations_raw as $conv) {
    if (isset($conv['sender']) && isset($conv['message'])) {
        $sender = sanitize_text_field($conv['sender']);
        if (in_array($sender, ['aibot', 'visitor', 'workflow', 'workflow_bot'])) {
            $conversations[] = [
                'sender' => $sender,
                'message' => sanitize_textarea_field($conv['message'])
            ];
        }
    }
}

$api_url = rtrim($base_url, '/') . '/send-previous-conversation';

$post_data = [
    'token'         => $token,
    'sessionId'     => $session_id, 
    'conversations' => $conversations,
];

if (isset($_POST['agentId']) && !empty($_POST['agentId'])) {
    $post_data['agentId'] = intval($_POST['agentId']);
}

if (isset($_POST['type']) && !empty($_POST['type'])) {
    $post_data['type'] = sanitize_text_field($_POST['type']);
}

$result = chatbot_api_request('POST', $api_url, $post_data);


if (!$result['success']) {
    echo json_encode(['error' => 'Live chat error: ' . $result['error']]);
} else {
    $decoded_response = $result['data'];
    if (isset($decoded_response['error'])) {
        echo json_encode(['error' => 'Live chat API error: ' . $decoded_response['error']]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => $decoded_response,
        ]);
    }
}

wp_die();
