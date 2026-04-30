<?php
if ( ! defined( 'ABSPATH' ) ) exit;

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_module = isset( $_POST['preferred_module'] ) ? sanitize_text_field( wp_unslash( $_POST['preferred_module'] ) ) : '';
$wp_chatbot_name   = isset( $_POST['chatbot_name'] ) ? sanitize_text_field( wp_unslash( $_POST['chatbot_name'] ) ) : null;

// Update the preferred module option
update_option( 'preferred_module', $wp_chatbot_module );

// Update the chatbot name option if it is set
if ( isset( $wp_chatbot_name ) ) {
    update_option( 'chatbot_name', $wp_chatbot_name );
}

// Prepare the success message
$wp_chatbot_messages = [];

if ( $wp_chatbot_name ) {
    $wp_chatbot_messages[] = 'Chatbot name has been updated to "' . esc_html( $wp_chatbot_name ) . '".';
}

$wp_chatbot_messages[] = 'Your chatbot now uses the "' . esc_html( $wp_chatbot_module ) . '" module.';

// Display the success messages
echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( implode( ' ', $wp_chatbot_messages ) ) . '</p></div>';

wp_die();
