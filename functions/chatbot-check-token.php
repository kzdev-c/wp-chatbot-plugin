<?php

$username           = sanitize_text_field($_POST['username']);
$token              = sanitize_text_field($_POST['token']);
$livechat_secret_key  = null;
// Save dashboard URL if provided (ensures constant stays in sync)
if (!empty($_POST['chatbot_dashboard_url'])) {
    $dashboard_url = esc_url_raw($_POST['chatbot_dashboard_url']);
    update_option('chatbot_dashboard_url', $dashboard_url);
} else {
    $dashboard_url = defined('CHATBOT_DASHBOARD_API_BASE_URL') ? CHATBOT_DASHBOARD_API_BASE_URL : get_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local');
}

if (isset($_POST['livechat_secret_key'])) {
    update_option('livechat_secret_key', sanitize_text_field($_POST['livechat_secret_key']));
    $livechat_secret_key  = sanitize_text_field($_POST['livechat_secret_key']);
}

$api_base = rtrim($dashboard_url, '/');

$api_result = chatbot_api_request('POST', $api_base . '/api/check-user-credentials', [
    'username'           => $username,
    'token'              => $token,
    'livechat_secret_key' => $livechat_secret_key
]);

$response_data = $api_result['data'];

$result = [
    'success' => false,
    'html'    => '',
    'has_livechat' => false,
];

if ($response_data && isset($response_data['valid'])) {

    // Check and save has_livechat
    $has_livechat = !empty($response_data['has_livechat']) ? '1' : '0';
    $livechat_secret_key_valid = !empty($response_data['livechat_secret_key_valid']) ? '1' : '0';

    // Always update this
    update_option('has_livechat', $has_livechat);

    // Clear secret key if livechat is disabled OR key is invalid
    if ($has_livechat === '0' || $livechat_secret_key_valid === '0') {
        update_option('livechat_secret_key', '');
    }

    // Update chat modes based on livechat status
    if ($has_livechat === '1') {
        update_option('chatbot_chat_mode', 'both');
        update_option('ai_chat_enabled', '1');
    } else {
        update_option('ai_chat_enabled', '0');
        update_option('chatbot_chat_mode', 'ai_only');
    }

    if($livechat_secret_key_valid === '1'){
        update_option('livechat_secret_key_valid', '1');
    }else{
        update_option('livechat_secret_key_valid', '0');
    }

    $result['has_livechat'] = ($has_livechat === '1');
    $result['livechat_secret_key_valid'] = ($livechat_secret_key_valid === '1');


    if ($response_data['valid'] == 1) {
        $result['success'] = true;
        $result['html'] = '<div class="notice notice-success is-dismissible"><p>Credentials are correct and settings saved.</p></div>';
        update_option('chatbot_username', $username);
        update_option('chatbot_token', $token);

        // Save ai_chat_enabled dynamically based on the current user+token
        $ai_chat_enabled_value = (isset($response_data['ai_chat_enabled']) && $response_data['ai_chat_enabled']) ? '1' : '0';
        update_option('ai_chat_enabled_' . $username . '_' . $token, $ai_chat_enabled_value);
    } elseif ($response_data['valid'] == 0) {
        $result['html'] = '<div class="notice notice-error is-dismissible"><p>Invalid credentials. Please check your username and token.</p></div>';
    }
} else {
    $result['html'] = '<div class="notice notice-error is-dismissible"><p>There was an error with the credentials check. Please try again later.</p></div>';
}

echo json_encode($result);

wp_die();
