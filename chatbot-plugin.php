<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/*
Plugin Name: WP Chatbot Addon
Description: An advanced AI-powered chatbot bridging automated support with live chat escalation, complete with file processing and web scraping capabilities.
Version: 2.0
Author: codenesslab
License: GPLv2 or later
Icon: icon.png
*/


define('CHATBOT_API_BASE_URL', 'https://web-chatbots.codenesslab.com');
$wp_chatbot_dashboard_url = get_option('chatbot_dashboard_url', 'https://chatbots-dashboard.codenesslab.com');

define('CHATBOT_DASHBOARD_API_BASE_URL', rtrim($wp_chatbot_dashboard_url, '/'));

require_once plugin_dir_path(__FILE__) . 'functions/api-helper.php';
require_once plugin_dir_path(__FILE__) . 'admin/menu.php';
require_once plugin_dir_path(__FILE__) . 'enqueue/scripts.php';
require_once plugin_dir_path(__FILE__) . 'settings/defaults.php';
require_once plugin_dir_path(__FILE__) . 'ajax/chatbot.php';
require_once plugin_dir_path(__FILE__) . 'ajax/livechat.php';