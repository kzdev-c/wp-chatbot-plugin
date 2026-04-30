<?php
if ( ! defined( 'ABSPATH' ) ) exit;

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_domain        = isset( $_POST['domain'] ) ? esc_url_raw( wp_unslash( $_POST['domain'] ) ) : '';
$wp_chatbot_useSiteDomain = isset( $_POST['useSiteDomain'] ) ? sanitize_text_field( wp_unslash( $_POST['useSiteDomain'] ) ) : '0';

$wp_chatbot_result = chatbot_api_request( 'POST', CHATBOT_API_BASE_URL . '/web_scraper/scrape', [
    'username' => get_option( 'chatbot_username' ),
    'token'    => get_option( 'chatbot_token' ),
    'url'      => $wp_chatbot_domain,
] );

if ( $wp_chatbot_result['success'] && $wp_chatbot_result['data'] ) {
    $wp_chatbot_response_data = $wp_chatbot_result['data'];
    if ( ! empty( $wp_chatbot_response_data['response'] ) ) {
        echo '<div class="notice notice-success is-dismissible"><p>[' . esc_html( $wp_chatbot_domain ) . '] ' . esc_html( $wp_chatbot_response_data['response'] ) . '</p></div>';
        update_option( 'domain', $wp_chatbot_domain );
        update_option( 'useSiteDomain', $wp_chatbot_useSiteDomain );
    } else {
        echo wp_kses_post( $wp_chatbot_result['raw'] );
    }
} else {
    echo wp_kses_post( $wp_chatbot_result['raw'] );
}

wp_die();
