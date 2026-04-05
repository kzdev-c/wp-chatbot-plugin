<?php
$question = sanitize_text_field($_POST['question']);

$token = get_option('chatbot_token');

$ai_chat_enabled = '1';

if (empty($question)) {
    echo json_encode(['error' => 'Question is required.']);
    wp_die();
}

// Single endpoint — only sends the question
$api_url   = CHATBOT_API_BASE_URL . '/query_file';
$post_data = [
    'question' => $question,
];

if (!$ai_chat_enabled) {
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
        if ($ai_chat_enabled && isset($decoded_response['request_agent']) && $decoded_response['request_agent'] === true) {
            $base_url  = defined('CHATBOT_DASHBOARD_API_BASE_URL') ? CHATBOT_DASHBOARD_API_BASE_URL : 'https://chatbot-dashboard.local';
            $check_url = rtrim($base_url, '/') . '/api/livechat/check-agent-availability';
            
            $check_curl = curl_init();
            curl_setopt_array($check_curl, [
                CURLOPT_URL            => $check_url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_CUSTOMREQUEST  => 'POST',
                CURLOPT_POSTFIELDS     => json_encode(['token' => $token]),
                CURLOPT_HTTPHEADER     => [
                    'Content-Type: application/json',
                    'Accept: application/json',
                ],
            ]);
            
            $check_res = curl_exec($check_curl);
            curl_close($check_curl);
            
            $agent_data = json_decode($check_res, true);
            
            if (isset($agent_data['success']) && $agent_data['success'] === true && !empty($agent_data['agent_id'])) {
                $decoded_response['agent_id'] = $agent_data['agent_id'];
            } else {
                $decoded_response['livechat'] = false;
                if (isset($decoded_response['response'])) {
                    $decoded_response['response'] .= "\n\n(None of our agents are available right now. I will continue assisting you.)";
                } elseif (isset($decoded_response['prompt_message'])) {
                    $decoded_response['prompt_message'] .= "\n\n(None of our agents are available right now. I will continue assisting you.)";
                }
            }
        }
        
        echo json_encode(['response' => $decoded_response]);
    }
}

curl_close($curl);

wp_die();
