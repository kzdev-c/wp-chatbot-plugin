<?php
// Load appearance settings for avatar and bot name
require_once plugin_dir_path(__FILE__) . '../functions/chatbot-appearance-settings.php';
$_appearance_defaults = chatbot_appearance_defaults();
$_appearance = get_option('chatbot_appearance', $_appearance_defaults);
$_appearance = wp_parse_args($_appearance, $_appearance_defaults);
$_bot_avatar = !empty($_appearance['bot_avatar_url']) ? $_appearance['bot_avatar_url'] : plugin_dir_url(__FILE__) . 'icon.png';
$_bot_name   = !empty($_appearance['bot_display_name']) ? $_appearance['bot_display_name'] : (get_option('chatbot_name') ?: 'Chat Assistant');
?>
<div id="codeness-chatbot" class="collapsed">
    <div id="codeness-chatbot-header">
        <img src="<?php echo esc_url($_bot_avatar); ?>" alt="Chatbot Icon" id="bot-image-header">
        <div style="display:flex; flex-direction:column; flex:1; gap:2px;">
            <span><?php echo esc_html($_bot_name); ?></span>
            <span style="font-size:11px; font-weight:400; opacity:0.75;">Online • Ready to help</span>
        </div>
        <span id="codeness-chatbot-close">&times;</span>
    </div>

    <div id="codeness-chatbot-messages">
        <!-- Messages will go here -->
    </div>

    <div id="chatbot-input-container">
        <textarea id="codeness-chatbot-input" placeholder="Type your message..." rows="1"></textarea>
        <div class="language-selector">
            <select id="language-select">
                <option value="en-US">EN</option>
                <option value="ar-EG">Ar</option>
            </select>
        </div>
        <button id="codeness-chatbot-mic" title="Voice input">
            <i class="fas fa-microphone"></i>
        </button>
        <button id="codeness-chatbot-send" title="Send message">
            <i class="fas fa-paper-plane"></i>
        </button>
        <button id="codeness-chatbot-end-chat" title="End chat">
            <i class="fas fa-times-circle"></i>
        </button>
    </div>
</div>

<div id="codeness-chatbot-toggle">
    <img src="<?php echo esc_url($_bot_avatar); ?>" alt="Chatbot Icon" id="bot-image">
    <span id="codeness-chatbot-counter" style="display:none;">0</span>
</div>

<div id="form-modal" class="modal">
    <div class="modal-content">
        <span id="close-modal" class="close">&times;</span>
        <h2>Get In Touch</h2>
        <p style="text-align:center; color:#6b7280; font-size:14px; margin:0 0 8px 0; font-family:'Inter',sans-serif;">We'd love to hear from you. Fill in the details below.</p>
        <form id="contact-form">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" placeholder="John Doe" required>

            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="john@example.com" required>

            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" placeholder="+1 (555) 000-0000" required>

            <label for="interest">Interest / Topic</label>
            <input type="text" id="interest" name="interest" placeholder="What are you interested in?" required>

            <button id="submit-visitor-info" type="submit">Send Message</button>
        </form>
        <div id="info-response"></div>
    </div>
</div>

<!-- Close Chat Confirmation Dialog -->
<div id="close-chat-dialog" class="chat-dialog-overlay">
    <div class="chat-dialog-box">
        <div class="chat-dialog-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="chat-dialog-title">End Live Chat?</h3>
        <p class="chat-dialog-text">Are you sure you want to close this conversation? This action cannot be undone.</p>
        <div class="chat-dialog-actions">
            <button id="close-chat-cancel" class="chat-dialog-btn chat-dialog-btn-cancel">Cancel</button>
            <button id="close-chat-confirm" class="chat-dialog-btn chat-dialog-btn-confirm">End Chat</button>
        </div>
    </div>
</div>