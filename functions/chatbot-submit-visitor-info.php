<?php
if ( ! defined( 'ABSPATH' ) ) exit;

check_ajax_referer( 'chatbot_action', 'nonce' );

if ( session_status() === PHP_SESSION_NONE ) {
    session_start();
}
// Get the current session ID

$wp_chatbot_visitor_id = session_id();

$wp_chatbot_result = chatbot_api_request( 'POST', CHATBOT_API_BASE_URL . '/visitor/save_data', [
    'username'   => get_option( 'chatbot_username' ),
    'token'      => get_option( 'chatbot_token' ),
    'name'       => isset( $_POST['name'] )     ? sanitize_text_field( wp_unslash( $_POST['name'] ) )     : '',
    'email'      => isset( $_POST['email'] )    ? sanitize_email( wp_unslash( $_POST['email'] ) )           : '',
    'phone'      => isset( $_POST['phone'] )    ? sanitize_text_field( wp_unslash( $_POST['phone'] ) )    : '',
    'interest'   => isset( $_POST['interest'] ) ? sanitize_text_field( wp_unslash( $_POST['interest'] ) ) : '',
    'visitor_id' => $wp_chatbot_visitor_id,
] );

if ( $wp_chatbot_result['success'] && isset( $wp_chatbot_result['data']['response'] ) ) {
    echo wp_kses_post( $wp_chatbot_result['data']['response'] );
} else {
    echo wp_kses_post( $wp_chatbot_result['raw'] );
}

wp_die();
