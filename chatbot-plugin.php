<?php
/*
Plugin Name: Chatbot Plugin
Description: A simple chatbot that interacts with an external API.
Version: 2.0
Author: codenesslab
Icon: icon.png
*/

define('CHATBOT_API_BASE_URL', 'https://web-chatbots.codenesslab.com');

function chatbot_html()
{
    include plugin_dir_path(__FILE__) . '/templates/chatbot-html.php';
}

function chatbot_enqueue_scripts() {
    wp_enqueue_style('chatbot-css', plugin_dir_url(__FILE__) . 'css/chatbot.css', [], '2.0');
    wp_enqueue_script('chatbot-js', plugin_dir_url(__FILE__) . 'js/chatbot.js', ['jquery'], '2.0', true);

    wp_localize_script('chatbot-js', 'chatbotAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
    ]);
}

function load_font_awesome()
{
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');
}

function chatbot_handle_question()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-handle-question.php';
}

add_action('wp_enqueue_scripts', 'chatbot_enqueue_scripts');
add_action('wp_enqueue_scripts', 'load_font_awesome');
add_action('wp_footer', 'chatbot_html');

add_action('wp_ajax_ask_question', 'chatbot_handle_question');
add_action('wp_ajax_nopriv_ask_question', 'chatbot_handle_question');
