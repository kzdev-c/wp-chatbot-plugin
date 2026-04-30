<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Fetches the workflow for the chatbot from the dashboard API.
 * Called via AJAX action 'chatbot_get_workflow'.
 */

$wp_chatbot_token = get_option( 'chatbot_token' );

if ( empty( $wp_chatbot_token ) ) {
    echo wp_json_encode( [ 'error' => 'No chatbot token configured.' ] );
    wp_die();
}

$wp_chatbot_base_url = defined( 'CHATBOT_DASHBOARD_API_BASE_URL' ) ? CHATBOT_DASHBOARD_API_BASE_URL : 'https://chatbot-dashboard.local';
$wp_chatbot_api_url  = rtrim( $wp_chatbot_base_url, '/' ) . '/api/livechat/workflow';

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, [
    'token' => $wp_chatbot_token,
] );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => 'Failed to fetch workflow: ' . $wp_chatbot_result['error'] ] );
    wp_die();
}

$wp_chatbot_http_code = $wp_chatbot_result['http_code'];
$wp_chatbot_data      = $wp_chatbot_result['data'];

// Handle different response scenarios
if ( 401 === $wp_chatbot_http_code ) {
    echo wp_json_encode( [ 'error' => 'Invalid token' ] );
    wp_die();
}

if ( 404 === $wp_chatbot_http_code ) {
    echo wp_json_encode( [ 'error' => 'No active workflow found' ] );
    wp_die();
}

if ( 200 === $wp_chatbot_http_code && isset( $wp_chatbot_data['success'] ) && true === $wp_chatbot_data['success'] && isset( $wp_chatbot_data['workflow'] ) ) {
    echo wp_json_encode( [
        'success'  => true,
        'workflow' => $wp_chatbot_data['workflow'],
    ] );
} else {
    echo wp_json_encode( [ 'error' => 'Unexpected workflow response.' ] );
}

wp_die();
