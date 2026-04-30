<?php
if ( ! defined( 'ABSPATH' ) ) exit;

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_dashboard_url  = isset( $_POST['chatbot_dashboard_url'] ) ? esc_url_raw( wp_unslash( $_POST['chatbot_dashboard_url'] ) ) : '';
$wp_chatbot_ai_chat_enabled = isset( $_POST['ai_chat_enabled'] ) ? sanitize_text_field( wp_unslash( $_POST['ai_chat_enabled'] ) ) : '0';

update_option( 'chatbot_dashboard_url', $wp_chatbot_dashboard_url );
update_option( 'ai_chat_enabled', $wp_chatbot_ai_chat_enabled );

echo 'Livechat settings saved successfully.';
wp_die();
