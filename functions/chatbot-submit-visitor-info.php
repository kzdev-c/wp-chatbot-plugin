<?php


if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
// Get the current session ID

$visitor_id = session_id();

$result = chatbot_api_request('POST', CHATBOT_API_BASE_URL . '/visitor/save_data', [
    'username'   => get_option('chatbot_username'),
    'token'      => get_option('chatbot_token'),
    'name'       => $_POST['name'],
    'email'      => $_POST['email'],
    'phone'      => $_POST['phone'],
    'interest'   => $_POST['interest'],
    'visitor_id' => $visitor_id,
]);

if ($result['success'] && isset($result['data']['response'])) {
    echo $result['data']['response'];
} else {
    echo $result['raw'];
}

wp_die();
