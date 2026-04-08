<?php
$question = sanitize_text_field($_POST['question']);

$token = get_option('chatbot_token');

$chat_mode = get_option('chatbot_chat_mode', 'ai_only');

if (empty($question)) {
    echo json_encode(['error' => 'Question is required.']);
    wp_die();
}

// ─── Mode: Live Chat Only ───
// Skip AI entirely and go straight to live chat
if ($chat_mode === 'livechat_only') {
    echo json_encode([
        "response" => [
            "prompt_message" => "Live chat is enabled. Would you like to share your contact details so our team can assist you directly?",
            "response" => "You’re currently connected to live support.",
            "visitor_id" => session_id() ?: "visitor",
            "visitor_prompt" => true,
            "enter_live_chat" => true,
            "livechat" => true
        ]
    ]);
    wp_die();
}

// ─── Mode: AI Only or Both ───
// Single endpoint — only sends the question
$api_url   = CHATBOT_API_BASE_URL . '/query_file';
$post_data = [
    'question' => $question,
];

// Initialize cURL
$curl = curl_init();
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
        // If the AI decides an agent is needed
        if (isset($decoded_response['request_agent']) && $decoded_response['request_agent'] === true) {
            
            // ─── If AI Only: Block escalation ───
            if ($chat_mode === 'ai_only') {
                $decoded_response['livechat'] = false;
                $decoded_response['enter_live_chat'] = false;
                $decoded_response['request_agent'] = false;
                if (isset($decoded_response['response'])) {
                    $decoded_response['response'] .= "\n\n(I'm an AI assistant. There are no live agents available in this chat right now.)";
                } elseif (isset($decoded_response['prompt_message'])) {
                    $decoded_response['prompt_message'] .= "\n\n(I'm an AI assistant. There are no live agents available in this chat right now.)";
                }
            } 
            // ─── If Both: Check agent availability ───
            else if ($chat_mode === 'both') {
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
        }
        
        echo json_encode(['response' => $decoded_response]);
    }
}

curl_close($curl);

wp_die();
