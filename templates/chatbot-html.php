<div id="codeness-chatbot" class="collapsed">
    <div id="codeness-chatbot-header">
        <img src="<?php echo plugin_dir_url(__FILE__); ?>icon.png" alt="Chatbot Icon" id="bot-image-header">
        <span><?php echo get_option('chatbot_name'); ?></span>
        <span id="codeness-chatbot-close">-</span>
        <!-- <span id="codeness-chatbot-maximize">⤢</span> -->
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

<div id="form-modal" class="modal">
    <div class="modal-content">
        <span id="close-modal" class="close">&times;</span>
        <h2>Contact Information</h2>
        <form id="contact-form">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required><br>

            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required><br>

            <label for="phone">Phone:</label>
            <input type="tel" id="phone" name="phone" required><br>

            <label for="interest">Interest:</label>
            <input type="text" id="interest" name="interest" required><br>

            <button id="submit-visitor-info" type="submit">Submit</button>
        </form>
        <div id="info-response">

        </div>
    </div>
</div>