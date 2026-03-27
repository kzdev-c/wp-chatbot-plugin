<?php

function chatbot_enqueue_scripts($hook)
{

    // Add Pusher and Echo for WebSockets
    wp_enqueue_script(
        'pusher-js',
        'https://js.pusher.com/8.2.0/pusher.min.js',
        [],
        null,
        true
    );

    wp_enqueue_script(
        'my-reverb-client',
        plugin_dir_url(__FILE__) . '../js/reverb.js',
        ['pusher-js'],
        null,
        true
    );

    wp_enqueue_style(
        'chatbot-css',
        plugin_dir_url(__FILE__) . '../css/chatbot.css'
    );

    wp_enqueue_script(
        'chatbot-js',
        plugin_dir_url(__FILE__) . '../js/chatbot.js',
        ['jquery', 'my-reverb-client'],
        '1.1',
        true
    );

    wp_enqueue_script(
        'chatbot-scrapping-js',
        plugin_dir_url(__FILE__) . '../js/chatbotScrapping.js',
        ['jquery'],
        null,
        true
    );

    wp_enqueue_script(
        'chatbot-settings-js',
        plugin_dir_url(__FILE__) . '../js/chatbotSettings.js',
        ['jquery'],
        null,
        true
    );

    wp_enqueue_script(
        'chatbot-check-files-js',
        plugin_dir_url(__FILE__) . '../js/chatbotSettings.js',
        ['jquery'],
        null,
        true
    );

    if (
        $hook === 'toplevel_page_chatbot_settings' ||
        $hook === 'chatbot_page_chatbot_web_scraping' ||
        $hook === 'chatbot_page_chatbot_file_upload'
    ) {
        wp_enqueue_style(
            'settings-css',
            plugin_dir_url(__FILE__) . '../css/settings.css'
        );
    }

    $ws_host = parse_url(CHATBOT_DASHBOARD_API_BASE_URL, PHP_URL_HOST) ?: 'chatbot-dashboard.local';

    wp_localize_script('chatbot-js', 'chatbotAjax', [
        'ajaxurl'          => admin_url('admin-ajax.php'),
        'livechat_ws_host' => $ws_host,
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
    wp_enqueue_style(
        'font-awesome',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
    );
}


function load_bootstrap()
{
    wp_enqueue_style(
        'bootstrap-css',
        'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'
    );

    wp_enqueue_script(
        'bootstrap-js',
        'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
        ['jquery'],
        null,
        true
    );
}


add_action('admin_enqueue_scripts', 'load_bootstrap');
add_action('admin_enqueue_scripts', 'chatbot_enqueue_scripts');

add_action('wp_enqueue_scripts', 'chatbot_enqueue_scripts');
add_action('wp_enqueue_scripts', 'load_font_awesome');
