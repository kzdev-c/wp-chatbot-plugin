<?php
$question = sanitize_text_field($_POST['question']);

$username = get_option('chatbot_username');
$token    = get_option('chatbot_token');
$module   = get_option('preferred_module');
$file   = get_option('file_name');
$use_mock = true; 

if (empty($username) || empty($token) || empty($question) || empty($module)) {
    echo json_encode(['error' => 'Invalid configration settings.']);
    wp_die();
}

// Determine the API endpoint and form data based on the preferred module
switch ($module) {
    case 'web_scrapper':
        $api_url = CHATBOT_API_BASE_URL . '/web_scraper/ask';
        $post_data = [
            'question' => $question,
            'username' => $username,
            'token'    => $token,
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
            'username'     => $username,
            'token'        => $token,
            'question'     => $question,
            'file_name' => $file,
            'visitor_id' => $visitor_id,
        ];
        break;

    default:
        echo json_encode(['error' => 'No module Was selected. Please Check your settings.']);
        wp_die();
}

if ($use_mock) {
    echo json_encode([
        "response" => [
            "prompt_message" => "Would you like to share your contact information so we can reach out to you with more information?",
            "response" => "This is a mock response (no API call made).",
            "visitor_id" => session_id() ?: "dev-visitor",
            "visitor_prompt" => true
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
