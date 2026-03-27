<?php
/*
Plugin Name: Chatbot Plugin
Version: 1.1
*/

define('CHATBOT_API_BASE_URL', 'https://chatbots.codenesslab.com');

require_once plugin_dir_path(__FILE__) . 'admin/menu.php';
require_once plugin_dir_path(__FILE__) . 'enqueue/scripts.php';
require_once plugin_dir_path(__FILE__) . 'settings/defaults.php';
require_once plugin_dir_path(__FILE__) . 'ajax/chatbot.php';
require_once plugin_dir_path(__FILE__) . 'ajax/livechat.php';