<?php
/**
 * Chatbot Appearance Settings Page Template
 * Renders the admin UI for customizing colors, typography, bot identity, and provides
 * live preview, import/export, and reset-to-defaults functionality.
 */
if (!defined('ABSPATH')) exit;
?>
<div class="wrap chatbot-appearance-wrap" id="chatbot-appearance">

    <!-- ===== Page Header ===== -->
    <div class="appearance-page-header">
        <div class="appearance-page-header-left">
            <h1><span class="dashicons dashicons-art" style="margin-right:8px;font-size:28px;line-height:1.2;"></span>Appearance Settings</h1>
            <p class="appearance-page-subtitle">Customize the chatbot's look, colors, typography, and identity. Changes apply instantly.</p>
        </div>
        <div class="appearance-page-header-actions">
            <button type="button" class="appearance-btn appearance-btn-outline" id="appearance-reset-btn" title="Reset to defaults">
                <span class="dashicons dashicons-image-rotate"></span> Reset
            </button>
            <button type="button" class="appearance-btn appearance-btn-outline" id="appearance-export-btn">
                <span class="dashicons dashicons-download"></span> Export
            </button>
            <button type="button" class="appearance-btn appearance-btn-outline" id="appearance-import-btn">
                <span class="dashicons dashicons-upload"></span> Import
            </button>
            <input type="file" id="appearance-import-file" accept=".json" style="display:none;" />
        </div>
    </div>

    <!-- ===== Toast notification ===== -->
    <div id="appearance-toast" class="appearance-toast"></div>

    <!-- ===== Main layout: Settings + Preview ===== -->
    <div class="appearance-layout">

        <!-- Left: Settings Cards -->
        <div class="appearance-settings-col">

            <!-- ─── Bot Identity ─── -->
            <div class="appearance-card">
                <div class="appearance-card-header" data-toggle="appearance-card-identity">
                    <h2><span class="dashicons dashicons-admin-users"></span> Bot Identity</h2>
                    <span class="dashicons dashicons-arrow-down-alt2 appearance-card-toggle"></span>
                </div>
                <div class="appearance-card-body" id="appearance-card-identity">
                    <div class="appearance-field">
                        <label for="app-bot-name">Bot Display Name</label>
                        <input type="text" id="app-bot-name" data-key="bot_display_name" placeholder="Chat Assistant" maxlength="50" />
                        <small class="appearance-field-hint">Shown in the chatbot header and as the bot message label. Max 50 chars.</small>
                    </div>
                    <div class="appearance-field" style="margin-top:16px;">
                        <label>Bot Avatar / Icon</label>
                        <div class="appearance-avatar-row">
                            <div class="appearance-avatar-preview" id="appearance-avatar-preview">
                                <img src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'icon.png'); ?>" alt="Bot Avatar" id="appearance-avatar-img" />
                            </div>
                            <div class="appearance-avatar-actions">
                                <button type="button" class="appearance-btn appearance-btn-sm" id="appearance-avatar-upload">
                                    <span class="dashicons dashicons-upload"></span> Upload Image
                                </button>
                                <button type="button" class="appearance-btn appearance-btn-sm appearance-btn-outline" id="appearance-avatar-reset">
                                    <span class="dashicons dashicons-image-rotate"></span> Reset to Default
                                </button>
                            </div>
                        </div>
                        <input type="hidden" id="app-bot-avatar-url" data-key="bot_avatar_url" value="" />
                    </div>
                </div>
            </div>

            <!-- ─── Typography ─── -->
            <div class="appearance-card">
                <div class="appearance-card-header" data-toggle="appearance-card-fonts">
                    <h2><span class="dashicons dashicons-editor-paragraph"></span> Typography</h2>
                    <span class="dashicons dashicons-arrow-down-alt2 appearance-card-toggle"></span>
                </div>
                <div class="appearance-card-body" id="appearance-card-fonts">
                    <div class="appearance-field-row">
                        <div class="appearance-field">
                            <label for="app-font-family">Font Family</label>
                            <select id="app-font-family" data-key="font_family">
                                <option value="'Inter', sans-serif">Inter</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Outfit', sans-serif">Outfit</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Lato', sans-serif">Lato</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Nunito', sans-serif">Nunito</option>
                                <option value="system-ui, sans-serif">System UI</option>
                            </select>
                        </div>
                    </div>
                    <div class="appearance-field-row appearance-field-row-3">
                        <div class="appearance-field">
                            <label for="app-font-size">Size (px)</label>
                            <input type="number" id="app-font-size" min="10" max="28" step="1" data-key="font_size" value="14" />
                        </div>
                        <div class="appearance-field">
                            <label for="app-font-weight">Weight</label>
                            <select id="app-font-weight" data-key="font_weight">
                                <option value="300">Light (300)</option>
                                <option value="400">Regular (400)</option>
                                <option value="500">Medium (500)</option>
                                <option value="600">Semi-Bold (600)</option>
                                <option value="700">Bold (700)</option>
                            </select>
                        </div>
                        <div class="appearance-field">
                            <label for="app-letter-spacing">Spacing (px)</label>
                            <input type="number" id="app-letter-spacing" min="-2" max="5" step="0.1" data-key="letter_spacing" value="0" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- ─── UI Colors ─── -->
            <div class="appearance-card">
                <div class="appearance-card-header" data-toggle="appearance-card-colors">
                    <h2><span class="dashicons dashicons-admin-appearance"></span> UI Colors</h2>
                    <span class="dashicons dashicons-arrow-down-alt2 appearance-card-toggle"></span>
                </div>
                <div class="appearance-card-body" id="appearance-card-colors">
                    <div class="appearance-color-grid">
                        <div class="appearance-color-field">
                            <label for="app-color-primary">Primary</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-color-primary" data-key="color_primary" />
                                <input type="text" class="appearance-color-hex" data-linked="app-color-primary" maxlength="7" />
                            </div>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-color-secondary">Secondary</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-color-secondary" data-key="color_secondary" />
                                <input type="text" class="appearance-color-hex" data-linked="app-color-secondary" maxlength="7" />
                            </div>
                            <small class="appearance-field-hint">Hover states, send button hover, toggle hover</small>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-color-background">Background</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-color-background" data-key="color_background" />
                                <input type="text" class="appearance-color-hex" data-linked="app-color-background" maxlength="7" />
                            </div>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-color-accent">Accent</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-color-accent" data-key="color_accent" />
                                <input type="text" class="appearance-color-hex" data-linked="app-color-accent" maxlength="7" />
                            </div>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-messages-bg">Messages BG</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-messages-bg" data-key="messages_bg" />
                                <input type="text" class="appearance-color-hex" data-linked="app-messages-bg" maxlength="7" />
                            </div>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-user-bubble-bg">User Bubble BG</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-user-bubble-bg" data-key="user_bubble_bg" />
                                <input type="text" class="appearance-color-hex" data-linked="app-user-bubble-bg" maxlength="7" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ─── Text Colors ─── -->
            <div class="appearance-card">
                <div class="appearance-card-header" data-toggle="appearance-card-text-colors">
                    <h2><span class="dashicons dashicons-editor-textcolor"></span> Text Colors</h2>
                    <span class="dashicons dashicons-arrow-down-alt2 appearance-card-toggle"></span>
                </div>
                <div class="appearance-card-body" id="appearance-card-text-colors">
                    <div class="appearance-color-grid">
                        <div class="appearance-color-field">
                            <label for="app-text-user">User Messages</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-text-user" data-key="text_user_message" />
                                <input type="text" class="appearance-color-hex" data-linked="app-text-user" maxlength="7" />
                            </div>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-text-bot">Bot Messages</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-text-bot" data-key="text_bot_message" />
                                <input type="text" class="appearance-color-hex" data-linked="app-text-bot" maxlength="7" />
                            </div>
                        </div>
                        <div class="appearance-color-field">
                            <label for="app-text-ui">UI Text</label>
                            <div class="appearance-color-input-wrap">
                                <input type="color" id="app-text-ui" data-key="text_ui" />
                                <input type="text" class="appearance-color-hex" data-linked="app-text-ui" maxlength="7" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== Save Button ===== -->
            <div class="appearance-save-row">
                <button type="button" class="appearance-btn appearance-btn-primary appearance-btn-lg" id="appearance-save-btn">
                    <span class="dashicons dashicons-saved"></span> Save Appearance Settings
                </button>
            </div>

        </div><!-- /settings col -->

        <!-- Right: Live Preview -->
        <div class="appearance-preview-col">
            <div class="appearance-preview-sticky">
                <h3 class="appearance-preview-title">Live Preview</h3>
                <div class="appearance-preview-phone">
                    <div class="appearance-preview-chatbot" id="preview-chatbot">
                        <!-- Preview Header -->
                        <div class="preview-header" id="preview-header">
                            <img src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'icon.png'); ?>" alt="Bot" id="preview-avatar-img" class="preview-header-avatar" />
                            <div class="preview-header-info">
                                <span class="preview-header-name" id="preview-bot-name"><?php echo esc_html(get_option('chatbot_name') ?: 'Chat Assistant'); ?></span>
                                <span class="preview-header-status">Online • Ready to help</span>
                            </div>
                            <span class="preview-close">&times;</span>
                        </div>
                        <!-- Preview Messages -->
                        <div class="preview-messages" id="preview-messages">
                            <div class="preview-msg preview-msg-bot">
                                <div class="preview-msg-label" id="preview-msg-bot-label">Bot</div>
                                <div class="preview-msg-text">Hello! How can I help you today? 👋</div>
                            </div>
                            <div class="preview-msg preview-msg-user">
                                <div class="preview-msg-label">You</div>
                                <div class="preview-msg-text">I have a question about your services.</div>
                            </div>
                            <div class="preview-msg preview-msg-bot">
                                <div class="preview-msg-label" id="preview-msg-bot-label-2">Bot</div>
                                <div class="preview-msg-text">Of course! I'd be happy to help. What would you like to know?</div>
                            </div>
                        </div>
                        <!-- Preview Input -->
                        <div class="preview-input-area" id="preview-input-area">
                            <div class="preview-input-field">Type your message...</div>
                            <div class="preview-send-btn" id="preview-send-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                            </div>
                        </div>
                    </div>
                    <!-- Preview Toggle Button -->
                    <div class="preview-toggle-btn" id="preview-toggle-btn">
                        <img src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'icon.png'); ?>" alt="Toggle" id="preview-toggle-avatar" />
                    </div>
                </div>
            </div>
        </div><!-- /preview col -->

    </div><!-- /layout -->

</div>
