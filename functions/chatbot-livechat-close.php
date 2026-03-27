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

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 10,
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
