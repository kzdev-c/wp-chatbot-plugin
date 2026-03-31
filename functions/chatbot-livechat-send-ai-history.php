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
        if (in_array($sender, ['aibot', 'visitor'])) {
            $conversations[] = [
                'sender' => $sender,
                'message' => sanitize_textarea_field($conv['message'])
            ];
        }
    }
}

$api_url = rtrim($base_url, '/') . '/send-ai-conversation';

$post_data = [
    'token'         => $token,
    'sessionId'     => $session_id, 
    'conversations' => $conversations,
];

if (isset($_POST['agentId']) && !empty($_POST['agentId'])) {
    $post_data['agentId'] = intval($_POST['agentId']);
}

// DEBUG: Log request details
error_log('[LiveChat DEBUG] URL: ' . $api_url);
error_log('[LiveChat DEBUG] Post Data: ' . json_encode($post_data));

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_POSTFIELDS     => json_encode($post_data),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
    ],
]);

$response = curl_exec($curl);
print_r($response);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

// DEBUG: Log response
error_log('[LiveChat DEBUG] HTTP Code: ' . $http_code);
error_log('[LiveChat DEBUG] Raw Response: ' . $response);

if ($response === false) {
    $error_msg = curl_error($curl);
    echo json_encode(['error' => 'Live chat error: ' . $error_msg]);
} else {
    $decoded_response = json_decode($response, true);
    if (isset($decoded_response['error'])) {
        echo json_encode(['error' => 'Live chat API error: ' . $decoded_response['error']]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => $decoded_response,
        ]);
    }
}

curl_close($curl);
wp_die();
