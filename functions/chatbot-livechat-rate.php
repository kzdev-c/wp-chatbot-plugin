<?php
/**
 * Handles rating a chat session via the Live Chat API.
 * Called via AJAX action 'livechat_rate'.
 */

$chat_id = intval($_POST['chat_id']);
$rating  = intval($_POST['rating']);
$comment = isset($_POST['comment']) ? sanitize_text_field($_POST['comment']) : '';

$token    = get_option('chatbot_token');
$base_url = get_option('livechat_base_url');

if (empty($token) || empty($base_url)) {
    echo json_encode(['error' => 'Live chat is not configured.']);
    wp_die();
}

if (empty($chat_id) || $rating < 1 || $rating > 5) {
    echo json_encode(['error' => 'Valid Chat ID and rating (1-5) are required.']);
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
