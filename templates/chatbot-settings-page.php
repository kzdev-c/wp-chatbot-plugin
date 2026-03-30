<div class="wrap" id="chatbot">
    <h1>Preferred Module</h1>
    <div id="module-response"></div>
    <form id="preferred-module-form" class="modern-form">
        <div class="form-group">
            <label for="preferred-module">Preferred Module:</label>
            <select class="form-control full-width" id="preferred-module" name="preferred_module" required>
                <option disabled>Select Module</option>
                <option value="web_scrapper" <?php if (get_option('preferred_module') == 'web_scrapper') echo 'selected'; ?>>Web Scrapper</option>
                <option value="file_upload" <?php if (get_option('preferred_module') == 'file_upload') echo 'selected'; ?>>File Upload</option>
            </select>
            <div id="check-files-container" style="display:none; margin-top: 10px;">
                <button type="button" class="btn btn-secondary" id="check-files-btn">Check Files</button>
            </div>
        </div>
        <div class="form-group">
            <label for="chatbot_name">Chatbot Name:</label>
            <input type="text" id="chatbot_name" name="chatbot_name" value="<?php echo esc_attr(get_option('chatbot_name')); ?>">
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 20px;">Save</button>
    </form>

    <hr>

    <div id="livechat-section-response"></div>
    <form id="livechat-section-form" class="modern-form">
        <div class="form-group">
            <label for="chatbot_dashboard_url">Dashboard API Base URL:</label>
            <input type="url" id="chatbot_dashboard_url" name="chatbot_dashboard_url" value="<?php echo esc_attr(get_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local')); ?>" required>
        </div>
        <div class="form-group">
            <label for="livechat_secret_key">Livechat Secret Key:</label>
            <input type="password" id="livechat_secret_key" name="livechat_secret_key" value="<?php echo esc_attr(get_option('livechat_secret_key')); ?>">
        </div>
        <div class="form-group" style="margin-top: 20px; padding: 15px; background: #fff; border: 1px solid #ccd0d4; border-radius: 4px; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
            <div style="display: flex; align-items: center;">
                <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px; margin-right: 12px; margin-bottom: 0;">
                    <input type="checkbox" id="ai_chat_enabled" name="ai_chat_enabled" value="1" <?php checked('1', get_option('ai_chat_enabled')); ?> style="opacity: 0; width: 0; height: 0; position: absolute;">
                    <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; transition: .4s; border-radius: 24px;"></span>
                    <style>
                        .switch .slider { background-color: #ccc; }
                        .switch input:checked + .slider { background-color: #4CAF50 !important; }
                        .switch input:focus + .slider { box-shadow: 0 0 1px #4CAF50; }
                        .switch .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
                        .switch input:checked + .slider:before { transform: translateX(20px); }
                    </style>
                </label>
                <label for="ai_chat_enabled" style="margin-bottom: 0; font-weight: 600; font-size: 14px; cursor: pointer; color: #1d2327;">Enable Live Chat Only</label>
            </div>
            <div style="margin-top: 6px; margin-left: 56px;">
                <span style="font-size: 13px; color: #646970; display: block; line-height: 1.5;">When disabled, the AI automatically handles conversations and smoothly escalates to live chat only when necessary.</span>
            </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: 20px;">Save Live Chat Settings</button>
    </form>

    <hr>

    <h1>Credentials</h1>
    <div id="chatbot-response"></div>
    <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" enctype="multipart/form-data" class="modern-form" id="chatbot-settings-form">
        <input type="hidden" name="action" value="chatbot_save_settings">
        <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" value="<?php echo esc_attr(get_option('chatbot_username')); ?>" required>
        </div>
        <div class="form-group">
            <label for="token">Token:</label>
            <input type="password" id="token" name="token" value="<?php echo esc_attr(get_option('chatbot_token')); ?>" required>
        </div>

        <button id="submit-btn" name="chatbot_save_settings" value="Save Settings" class="btn btn-primary">Check & Save</button>
    </form>

</div>