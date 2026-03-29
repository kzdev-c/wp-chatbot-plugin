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

$response  = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

error_log('[LiveChat GetMessages] HTTP Code: ' . $http_code);
error_log('[LiveChat GetMessages] Response: ' . $response);

if ($response === false) {
    $error_msg = curl_error($curl);
    echo json_encode(['error' => 'Live chat error: ' . $error_msg]);
} else {
    $decoded = json_decode($response, true);
    if (isset($decoded['error'])) {
        // "Chat not found" — no existing session
        echo json_encode(['error' => $decoded['error']]);
    } else {
        // Return success + messages array
        echo json_encode([
            'success'  => true,
            'messages' => isset($decoded['messages']) ? $decoded['messages'] : [],
        ]);
    }
}

curl_close($curl);
wp_die();
