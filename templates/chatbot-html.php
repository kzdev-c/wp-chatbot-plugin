<?php
$chatbot_name = get_option('chatbot_name', 'Chatbot');
$theme_color  = get_option('chatbot_theme_color', '#d2232a');
$text_color   = get_option('chatbot_text_color', '#ffffff');
?>
<style>
    :root {
        --chatbot-theme-color: <?php echo esc_attr($theme_color); ?>;
        --chatbot-text-color: <?php echo esc_attr($text_color); ?>;
    }
</style>

<div id="codeness-chatbot" class="collapsed">
    <div id="codeness-chatbot-header">
        <img src="<?php echo plugin_dir_url(__FILE__); ?>icon.png" alt="Chatbot Icon" id="bot-image-header">
        <span><?php echo esc_html($chatbot_name); ?></span>
        <span id="codeness-chatbot-close">-</span>
    </div>

    <div id="codeness-chatbot-messages">
        <!-- Messages will go here -->
    </div>

    <div id="chatbot-input-container">
        <textarea id="codeness-chatbot-input" placeholder="Type your question..." rows="1"></textarea>
        <div class="language-selector">
            <select id="language-select">
                <option value="en-US">EN</option>
                <option value="ar-EG">Ar</option>
            </select>
        </div>
        <button id="codeness-chatbot-mic">
            <i class="fas fa-microphone"></i>
        </button>
        <button id="codeness-chatbot-send">
            <i class="fas fa-paper-plane"></i>
        </button>
    </div>
</div>

<div id="codeness-chatbot-toggle">
    <img src="<?php echo plugin_dir_url(__FILE__); ?>icon.png" alt="Chatbot Icon" id="bot-image">
</div>