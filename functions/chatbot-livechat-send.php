<?php
/**
 * Handles sending a message via the Live Chat API.
 * Called via AJAX action 'livechat_send_message'.
 */

$message     = sanitize_text_field($_POST['message']);
$session_id  = sanitize_text_field($_POST['session_id']);
$visitor_name  = isset($_POST['visitor_name']) ? sanitize_text_field($_POST['visitor_name']) : '';
$visitor_email = isset($_POST['visitor_email']) ? sanitize_email($_POST['visitor_email']) : '';

$token    = get_option('chatbot_token');
$base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if (empty($token)) {
    echo json_encode(['error' => 'Live chat is not configured. Please set the Token in Credentials settings.']);
    wp_die();
}

if (empty($message) || empty($session_id)) {
    echo json_encode(['error' => 'Message and session ID are required.']);
    wp_die();
}

$api_url = rtrim($base_url, '/') . '/message';

$post_data = [
    'token'        => $token,
    'session_id'   => $session_id, 
    'message'      => $message,
    'visitor_name'  => !empty($visitor_name) ? $visitor_name : 'Visitor',
    'visitor_email' => !empty($visitor_email) ? $visitor_email : '',
];

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
            '_debug' => [
                'url' => $api_url,
                'http_code' => $http_code,
                'post_data' => $post_data,
                'raw_response' => $response,
            ]
        ]);
    }
}

curl_close($curl);
wp_die();
