<?php
/*
Plugin Name: Chatbot Plugin
Description: A simple chatbot that interacts with an external API.
Version: 1.1
Author: codenesslab
Icon: icon.png
*/

define('CHATBOT_API_BASE_URL', 'https://chatbots.codenesslab.com');

function chatbot_add_admin_menu()
{
    add_menu_page(
        __('Chatbot Settings', 'chatbot-plugin'),
        __('Chatbot', 'chatbot-plugin'),
        'manage_options',
        'chatbot_settings', // Use the slug of the first submenu item
        'chatbot_settings_page',
        plugin_dir_url(__FILE__) . 'icon[16x16].png',
        75
    );

    add_submenu_page(
        'chatbot_settings', // Match the parent slug
        __('Settings', 'chatbot-plugin'),
        __('Settings', 'chatbot-plugin'),
        'manage_options',
        'chatbot_settings',
        'chatbot_settings_page'
    );

    add_submenu_page(
        'chatbot_settings',
        __('Live Chat Settings', 'chatbot-plugin'),
        __('Live Chat', 'chatbot-plugin'),
        'manage_options',
        'chatbot_livechat_settings',
        'chatbot_livechat_settings_page'
    );

    add_submenu_page(
        'chatbot_settings', 
        __('Web Scraping', 'chatbot-plugin'),
        __('Web Scraping', 'chatbot-plugin'),
        'manage_options',
        'chatbot_web_scraping',
        'chatbot_web_scraping_page'
    );
}

function chatbot_html()
{
    include plugin_dir_path(__FILE__) . '/templates/chatbot-html.php';
}

function chatbot_settings_page() {
    include plugin_dir_path(__FILE__) . '/templates/chatbot-settings-page.php';
}

function chatbot_livechat_settings_page() {
    include plugin_dir_path(__FILE__) . '/templates/chatbot-livechat-settings-page.php';
}

function chatbot_web_scraping_page() {
    include plugin_dir_path(__FILE__) . '/templates/chatbot-web-scraping-page.php';
}

function chatbot_file_upload_page() {
    include plugin_dir_path(__FILE__) . '/templates/chatbot-file-upload-page.php';
}


function chatbot_enqueue_scripts($hook) {
    // Add Pusher and Echo for WebSockets
    wp_enqueue_script('pusher-js', 'https://js.pusher.com/8.2.0/pusher.min.js', [], null, true);
    wp_enqueue_script('laravel-echo', 'https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.min.js', [], null, true);

    wp_enqueue_style('chatbot-css', plugin_dir_url(__FILE__) . 'css/chatbot.css');
    wp_enqueue_script('chatbot-js', plugin_dir_url(__FILE__) . 'js/chatbot.js', ['jquery', 'laravel-echo'], '1.1', true);
    wp_enqueue_script('chatbot-scrapping-js', plugin_dir_url(__FILE__) . 'js/chatbotScrapping.js', ['jquery'], null, true);
    wp_enqueue_script('chatbot-settings-js', plugin_dir_url(__FILE__) . 'js/chatbotSettings.js', ['jquery'], null, true);
    wp_enqueue_script('chatbot-check-files-js', plugin_dir_url(__FILE__) . 'js/chatbotSettings.js', ['jquery'], null, true);

    // Ensure the correct hook is used for the credentials page
    if ($hook === 'toplevel_page_chatbot_settings' || $hook === 'chatbot_page_chatbot_web_scraping' || $hook === 'chatbot_page_chatbot_file_upload' || $hook === 'chatbot_page_chatbot_livechat_settings') {
        wp_enqueue_style('settings-css', plugin_dir_url(__FILE__) . 'css/settings.css');
    }

    $base_url = get_option('livechat_base_url', '');
    $ws_host = !empty($base_url) ? parse_url($base_url, PHP_URL_HOST) : 'chatbot-dashboard.local';

    wp_localize_script('chatbot-js', 'chatbotAjax', [
        'ajaxurl'            => admin_url('admin-ajax.php'),
        'livechat_enabled'   => get_option('livechat_enabled', '0'),
        'livechat_ws_host'   => $ws_host,
    ]);

    wp_localize_script('chatbot-settings-js', 'checkCredentialsAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
    ]);

    wp_localize_script('chatbot-scrapping-js', 'chatbotScrappingAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
    ]);

    wp_localize_script('chatbot-check-files-js', 'checkFilesAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
    ]);
}

function load_font_awesome()
{
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');
}

function load_bootstrap()
{
    wp_enqueue_style('bootstrap-css', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css');
    wp_enqueue_script('bootstrap-js', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js', ['jquery'], null, true);
}

function chatbot_handle_question()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-handle-question.php';
}

function chatbot_handle_check_token()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-check-token.php';
}

function chatbot_scrapping()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-scrapping.php';
}

function chatbot_file_upload()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-file-upload.php';
}

function chatbot_settings()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-choose-settings.php';
}
function chatbot_check_files()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-check-files.php';
}

function chatbot_submit_visitor_info()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-submit-visitor-info.php';
}

// Live Chat AJAX handlers
function chatbot_livechat_send()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-livechat-send.php';
}

function chatbot_livechat_typing()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-livechat-typing.php';
}

function chatbot_livechat_close()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-livechat-close.php';
}

function chatbot_livechat_rate()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-livechat-rate.php';
}

function chatbot_livechat_poll()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-livechat-poll.php';
}

function chatbot_save_livechat_settings()
{
    include plugin_dir_path(__FILE__) . '/functions/chatbot-save-livechat-settings.php';
}

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

    // Live Chat defaults
    if (get_option('livechat_base_url') === false) {
        update_option('livechat_base_url', 'https://chatbot-dashboard.local/api/livechat');
    }
    if (get_option('livechat_token') === false) {
        update_option('livechat_token', '');
    }
    if (get_option('livechat_enabled') === false) {
        update_option('livechat_enabled', '0');
    }
    if (get_option('livechat_poll_interval') === false) {
        update_option('livechat_poll_interval', '3');
    }
}

add_action('admin_menu', 'chatbot_add_admin_menu');
add_action('admin_enqueue_scripts', 'load_bootstrap');
add_action('admin_enqueue_scripts', 'chatbot_enqueue_scripts');
add_action('wp_enqueue_scripts', 'chatbot_enqueue_scripts');
add_action('wp_enqueue_scripts', 'load_font_awesome');
add_action('wp_footer', 'chatbot_html');

add_action('wp_ajax_ask_question', 'chatbot_handle_question');
add_action('wp_ajax_nopriv_ask_question', 'chatbot_handle_question');

add_action('wp_ajax_check_token', 'chatbot_handle_check_token');

add_action('wp_ajax_chatbot_scrapping', 'chatbot_scrapping');

add_action('wp_ajax_chatbot_file_upload', 'chatbot_file_upload');

add_action('wp_ajax_chatbot_settings', 'chatbot_settings');

add_action('wp_ajax_chatbot_check_files', 'chatbot_check_files');

add_action('wp_ajax_submit_visitor_info', 'chatbot_submit_visitor_info');
add_action('wp_ajax_nopriv_submit_visitor_info', 'chatbot_submit_visitor_info');

// Live Chat AJAX actions (both logged-in and guest visitors)
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

add_action('admin_init', 'chatbot_default_settings');
