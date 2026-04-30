<?php
if ( ! defined( 'ABSPATH' ) ) exit;

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_username = isset( $_POST['username'] ) ? sanitize_text_field( wp_unslash( $_POST['username'] ) ) : '';
$wp_chatbot_token    = isset( $_POST['token'] )    ? sanitize_text_field( wp_unslash( $_POST['token'] ) )    : '';

// Save dashboard URL if provided (ensures constant stays in sync)
if ( ! empty( $_POST['chatbot_dashboard_url'] ) ) {
    $wp_chatbot_dashboard_url = esc_url_raw( wp_unslash( $_POST['chatbot_dashboard_url'] ) );
    update_option( 'chatbot_dashboard_url', $wp_chatbot_dashboard_url );
} else {
    $wp_chatbot_dashboard_url = defined( 'CHATBOT_DASHBOARD_API_BASE_URL' ) ? CHATBOT_DASHBOARD_API_BASE_URL : get_option( 'chatbot_dashboard_url', 'https://chatbot-dashboard.local' );
}

$wp_chatbot_api_base = rtrim( $wp_chatbot_dashboard_url, '/' );

$wp_chatbot_api_result = chatbot_api_request( 'POST', $wp_chatbot_api_base . '/api/check-user-credentials', [
    'username' => $wp_chatbot_username,
    'token'    => $wp_chatbot_token,
] );

$wp_chatbot_response_data = $wp_chatbot_api_result['data'];

$wp_chatbot_result = [
    'success'    => false,
    'html'       => '',
    'has_livechat' => false,
    'modules'    => [],
    'files'      => [],
];

if ( $wp_chatbot_response_data && isset( $wp_chatbot_response_data['valid'] ) ) {

    // Extract modules from response
    $wp_chatbot_modules = isset( $wp_chatbot_response_data['modules'] ) && is_array( $wp_chatbot_response_data['modules'] ) ? $wp_chatbot_response_data['modules'] : [];
    $wp_chatbot_result['modules'] = $wp_chatbot_modules;
    update_option( 'chatbot_modules', $wp_chatbot_modules );

    // Extract files from response
    $wp_chatbot_files = isset( $wp_chatbot_response_data['files'] ) && is_array( $wp_chatbot_response_data['files'] ) ? $wp_chatbot_response_data['files'] : [];
    $wp_chatbot_result['files'] = $wp_chatbot_files;
    update_option( 'chatbot_files', $wp_chatbot_files );

    // Save first file name for backwards compatibility
    if ( ! empty( $wp_chatbot_files ) && isset( $wp_chatbot_files[0]['file_name'] ) ) {
        update_option( 'file_name', $wp_chatbot_files[0]['file_name'] );
    }

    // Check if live_chat module is present
    $wp_chatbot_has_livechat = in_array( 'live_chat', $wp_chatbot_modules, true );
    update_option( 'has_livechat', $wp_chatbot_has_livechat ? '1' : '0' );
    $wp_chatbot_result['has_livechat'] = $wp_chatbot_has_livechat;

    // Save livechat_secret_key from response automatically
    if ( $wp_chatbot_has_livechat && ! empty( $wp_chatbot_response_data['livechat_secret_key'] ) ) {
        update_option( 'livechat_secret_key', sanitize_text_field( $wp_chatbot_response_data['livechat_secret_key'] ) );
        update_option( 'livechat_secret_key_valid', '1' );
        $wp_chatbot_result['livechat_secret_key_valid'] = true;
    } else {
        update_option( 'livechat_secret_key', '' );
        update_option( 'livechat_secret_key_valid', '0' );
        $wp_chatbot_result['livechat_secret_key_valid'] = false;
    }

    // Update chat modes based on livechat status
    if ( $wp_chatbot_has_livechat ) {
        update_option( 'chatbot_chat_mode', 'both' );
        update_option( 'ai_chat_enabled', '1' );
    } else {
        update_option( 'ai_chat_enabled', '0' );
        update_option( 'chatbot_chat_mode', 'ai_only' );
    }

    if ( 1 === (int) $wp_chatbot_response_data['valid'] ) {
        $wp_chatbot_result['success'] = true;
        $wp_chatbot_result['html'] = '<div class="notice notice-success is-dismissible"><p>Credentials are correct and settings saved.</p></div>';
        update_option( 'chatbot_username', $wp_chatbot_username );
        update_option( 'chatbot_token', $wp_chatbot_token );

        // Save ai_chat_enabled dynamically based on the current user+token
        $wp_chatbot_ai_enabled_value = ( isset( $wp_chatbot_response_data['ai_chat_enabled'] ) && $wp_chatbot_response_data['ai_chat_enabled'] ) ? '1' : '0';
        update_option( 'ai_chat_enabled_' . $wp_chatbot_username . '_' . $wp_chatbot_token, $wp_chatbot_ai_enabled_value );
    } elseif ( 0 === (int) $wp_chatbot_response_data['valid'] ) {
        $wp_chatbot_result['html'] = '<div class="notice notice-error is-dismissible"><p>Invalid credentials. Please check your username and token.</p></div>';
    }
} else {
    $wp_chatbot_result['html'] = '<div class="notice notice-error is-dismissible"><p>There was an error with the credentials check. Please try again later.</p></div>';
}

echo wp_json_encode( $wp_chatbot_result );

wp_die();
