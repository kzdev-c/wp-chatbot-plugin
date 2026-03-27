<?php

function chatbot_livechat_send()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-send.php';
}

function chatbot_livechat_typing()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-typing.php';
}

function chatbot_livechat_close()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-close.php';
}

function chatbot_livechat_rate()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-rate.php';
}

function chatbot_livechat_poll()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-poll.php';
}

function chatbot_save_livechat_settings()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-save-livechat-settings.php';
}



add_action('wp_ajax_livechat_send_message', 'chatbot_livechat_send');
add_action('wp_ajax_nopriv_livechat_send_message', 'chatbot_livechat_send');

add_action('wp_ajax_livechat_typing', 'chatbot_livechat_typing');
add_action('wp_ajax_nopriv_livechat_typing', 'chatbot_livechat_typing');

add_action('wp_ajax_livechat_close', 'chatbot_livechat_close');
add_action('wp_ajax_nopriv_livechat_close', 'chatbot_livechat_close');

add_action('wp_ajax_livechat_rate', 'chatbot_livechat_rate');
add_action('wp_ajax_nopriv_livechat_rate', 'chatbot_livechat_rate');

add_action('wp_ajax_livechat_poll', 'chatbot_livechat_poll');
add_action('wp_ajax_nopriv_livechat_poll', 'chatbot_livechat_poll');

add_action('wp_ajax_save_livechat_settings', 'chatbot_save_livechat_settings');