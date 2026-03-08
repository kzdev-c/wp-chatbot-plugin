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
        <button type="submit" class="btn btn-primary">Save</button>
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
            <input type="text" id="token" name="token" value="<?php echo esc_attr(get_option('chatbot_token')); ?>" required>
        </div>
        <button id="submit-btn" name="chatbot_save_settings" value="Save Settings" class="btn btn-primary">Check & Save</button>
    </form>

</div>