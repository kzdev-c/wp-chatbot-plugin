<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Handles rating a chat session via the Live Chat API.
 * Called via AJAX action 'livechat_rate'.
 */

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_chat_id = isset( $_POST['chat_id'] ) ? intval( $_POST['chat_id'] ) : 0;
$wp_chatbot_rating  = isset( $_POST['rating'] ) ? floatval( $_POST['rating'] ) : 0;
$wp_chatbot_comment = isset( $_POST['comment'] ) ? sanitize_text_field( wp_unslash( $_POST['comment'] ) ) : '';

$wp_chatbot_token    = get_option( 'chatbot_token' );
$wp_chatbot_base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if ( empty( $wp_chatbot_token ) ) {
    echo wp_json_encode( [ 'error' => 'Live chat is not configured.' ] );
    wp_die();
}

if ( empty( $wp_chatbot_chat_id ) || $wp_chatbot_rating < 0.5 || $wp_chatbot_rating > 5 ) {
    echo wp_json_encode( [ 'error' => 'Valid Chat ID and rating (0.5-5) are required.' ] );
    wp_die();
}

$wp_chatbot_api_url = rtrim( $wp_chatbot_base_url, '/' ) . '/rate';

$wp_chatbot_post_data = [
    'token'   => $wp_chatbot_token,
    'chat_id' => $wp_chatbot_chat_id,
    'rating'  => $wp_chatbot_rating,
];

if ( ! empty( $wp_chatbot_comment ) ) {
    $wp_chatbot_post_data['comment'] = $wp_chatbot_comment;
}

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, $wp_chatbot_post_data, [], 10 );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => $wp_chatbot_result['error'] ] );
} else {
    echo wp_json_encode( [ 'success' => true, 'data' => $wp_chatbot_result['data'] ] );
}

wp_die();
