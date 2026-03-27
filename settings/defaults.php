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

}


add_action('admin_init', 'chatbot_default_settings');