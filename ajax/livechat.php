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

function chatbot_livechat_get_messages()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-get-messages.php';
}

add_action('wp_ajax_livechat_send_message', 'chatbot_livechat_send');
add_action('wp_ajax_nopriv_livechat_send_message', 'chatbot_livechat_send');

add_action('wp_ajax_livechat_typing', 'chatbot_livechat_typing');
add_action('wp_ajax_nopriv_livechat_typing', 'chatbot_livechat_typing');

add_action('wp_ajax_livechat_close', 'chatbot_livechat_close');
add_action('wp_ajax_nopriv_livechat_close', 'chatbot_livechat_close');

add_action('wp_ajax_livechat_rate', 'chatbot_livechat_rate');
add_action('wp_ajax_nopriv_livechat_rate', 'chatbot_livechat_rate');

add_action('wp_ajax_livechat_get_messages', 'chatbot_livechat_get_messages');
add_action('wp_ajax_nopriv_livechat_get_messages', 'chatbot_livechat_get_messages');