<?php
/*
Plugin Name: Chatbot Plugin
Description: An advanced AI-powered chatbot bridging automated support with live chat escalation, complete with file processing and web scraping capabilities.
Version: 2.0
Author: codenesslab
Icon: icon.png
*/


define('CHATBOT_API_BASE_URL', 'https://web-chatbots.codenesslab.com');
$dashboard_url = get_option('chatbot_dashboard_url', 'https://chatbots-dashboard.codenesslab.com');

// $dashboard_url = get_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local');
// define('CHATBOT_API_BASE_URL', 'http://localhost:5000');

define('CHATBOT_DASHBOARD_API_BASE_URL', rtrim($dashboard_url, '/'));
define('CHATBOT_DEBUG', false); // Set to true to log every API request & response

// Force chat mode globally to livechat_only
// add_filter('pre_option_chatbot_chat_mode', function() {
//     return 'ai_only'; // ai_only, livechat_only, both
// });

require_once plugin_dir_path(__FILE__) . 'functions/chatbot-http.php';
require_once plugin_dir_path(__FILE__) . 'admin/menu.php';
require_once plugin_dir_path(__FILE__) . 'enqueue/scripts.php';
require_once plugin_dir_path(__FILE__) . 'settings/defaults.php';
require_once plugin_dir_path(__FILE__) . 'ajax/chatbot.php';
require_once plugin_dir_path(__FILE__) . 'ajax/livechat.php';