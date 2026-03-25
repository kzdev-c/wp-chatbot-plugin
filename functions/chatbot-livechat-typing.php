<?php
/**
 * Handles sending a typing indicator via the Live Chat API.
 * Called via AJAX action 'livechat_typing'.
 */

$session_id  = sanitize_text_field($_POST['session_id']);

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

$api_url = rtrim($base_url, '/') . '/typing';

$post_data = [
    'token'       => $token,
    'session_id'  => $session_id,
    'sender_type' => 'visitor',
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
