<?php

$dashboard_url = isset($_POST['chatbot_dashboard_url']) ? esc_url_raw($_POST['chatbot_dashboard_url']) : '';
$ai_chat_enabled = isset($_POST['ai_chat_enabled']) ? sanitize_text_field($_POST['ai_chat_enabled']) : '0';

update_option('chatbot_dashboard_url', $dashboard_url);
update_option('ai_chat_enabled', $ai_chat_enabled);

echo 'Livechat settings saved successfully.';
wp_die();
?>
