<?php
/**
 * Saves Live Chat settings from the admin page.
 * Called via AJAX action 'save_livechat_settings'.
 */

$livechat_enabled       = sanitize_text_field($_POST['livechat_enabled']);
$livechat_base_url      = esc_url_raw($_POST['livechat_base_url']);
$livechat_token         = sanitize_text_field($_POST['livechat_token']);
$livechat_poll_interval = intval($_POST['livechat_poll_interval']);

// Validate poll interval
if ($livechat_poll_interval < 1) {
    $livechat_poll_interval = 3;
}
if ($livechat_poll_interval > 30) {
    $livechat_poll_interval = 30;
}

update_option('livechat_enabled', $livechat_enabled);
update_option('livechat_base_url', $livechat_base_url);
update_option('livechat_token', $livechat_token);
update_option('livechat_poll_interval', $livechat_poll_interval);

echo 'Live Chat settings have been saved successfully.';
wp_die();
