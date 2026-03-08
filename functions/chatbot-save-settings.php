<?php
check_ajax_referer('chatbot_save_settings', 'nonce');

if (!current_user_can('manage_options')) {
    wp_send_json_error('Unauthorized');
}

$name       = sanitize_text_field($_POST['chatbot_name'] ?? '');
$color      = sanitize_hex_color($_POST['chatbot_theme_color'] ?? '');
$text_color = sanitize_hex_color($_POST['chatbot_text_color'] ?? '');

if (empty($name)) {
    $name = 'Chatbot';
}

if (empty($color)) {
    $color = '#d2232a';
}

if (empty($text_color)) {
    $text_color = '#ffffff';
}

update_option('chatbot_name', $name);
update_option('chatbot_theme_color', $color);
update_option('chatbot_text_color', $text_color);

wp_send_json_success('Settings saved successfully.');
