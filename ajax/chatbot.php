<?php

function chatbot_handle_question()
{
    // include plugin_dir_path(__FILE__) . '../functions/chatbot-handle-question-local-ai.php';
    include plugin_dir_path(__FILE__) . '../functions/chatbot-handle-question.php';
}

function chatbot_handle_check_token()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-check-token.php';
}

function chatbot_scrapping()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-scrapping.php';
}

function chatbot_file_upload()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-file-upload.php';
}

function chatbot_settings()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-choose-settings.php';
}

function chatbot_check_files()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-check-files.php';
}

function chatbot_submit_visitor_info()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-submit-visitor-info.php';
}

function chatbot_livechat_settings_save()
{
    include plugin_dir_path(__FILE__) . '../functions/chatbot-livechat-settings.php';
}



add_action('wp_ajax_ask_question', 'chatbot_handle_question');
add_action('wp_ajax_nopriv_ask_question', 'chatbot_handle_question');

add_action('wp_ajax_check_token', 'chatbot_handle_check_token');

add_action('wp_ajax_chatbot_scrapping', 'chatbot_scrapping');

add_action('wp_ajax_chatbot_file_upload', 'chatbot_file_upload');

add_action('wp_ajax_chatbot_settings', 'chatbot_settings');

add_action('wp_ajax_chatbot_check_files', 'chatbot_check_files');

add_action('wp_ajax_submit_visitor_info', 'chatbot_submit_visitor_info');
add_action('wp_ajax_nopriv_submit_visitor_info', 'chatbot_submit_visitor_info');

add_action('wp_ajax_chatbot_livechat_settings_save', 'chatbot_livechat_settings_save');