<div class="wrap" id="chatbot-livechat">
    <h1>Live Chat Settings</h1>
    <p class="description">Configure the Live Chat API integration. When enabled, the AI chatbot can hand off conversations to a live agent when it returns <code>"x-key": true</code>.</p>

    <div id="livechat-response"></div>

    <form id="livechat-settings-form" class="modern-form">

        <div class="form-group">
            <label for="livechat_enabled">Enable Live Chat:</label>
            <div class="form-check">
                <input type="checkbox" id="livechat_enabled" name="livechat_enabled" value="1" <?php if (get_option('livechat_enabled') == '1') echo 'checked'; ?>>
                <label for="livechat_enabled" class="form-check-label">Allow AI to hand off to live chat when <code>x-key: true</code> is returned</label>
            </div>
        </div>

        <div class="form-group">
            <label for="livechat_base_url">Live Chat API Base URL:</label>
            <input type="text" id="livechat_base_url" name="livechat_base_url" class="form-control full-width" value="<?php echo esc_attr(get_option('livechat_base_url')); ?>" placeholder="https://chatbot-dashboard.local/api/livechat">
            <small class="form-text text-muted">The base URL for the Live Chat API (without trailing slash). Example: <code>https://chatbot-dashboard.local/api/livechat</code></small>
        </div>

        <div class="form-group">
            <label for="livechat_token">Live Chat Token:</label>
            <input type="text" id="livechat_token" name="livechat_token" class="form-control full-width" value="<?php echo esc_attr(get_option('livechat_token')); ?>" placeholder="Your chatbot token">
            <small class="form-text text-muted">The <code>chatbot_token</code> associated with your main user account for the Live Chat system.</small>
        </div>

        <div class="form-group">
            <label for="livechat_poll_interval">Poll Interval (seconds):</label>
            <input type="number" id="livechat_poll_interval" name="livechat_poll_interval" class="form-control" value="<?php echo esc_attr(get_option('livechat_poll_interval', '3')); ?>" min="1" max="30" style="max-width: 100px;">
            <small class="form-text text-muted">How often (in seconds) the chat widget polls for new agent messages during live chat. Default: 3 seconds.</small>
        </div>

        <button type="submit" class="btn btn-primary">Save Live Chat Settings</button>
    </form>

    <hr>

    <h2>How It Works</h2>
    <div class="card" style="max-width: 600px; padding: 15px; margin-top: 10px;">
        <ol style="margin-left: 15px;">
            <li><strong>AI First:</strong> Every new chat session starts with the AI chatbot.</li>
            <li><strong>Handoff Trigger:</strong> When the AI returns <code>"x-key": true</code> in its response, the chat switches to live chat mode.</li>
            <li><strong>Live Chat Mode:</strong> Messages are routed to the Live Chat API instead of the AI. TTS/microphone are disabled.</li>
            <li><strong>No Trigger = AI Continues:</strong> If <code>"x-key"</code> is not <code>true</code>, the AI continues handling the conversation.</li>
        </ol>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    $('#livechat-settings-form').on('submit', function(e) {
        e.preventDefault();

        var data = {
            action: 'save_livechat_settings',
            livechat_enabled: $('#livechat_enabled').is(':checked') ? '1' : '0',
            livechat_base_url: $('#livechat_base_url').val(),
            livechat_token: $('#livechat_token').val(),
            livechat_poll_interval: $('#livechat_poll_interval').val()
        };

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: data,
            success: function(response) {
                $('#livechat-response').html('<div class="notice notice-success is-dismissible"><p>' + response + '</p></div>');
                setTimeout(function() {
                    $('#livechat-response').fadeOut(1000);
                }, 4000);
            },
            error: function() {
                $('#livechat-response').html('<div class="notice notice-error is-dismissible"><p>Error saving settings.</p></div>');
                setTimeout(function() {
                    $('#livechat-response').fadeOut(1000);
                }, 4000);
            }
        });
    });
});
</script>
