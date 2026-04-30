<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Handles sending a message via the Live Chat API.
 * Called via AJAX action 'livechat_send_message'.
 */

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_message       = isset( $_POST['message'] )       ? sanitize_text_field( wp_unslash( $_POST['message'] ) )       : '';
$wp_chatbot_session_id    = isset( $_POST['session_id'] )    ? sanitize_text_field( wp_unslash( $_POST['session_id'] ) )    : '';
$wp_chatbot_visitor_name  = isset( $_POST['visitor_name'] )  ? sanitize_text_field( wp_unslash( $_POST['visitor_name'] ) )  : '';
$wp_chatbot_visitor_email = isset( $_POST['visitor_email'] ) ? sanitize_email( wp_unslash( $_POST['visitor_email'] ) )       : '';

$wp_chatbot_token    = get_option( 'chatbot_token' );
$wp_chatbot_base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if ( empty( $wp_chatbot_token ) ) {
    echo wp_json_encode( [ 'error' => 'Live chat is not configured. Please set the Token in Credentials settings.' ] );
    wp_die();
}

if ( empty( $wp_chatbot_message ) || empty( $wp_chatbot_session_id ) ) {
    echo wp_json_encode( [ 'error' => 'Message and session ID are required.' ] );
    wp_die();
}

$wp_chatbot_api_url = rtrim( $wp_chatbot_base_url, '/' ) . '/message';

$wp_chatbot_domain = wp_parse_url( home_url(), PHP_URL_HOST );
$wp_chatbot_post_data = [
    'token'         => $wp_chatbot_token,
    'session_id'    => $wp_chatbot_session_id,
    'message'       => $wp_chatbot_message,
    'visitor_name'  => $wp_chatbot_session_id . ' - ' . $wp_chatbot_domain,
    'visitor_email' => ! empty( $wp_chatbot_visitor_email ) ? $wp_chatbot_visitor_email : '',
    'location'      => ( isset( $_COOKIE['cb_user_location'] ) && $_COOKIE['cb_user_location'] !== 'not provided' ) ? sanitize_text_field( wp_unslash( $_COOKIE['cb_user_location'] ) ) : null,
    'device'        => ( isset( $_COOKIE['cb_user_agent'] ) && $_COOKIE['cb_user_agent'] !== 'not provided' ) ? sanitize_text_field( wp_unslash( $_COOKIE['cb_user_agent'] ) ) : null,
];

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, $wp_chatbot_post_data );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => 'Live chat error: ' . $wp_chatbot_result['error'] ] );
} else {
    $wp_chatbot_decoded_response = $wp_chatbot_result['data'];
    if ( isset( $wp_chatbot_decoded_response['error'] ) ) {
        echo wp_json_encode( [ 'error' => 'Live chat API error: ' . $wp_chatbot_decoded_response['error'] ] );
    } else {
        echo wp_json_encode( [
            'success' => true,
            'data'    => $wp_chatbot_decoded_response,
        ] );
    }
}

wp_die();
