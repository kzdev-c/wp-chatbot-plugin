<?php

function chatbot_add_admin_menu()
{
    add_menu_page(
        __('Chatbot Settings', 'chatbot-plugin'),
        __('Chatbot', 'chatbot-plugin'),
        'manage_options',
        'chatbot_settings',
        'chatbot_settings_page',
        plugin_dir_url(__FILE__) . '../icon[16x16].png',
        75
    );

    add_submenu_page(
        'chatbot_settings',
        __('Settings', 'chatbot-plugin'),
        __('Settings', 'chatbot-plugin'),
        'manage_options',
        'chatbot_settings',
        'chatbot_settings_page'
    );

    // Only show Web Scraping page when web_scrapper module is selected and they have the module
    $opts_modules = get_option('chatbot_modules', []);
    if (in_array('web_scraper', $opts_modules) && get_option('preferred_module', 'web_scrapper') !== 'file_upload') {
        add_submenu_page(
            'chatbot_settings',
            __('Web Scraping', 'chatbot-plugin'),
            __('Web Scraping', 'chatbot-plugin'),
            'manage_options',
            'chatbot_web_scraping',
            'chatbot_web_scraping_page'
        );
    }

    // Appearance is always last
    add_submenu_page(
        'chatbot_settings',
        __('Appearance', 'chatbot-plugin'),
        __('Appearance', 'chatbot-plugin'),
        'manage_options',
        'chatbot_appearance',
        'chatbot_appearance_page'
    );
}


function chatbot_html()
{
    include plugin_dir_path(__FILE__) . '../templates/chatbot-html.php';
}


function chatbot_settings_page()
{
    include plugin_dir_path(__FILE__) . '../templates/chatbot-settings-page.php';
}


function chatbot_appearance_page()
{
    include plugin_dir_path(__FILE__) . '../templates/chatbot-appearance-page.php';
}


function chatbot_web_scraping_page()
{
    include plugin_dir_path(__FILE__) . '../templates/chatbot-web-scraping-page.php';
}


function chatbot_file_upload_page()
{
    include plugin_dir_path(__FILE__) . '../templates/chatbot-file-upload-page.php';
}


add_action('admin_menu', 'chatbot_add_admin_menu');

add_action('wp_footer', 'chatbot_html');