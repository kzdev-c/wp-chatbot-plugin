<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Handles fetching existing messages for a live chat session.
 * Called via AJAX action 'livechat_get_messages'.
 */

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_session_id = isset( $_POST['session_id'] ) ? sanitize_text_field( wp_unslash( $_POST['session_id'] ) ) : '';
$wp_chatbot_token      = get_option( 'chatbot_token' );
$wp_chatbot_base_url   = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if ( empty( $wp_chatbot_token ) ) {
    echo wp_json_encode( [ 'error' => 'Live chat is not configured. Please set the Token in Credentials settings.' ] );
    wp_die();
}

if ( empty( $wp_chatbot_session_id ) ) {
    echo wp_json_encode( [ 'error' => 'Session ID is required.' ] );
    wp_die();
}

$wp_chatbot_api_url = rtrim( $wp_chatbot_base_url, '/' ) . '/get-messages';

$wp_chatbot_post_data = [
    'token'      => $wp_chatbot_token,
    'session_id' => $wp_chatbot_session_id,
];

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, $wp_chatbot_post_data );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => 'Live chat error: ' . $wp_chatbot_result['error'] ] );
} else {
    $wp_chatbot_decoded = $wp_chatbot_result['data'];
    if ( isset( $wp_chatbot_decoded['error'] ) ) {
        // "Chat not found" — no existing session
        echo wp_json_encode( [ 'error' => $wp_chatbot_decoded['error'] ] );
    } else {
        // Return success + messages array
        echo wp_json_encode( [
            'success'      => true,
            'messages'     => isset( $wp_chatbot_decoded['messages'] ) ? $wp_chatbot_decoded['messages'] : [],
            'ai_messages'  => isset( $wp_chatbot_decoded['ai_messages'] ) ? $wp_chatbot_decoded['ai_messages'] : [],
            'has_rate_key' => array_key_exists( 'rate', $wp_chatbot_decoded ),
            'rate'         => isset( $wp_chatbot_decoded['rate'] ) ? $wp_chatbot_decoded['rate'] : null,
        ] );
    }
}

wp_die();
