<?php

$username           = sanitize_text_field($_POST['username']);
$token              = sanitize_text_field($_POST['token']);
// Save dashboard URL if provided (ensures constant stays in sync)
if (!empty($_POST['chatbot_dashboard_url'])) {
    $dashboard_url = esc_url_raw($_POST['chatbot_dashboard_url']);
    update_option('chatbot_dashboard_url', $dashboard_url);
} else {
    $dashboard_url = defined('CHATBOT_DASHBOARD_API_BASE_URL') ? CHATBOT_DASHBOARD_API_BASE_URL : get_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local');
}

$api_base = rtrim($dashboard_url, '/');

$api_result = chatbot_api_request('POST', $api_base . '/api/check-user-credentials', [
    'username'           => $username,
    'token'              => $token,
]);

$response_data = $api_result['data'];

$result = [
    'success'    => false,
    'html'       => '',
    'has_livechat' => false,
    'modules'    => [],
    'files'      => [],
];

if ($response_data && isset($response_data['valid'])) {

    // Extract modules from response
    $modules = isset($response_data['modules']) && is_array($response_data['modules']) ? $response_data['modules'] : [];
    $result['modules'] = $modules;
    update_option('chatbot_modules', $modules);

    // Extract files from response
    $files = isset($response_data['files']) && is_array($response_data['files']) ? $response_data['files'] : [];
    $result['files'] = $files;
    update_option('chatbot_files', $files);

    // Save first file name for backwards compatibility
    if (!empty($files) && isset($files[0]['file_name'])) {
        update_option('file_name', $files[0]['file_name']);
    }

    // Check if live_chat module is present
    $has_livechat = in_array('live_chat', $modules);
    update_option('has_livechat', $has_livechat ? '1' : '0');
    $result['has_livechat'] = $has_livechat;

    // Save livechat_secret_key from response automatically
    if ($has_livechat && !empty($response_data['livechat_secret_key'])) {
        update_option('livechat_secret_key', sanitize_text_field($response_data['livechat_secret_key']));
        update_option('livechat_secret_key_valid', '1');
        $result['livechat_secret_key_valid'] = true;
    } else {
        update_option('livechat_secret_key', '');
        update_option('livechat_secret_key_valid', '0');
        $result['livechat_secret_key_valid'] = false;
    }

    // Update chat modes based on livechat status
    if ($has_livechat) {
        update_option('chatbot_chat_mode', 'both');
        update_option('ai_chat_enabled', '1');
    } else {
        update_option('ai_chat_enabled', '0');
        update_option('chatbot_chat_mode', 'ai_only');
    }

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
