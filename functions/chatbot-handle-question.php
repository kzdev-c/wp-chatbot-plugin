<?php
$question = sanitize_text_field($_POST['question']);

$username = get_option('chatbot_username');
$token    = get_option('chatbot_token');
$module   = get_option('preferred_module');
$file   = get_option('file_name');
$is_live_mode = get_option('ai_chat_enabled') == '1'; 

if (empty($username) || empty($token) || empty($question) || empty($module)) {
    echo json_encode(['error' => 'Invalid configration settings.']);
    wp_die();
}

// Determine the API endpoint and form data based on the preferred module
switch ($module) {
    case 'web_scrapper':
        $api_url = CHATBOT_API_BASE_URL . '/web_scraper/ask';
        $post_data = [
            'question'   => $question,
            'username'   => $username,
            'token'      => $token,
            'session_id' => isset($_COOKIE['cb_user_session']) ? sanitize_text_field(stripslashes($_COOKIE['cb_user_session'])) : null,
            'location'   => (isset($_COOKIE['cb_user_location']) && $_COOKIE['cb_user_location'] !== 'not provided') ? sanitize_text_field(stripslashes($_COOKIE['cb_user_location'])) : null,
            'device'     => (isset($_COOKIE['cb_user_agent']) && $_COOKIE['cb_user_agent'] !== 'not provided') ? sanitize_text_field(stripslashes($_COOKIE['cb_user_agent'])) : null,
        ];
        break;

    case 'file_upload':
        if (empty($file)) {
            echo json_encode(['error' => 'File name is not configured. Please set it in Chatbot Settings.']);
            wp_die();
        }
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        // Get the current session ID

        $visitor_id = session_id();
        $api_url = CHATBOT_API_BASE_URL . '/file_chatbot/ask';
        $post_data = [
            'username'   => $username,
            'token'      => $token,
            'question'   => $question,
            'file_name'  => $file,
            'visitor_id' => $visitor_id,
            'session_id' => isset($_COOKIE['cb_user_session']) ? sanitize_text_field(stripslashes($_COOKIE['cb_user_session'])) : null,
            'location'   => (isset($_COOKIE['cb_user_location']) && $_COOKIE['cb_user_location'] !== 'not provided') ? sanitize_text_field(stripslashes($_COOKIE['cb_user_location'])) : null,
            'device'     => (isset($_COOKIE['cb_user_agent']) && $_COOKIE['cb_user_agent'] !== 'not provided') ? sanitize_text_field(stripslashes($_COOKIE['cb_user_agent'])) : null,
        ];
        break;

    default:
        echo json_encode(['error' => 'No module Was selected. Please Check your settings.']);
        wp_die();
}

if (!$is_live_mode) {
    echo json_encode([
        "response" => [
            "prompt_message" => "Live chat is currently enabled. Would you like to share your contact details so our team can assist you directly?",
            "response" => "You’re currently connected to live support. Our team will assist you shortly.",
            "visitor_id" => session_id() ?: "visitor",
            "visitor_prompt" => true,
            "enter_live_chat" => true,
            "livechat" => true
        ]
    ]);

    wp_die();
}
// Initialize cURL
$curl = curl_init();

// Set cURL options
curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_POSTFIELDS     => json_encode($post_data),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

// Execute the cURL request and capture the response
$response = curl_exec($curl);

// Check for cURL errors
if ($response === false) {
    $error_msg = curl_error($curl);
    echo json_encode(['error' => 'Error: ' . $error_msg]);
} else {
    $decoded_response = json_decode($response, true);
    if (isset($decoded_response['error'])) {
        echo json_encode(['error' => 'Error from API: ' . $decoded_response['error']]);
    } else {
        echo json_encode(['response' => $decoded_response]);
    }
}

curl_close($curl);

wp_die();
