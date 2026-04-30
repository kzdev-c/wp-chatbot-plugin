<?php
if ( ! defined( 'ABSPATH' ) ) exit;

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_api_url = CHATBOT_API_BASE_URL . '/file_chatbot/list_uploaded_files';

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, [
    'username' => get_option( 'chatbot_username' ),
    'token'    => get_option( 'chatbot_token' ),
] );

if ( $wp_chatbot_result['success'] ) {
    $wp_chatbot_response_data = $wp_chatbot_result['data'];
    if ( ! empty( $wp_chatbot_response_data['files'][0]['file_name'] ) ) {
        $wp_chatbot_fileName = $wp_chatbot_response_data['files'][0]['file_name'];
        update_option( 'file_name', $wp_chatbot_fileName );
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( $wp_chatbot_fileName ) . '</p></div>';
    } else {
        echo '<div class="notice notice-error is-dismissible"><p>Error: No files found.</p><p>Please upload files from your dashboard first.</p></div>';
    }
} else {
    echo '<div class="notice notice-error is-dismissible"><p>Error: Unable to reach API.</p><p>' . esc_html( $wp_chatbot_result['error'] ) . '</p></div>';
}

wp_die();
