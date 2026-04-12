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

$domain = wp_parse_url(home_url(), PHP_URL_HOST);
$post_data = [
    'token'        => $token,
    'session_id'   => $session_id, 
    'message'      => $message,
    'visitor_name'  => $session_id . ' - ' . $domain,
    'visitor_email' => !empty($visitor_email) ? $visitor_email : '',
    'location'     => (isset($_COOKIE['cb_user_location']) && $_COOKIE['cb_user_location'] !== 'not provided') ? sanitize_text_field(stripslashes($_COOKIE['cb_user_location'])) : null,
    'device'        => (isset($_COOKIE['cb_user_agent']) && $_COOKIE['cb_user_agent'] !== 'not provided') ? sanitize_text_field(stripslashes($_COOKIE['cb_user_agent'])) : null,
];

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
