<?php

$module = sanitize_text_field($_POST['preferred_module']);
$chatbot_name = isset($_POST['chatbot_name']) ? sanitize_text_field($_POST['chatbot_name']) : null;
$ai_chat_enabled = isset($_POST['ai_chat_enabled']) ? sanitize_text_field($_POST['ai_chat_enabled']) : '0';

// Update the preferred module option
update_option('preferred_module', $module);

// Update the ai chat enabled option
update_option('ai_chat_enabled', $ai_chat_enabled);

// Update the chatbot name option if it is set
if (isset($chatbot_name)) {
    update_option('chatbot_name', $chatbot_name);
}

// Prepare the success message
$messages = [];

if ($chatbot_name) {
    $messages[] = 'Chatbot name has been updated to "' . esc_html($chatbot_name) . '".';
}

$messages[] = 'Your chatbot now uses the "' . esc_html($module) . '" module.';

// Display the success messages
echo '<div class="notice notice-success is-dismissible"><p>' . implode('<br>', $messages) . '</p></div>';

wp_die();
?>
