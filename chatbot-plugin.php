<?php
/*
Plugin Name: Chatbot Plugin
Description: A simple chatbot that interacts with an external API.
Version: 2.2
Author: codenesslab
Icon: icon.png
*/

define('CHATBOT_API_BASE_URL', 'https://web-chatbots.codenesslab.com');

function chatbot_html()
{
    include plugin_dir_path(__FILE__) . '/templates/chatbot-html.php';
}

function chatbot_settings_page()
{
    include plugin_dir_path(__FILE__) . '/templates/chatbot-settings-page.php';
}

function chatbot_add_admin_menu()
{
    add_menu_page(
        __('Chatbot Settings', 'chatbot-plugin'),
        __('Chatbot', 'chatbot-plugin'),
        'manage_options',
        'chatbot_settings',
        'chatbot_settings_page',
        plugin_dir_url(__FILE__) . 'icon[16x16].png',
        75
    );
}

function chatbot_enqueue_scripts()
{
    wp_enqueue_style('chatbot-css', plugin_dir_url(__FILE__) . 'css/chatbot.css', [], '2.2');
    wp_enqueue_script('chatbot-js', plugin_dir_url(__FILE__) . 'js/chatbot.js', ['jquery'], '2.2', true);

    wp_localize_script('chatbot-js', 'chatbotAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
    ]);
}

function chatbot_admin_enqueue_scripts($hook)
{
    if ($hook !== 'toplevel_page_chatbot_settings') {
        return;
    }
    wp_enqueue_style('chatbot-settings-css', plugin_dir_url(__FILE__) . 'css/settings.css', [], '2.2');
    wp_enqueue_style('wp-color-picker');
    wp_enqueue_script('chatbot-settings-js', plugin_dir_url(__FILE__) . 'js/chatbotSettings.js', ['jquery', 'wp-color-picker'], '2.2', true);
    wp_localize_script('chatbot-settings-js', 'chatbotSettingsAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('chatbot_save_settings'),
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

function chatbot_save_settings()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-save-settings.php';
}

function chatbot_default_settings()
{
    if (get_option('chatbot_name') === false) {
        update_option('chatbot_name', 'Chatbot');
    }
    if (get_option('chatbot_theme_color') === false) {
        update_option('chatbot_theme_color', '#d2232a');
    }
    if (get_option('chatbot_text_color') === false) {
        update_option('chatbot_text_color', '#ffffff');
    }
}

add_action('admin_menu', 'chatbot_add_admin_menu');
add_action('admin_enqueue_scripts', 'chatbot_admin_enqueue_scripts');
add_action('wp_enqueue_scripts', 'chatbot_enqueue_scripts');
add_action('wp_enqueue_scripts', 'load_font_awesome');
add_action('wp_footer', 'chatbot_html');

add_action('wp_ajax_ask_question', 'chatbot_handle_question');
add_action('wp_ajax_nopriv_ask_question', 'chatbot_handle_question');

add_action('wp_ajax_chatbot_save_settings', 'chatbot_save_settings');

add_action('admin_init', 'chatbot_default_settings');
