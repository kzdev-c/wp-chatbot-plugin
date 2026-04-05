<?php
/*
Plugin Name: Chatbot Plugin
Description: An advanced AI-powered chatbot bridging automated support with live chat escalation, complete with file processing and web scraping capabilities.
Version: 2.0
Author: codenesslab
Icon: icon.png
*/


define('CHATBOT_API_BASE_URL', 'https://web-chatbots.codenesslab.com');
$dashboard_url = get_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local');
define('CHATBOT_DASHBOARD_API_BASE_URL', rtrim($dashboard_url, '/'));

require_once plugin_dir_path(__FILE__) . 'admin/menu.php';
require_once plugin_dir_path(__FILE__) . 'enqueue/scripts.php';
require_once plugin_dir_path(__FILE__) . 'settings/defaults.php';
require_once plugin_dir_path(__FILE__) . 'ajax/chatbot.php';
require_once plugin_dir_path(__FILE__) . 'ajax/livechat.php';