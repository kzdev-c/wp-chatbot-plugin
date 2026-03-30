<?php

function chatbot_default_settings()
{
    if (get_option('chatbot_token') === false) {
        update_option('chatbot_token', '');
    }

    if (get_option('chatbot_username') === false) {
        update_option('chatbot_username', '');
    }

    if (get_option('domain') === false) {
        update_option('domain', '');
    }

    if (get_option('file_name') === false) {
        update_option('file_name', '');
    }

    if (get_option('prefered_module') === false) {
        update_option('prefered_module', '');
    }

    if (get_option('chatbot_name') === false) {
        update_option('chatbot_name', '');
    }

    if (get_option('live_chatbot_session_id', null)) {
        add_option('live_chatbot_session_id', null);
    }

    if (get_option('livechat_secret_key') === false) {
        update_option('livechat_secret_key', '');
    }

    if (get_option('chatbot_dashboard_url') === false) {
        update_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local');
    }
}


add_action('admin_init', 'chatbot_default_settings');
