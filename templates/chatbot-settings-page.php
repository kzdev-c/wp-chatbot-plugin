<?php if (!defined('ABSPATH')) exit; ?>
<div class="wrap chatbot-settings-wrap" id="chatbot">

    <!-- Page Header -->
    <div class="settings-page-header">
        <div>
            <h1 style="display:flex; align-items:center; gap:8px;"><span class="dashicons dashicons-admin-generic" style="font-size:32px; width:32px; height:32px; line-height:32px;"></span> Chatbot Settings</h1>
            <p class="settings-page-subtitle">Configure credentials, chat mode, and connection settings.</p>
        </div>
    </div>

    <!-- Toast -->
    <div id="settings-toast" class="settings-toast"></div>

    <div class="settings-grid">

        <!-- ─── Left Column ─── -->
        <div class="settings-col-main">

            <!-- Card: Chat Mode -->
            <div class="settings-card">
                <div class="settings-card-header">
                    <h2><span class="dashicons dashicons-format-chat"></span> Chat Mode</h2>
                </div>
                <div class="settings-card-body">
                    <p class="settings-card-desc">Choose how the chatbot operates for your visitors.</p>
                    <div class="chat-mode-options">
                        <?php $chat_mode = get_option('chatbot_chat_mode', 'ai_only'); ?>
                        <label class="chat-mode-option <?php echo $chat_mode === 'ai_only' ? 'active' : ''; ?>" for="chat-mode-ai">
                            <input type="radio" name="chat_mode" id="chat-mode-ai" value="ai_only" <?php checked($chat_mode, 'ai_only'); ?> />
                            <span class="chat-mode-icon"><span class="dashicons dashicons-welcome-learn-more"></span></span>
                            <span class="chat-mode-label">AI Only</span>
                            <span class="chat-mode-desc">Fully automated AI responses. No human agents.</span>
                        </label>
                        <label class="chat-mode-option <?php echo $chat_mode === 'livechat_only' ? 'active' : ''; ?>" for="chat-mode-live">
                            <input type="radio" name="chat_mode" id="chat-mode-live" value="livechat_only" <?php checked($chat_mode, 'livechat_only'); ?> />
                            <span class="chat-mode-icon"><span class="dashicons dashicons-admin-users"></span></span>
                            <span class="chat-mode-label">Live Chat Only</span>
                            <span class="chat-mode-desc">Human agents handle all conversations.</span>
                        </label>
                        <label class="chat-mode-option <?php echo $chat_mode === 'both' ? 'active' : ''; ?>" for="chat-mode-both">
                            <input type="radio" name="chat_mode" id="chat-mode-both" value="both" <?php checked($chat_mode, 'both'); ?> />
                            <span class="chat-mode-icon"><span class="dashicons dashicons-randomize"></span></span>
                            <span class="chat-mode-label">Both (AI + Live)</span>
                            <span class="chat-mode-desc">AI handles initial queries, escalates to live agents.</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Card: General -->
            <div class="settings-card">
                <div class="settings-card-header">
                    <h2><span class="dashicons dashicons-admin-settings"></span> General</h2>
                </div>
                <div class="settings-card-body">
                    <div class="settings-field-row-2">
                        <div class="settings-field" style="width: 100%;">
                            <label for="preferred-module">Preferred Module</label>
                            <select id="preferred-module" name="preferred_module">
                                <option disabled>Select Module</option>
                                <option value="web_scrapper" <?php if (get_option('preferred_module') == 'web_scrapper') echo 'selected'; ?>>Web Scrapper</option>
                                <option value="file_upload" <?php if (get_option('preferred_module') == 'file_upload') echo 'selected'; ?>>File Upload</option>
                            </select>
                        </div>
                    </div>
                    <div id="check-files-container" style="display:none;">
                        <button type="button" class="settings-btn settings-btn-outline settings-btn-sm" id="check-files-btn">
                            <span class="dashicons dashicons-media-text"></span> Check Files
                        </button>
                    </div>
                    <div id="module-response" class="settings-response"></div>

                    <div class="settings-save-row">
                        <button type="button" class="settings-btn settings-btn-primary" id="save-general-btn">
                            <span class="dashicons dashicons-saved"></span> Save General Settings
                        </button>
                    </div>
                </div>
            </div>

            <!-- Card: Live Chat Connection (shown when mode includes livechat) -->
            <div class="settings-card" id="livechat-settings-card" style="<?php echo ($chat_mode === 'ai_only') ? 'display:none;' : ''; ?>">
                <div class="settings-card-header">
                    <h2><span class="dashicons dashicons-admin-links"></span> Live Chat Connection</h2>
                </div>
                <div class="settings-card-body">
                    <div class="settings-field">
                        <label for="livechat_secret_key">Secret Key</label>
                        <input type="password" id="livechat_secret_key" name="livechat_secret_key" value="<?php echo esc_attr(get_option('livechat_secret_key')); ?>" placeholder="••••••••" />
                    </div>
                    <div id="livechat-section-response" class="settings-response"></div>

                    <div class="settings-save-row">
                        <button type="button" class="settings-btn settings-btn-primary" id="save-livechat-btn">
                            <span class="dashicons dashicons-saved"></span> Save Live Chat Settings
                        </button>
                    </div>
                </div>
            </div>

        </div>

        <!-- ─── Right Column: Credentials ─── -->
        <div class="settings-col-side">
            <div class="settings-card settings-card-credentials">
                <div class="settings-card-header">
                    <h2><span class="dashicons dashicons-lock"></span> API Credentials</h2>
                </div>
                <div class="settings-card-body">
                    <div class="settings-field">
                        <label for="chatbot_dashboard_url">Dashboard API URL</label>
                        <input type="url" id="chatbot_dashboard_url" name="chatbot_dashboard_url" value="<?php echo esc_attr(get_option('chatbot_dashboard_url', 'https://chatbot-dashboard.local')); ?>" />
                        <small style="color:#9ca3af;font-size:11.5px;margin-top:4px;display:block;">Base URL used for all API calls including credential verification.</small>
                    </div>
                    <div class="settings-field">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" value="<?php echo esc_attr(get_option('chatbot_username')); ?>" required />
                    </div>
                    <div class="settings-field">
                        <label for="token">Token</label>
                        <input type="password" id="token" name="token" value="<?php echo esc_attr(get_option('chatbot_token')); ?>" required placeholder="••••••••" />
                    </div>
                    <div id="chatbot-response" class="settings-response"></div>
                    <button type="button" class="settings-btn settings-btn-primary" id="submit-btn" style="width:100%">
                        <span class="dashicons dashicons-yes-alt"></span> Check & Save Credentials
                    </button>
                </div>
            </div>

            <!-- Status indicator -->
            <div class="settings-card settings-card-status">
                <div class="settings-card-body" style="padding:16px 20px;">
                    <div class="settings-status-row">
                        <span class="settings-status-dot <?php echo get_option('chatbot_token') ? 'active' : ''; ?>"></span>
                        <span>API: <?php echo get_option('chatbot_token') ? '<strong>Connected</strong>' : '<em>Not configured</em>'; ?></span>
                    </div>
                    <div class="settings-status-row">
                        <span class="settings-status-dot <?php echo get_option('has_livechat') == '1' ? 'active' : ''; ?>"></span>
                        <span>Live Chat: <?php echo get_option('has_livechat') == '1' ? '<strong>Available</strong>' : '<em>Not available</em>'; ?></span>
                    </div>
                    <div class="settings-status-row">
                        <span class="settings-status-dot active"></span>
                        <span>Mode: <strong><?php
                                $m = get_option('chatbot_chat_mode', 'ai_only');
                                echo $m === 'ai_only' ? 'AI Only' : ($m === 'livechat_only' ? 'Live Chat Only' : 'AI + Live Chat');
                            ?></strong></span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>