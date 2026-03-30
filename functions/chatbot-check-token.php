<?php

$username           = sanitize_text_field($_POST['username']);
$token              = sanitize_text_field($_POST['token']);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => CHATBOT_DASHBOARD_API_BASE_URL . '/api/check-user-credentials',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode([
        'username' => $username,
        'token'    => $token,
    ]),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($curl);
$response_data = json_decode($response, true);

$result = [
    'success' => false,
    'html'    => '',
    'has_livechat' => false,
];

if ($response_data && isset($response_data['valid'])) {
    
    // Check and save has_livechat
    $has_livechat = (isset($response_data['has_livechat']) && $response_data['has_livechat']) ? '1' : '0';
    update_option('has_livechat', $has_livechat);
    
    if ($has_livechat === '0') {
        update_option('livechat_secret_key', '');
        update_option('ai_chat_enabled', '0');
    }
    
    $result['has_livechat'] = ($has_livechat === '1');

    if ($response_data['valid'] == 1) {
        $result['success'] = true;
        $result['html'] = '<div class="notice notice-success is-dismissible"><p>Credentials are correct and settings saved.</p></div>';
        update_option('chatbot_username', $username);
        update_option('chatbot_token', $token);
    } elseif ($response_data['valid'] == 0) {
        $result['html'] = '<div class="notice notice-error is-dismissible"><p>Invalid credentials. Please check your username and token.</p></div>';
    }
} else {
    $result['html'] = '<div class="notice notice-error is-dismissible"><p>There was an error with the credentials check. Please try again later.</p></div>';
}

echo json_encode($result);

curl_close($curl);
wp_die();
