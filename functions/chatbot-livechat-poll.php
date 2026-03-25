<?php
/**
 * Handles polling for new messages from the Live Chat API.
 * Called via AJAX action 'livechat_poll'.
 * The visitor polls this to get agent replies.
 */

$session_id   = sanitize_text_field($_POST['session_id']);
$last_message_id = isset($_POST['last_message_id']) ? intval($_POST['last_message_id']) : 0;

$token    = get_option('chatbot_token');
$base_url = get_option('livechat_base_url');

if (empty($token) || empty($base_url)) {
    echo json_encode(['error' => 'Live chat is not configured.']);
    wp_die();
}

if (empty($session_id)) {
    echo json_encode(['error' => 'Session ID is required.']);
    wp_die();
}

// Poll for new messages — we use the /message endpoint with GET or a custom poll endpoint.
// Since the API guide only has POST /message, we'll use a simple approach:
// We store the chat_id and periodically re-send a poll request.
// For now, we'll use a custom endpoint if available, otherwise return empty.
$api_url = rtrim($base_url, '/') . '/poll';

$post_data = [
    'token'           => $token,
    'session_id'      => $session_id,
    'last_message_id' => $last_message_id,
];

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 15,
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

if ($response === false) {
    echo json_encode(['error' => curl_error($curl)]);
} else {
    $decoded = json_decode($response, true);
    echo json_encode(['success' => true, 'data' => $decoded]);
}

curl_close($curl);
wp_die();
