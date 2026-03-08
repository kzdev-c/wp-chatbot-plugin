<?php
$chatbot_name = get_option('chatbot_name', 'Chatbot');
$theme_color  = get_option('chatbot_theme_color', '#d2232a');
$text_color   = get_option('chatbot_text_color', '#ffffff');
?>
<div class="wrap chatbot-settings-wrap">
    <h1><span class="dashicons dashicons-format-chat" style="font-size: 30px; margin-right: 8px;"></span> Chatbot Settings</h1>

    <div class="chatbot-settings-card">
        <h2>Appearance</h2>
        <p class="description">Customize how the chatbot looks on your website.</p>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="chatbot_name">Bot Name</label>
                </th>
                <td>
                    <input type="text" id="chatbot_name" name="chatbot_name"
                        value="<?php echo esc_attr($chatbot_name); ?>"
                        class="regular-text" placeholder="e.g. Support Bot" />
                    <p class="description">This name appears in the chatbot header.</p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="chatbot_theme_color">Theme Color</label>
                </th>
                <td>
                    <input type="text" id="chatbot_theme_color" name="chatbot_theme_color"
                        value="<?php echo esc_attr($theme_color); ?>"
                        class="chatbot-color-picker" data-default-color="#d2232a" />
                    <p class="description">The accent color for header, bot messages, and buttons.</p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="chatbot_text_color">Text Color</label>
                </th>
                <td>
                    <input type="text" id="chatbot_text_color" name="chatbot_text_color"
                        value="<?php echo esc_attr($text_color); ?>"
                        class="chatbot-color-picker" data-default-color="#ffffff" />
                    <p class="description">The text color used in the header, bot messages, and buttons.</p>
                </td>
            </tr>
        </table>

        <div class="chatbot-settings-actions">
            <button id="chatbot-save-settings" class="button button-primary button-large">
                <span class="dashicons dashicons-yes" style="margin-top: 4px;"></span> Save Settings
            </button>
            <span id="chatbot-save-status"></span>
        </div>
    </div>

    <div class="chatbot-settings-card chatbot-preview-card">
        <h2>Preview</h2>
        <p class="description">Live preview of your chatbot appearance.</p>
        <div class="chatbot-preview-container">
            <div class="chatbot-preview">
                <div class="chatbot-preview-header" id="preview-header">
                    <span class="preview-bot-name" id="preview-bot-name"><?php echo esc_html($chatbot_name); ?></span>
                    <span class="preview-close">-</span>
                </div>
                <div class="chatbot-preview-messages">
                    <div class="preview-bot-msg" id="preview-bot-msg">
                        <div class="preview-msg-header">Bot</div>
                        <div class="preview-msg-content">Hello! How can I help you today?</div>
                    </div>
                    <div class="preview-user-msg">
                        <div class="preview-msg-header">You</div>
                        <div class="preview-msg-content">Hi there!</div>
                    </div>
                </div>
                <div class="chatbot-preview-input">
                    <span>Type your question...</span>
                </div>
            </div>
        </div>
    </div>
</div>
