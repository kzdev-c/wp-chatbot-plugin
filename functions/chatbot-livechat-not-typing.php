<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Handles sending a not-typing indicator via the Live Chat API.
 * Called via AJAX action 'livechat_not_typing'.
 */

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_session_id = isset( $_POST['session_id'] ) ? sanitize_text_field( wp_unslash( $_POST['session_id'] ) ) : '';

$wp_chatbot_token    = get_option( 'chatbot_token' );
$wp_chatbot_base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if ( empty( $wp_chatbot_token ) ) {
    echo wp_json_encode( [ 'error' => 'Live chat is not configured.' ] );
    wp_die();
}

if ( empty( $wp_chatbot_session_id ) ) {
    echo wp_json_encode( [ 'error' => 'Session ID is required.' ] );
    wp_die();
}

$wp_chatbot_api_url = rtrim( $wp_chatbot_base_url, '/' ) . '/not-typing';

$wp_chatbot_post_data = [
    'token'       => $wp_chatbot_token,
    'session_id'  => $wp_chatbot_session_id,
    'sender_type' => 'visitor',
];

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, $wp_chatbot_post_data, [], 10 );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => $wp_chatbot_result['error'] ] );
} else {
    echo wp_json_encode( [ 'success' => true, 'data' => $wp_chatbot_result['data'] ] );
}

wp_die();
