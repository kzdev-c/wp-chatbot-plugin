/**
 * Chatbot Plugin – Appearance Settings Page JavaScript
 *
 * Handles: live preview, save/load/import/export/reset, avatar upload,
 * card collapse, color-hex sync, and dynamic CSS variable updates.
 */
jQuery(document).ready(function ($) {

    /* ================================================================
       1. CONSTANTS & STATE
       ================================================================ */
    const DEFAULTS = {
        color_primary:      '#d2232a',
        color_secondary:    '#a81b21',
        color_background:   '#ffffff',
        color_accent:       '#e8555b',
        text_user_message:  '#1a1d26',
        text_bot_message:   '#ffffff',
        text_ui:            '#6b7280',
        font_family:        "'Inter', sans-serif",
        font_size:          '14',
        font_weight:        '400',
        letter_spacing:     '0',
        bot_display_name:   'Chat Assistant',
        bot_avatar_url:     '',
        messages_bg:        '#f7f8fc',
        user_bubble_bg:     '#eef1f8',
    };

    const defaultAvatarUrl = (typeof chatbotAppearanceData !== 'undefined')
        ? chatbotAppearanceData.defaultAvatarUrl
        : '';

    let currentSettings = Object.assign({}, DEFAULTS);
    let isDirty = false;

    /* ================================================================
       2. TOAST HELPER
       ================================================================ */
    function showToast(message, type) {
        type = type || 'success';
        const $t = $('#appearance-toast');
        $t.removeClass('show success error warning')
          .addClass(type)
          .text(message);
        setTimeout(function () { $t.addClass('show'); }, 10);
        setTimeout(function () { $t.removeClass('show'); }, 3500);
    }

    /* ================================================================
       3. LOAD SETTINGS FROM SERVER
       ================================================================ */
    function loadSettings(callback) {
        $.ajax({
            url: chatbotAppearanceData.ajaxurl,
            method: 'POST',
            data: { action: 'chatbot_appearance_load' },
            success: function (res) {
                if (res.success && res.data && res.data.settings) {
                    currentSettings = $.extend({}, DEFAULTS, res.data.settings);
                    populateForm(currentSettings);
                    applyPreview(currentSettings);
                    if (callback) callback(currentSettings);
                }
            }
        });
    }

    /* ================================================================
       4. POPULATE THE FORM WITH SETTINGS
       ================================================================ */
    function populateForm(s) {
        // Colour fields
        $('input[type="color"][data-key]').each(function () {
            var key = $(this).data('key');
            if (s[key]) {
                $(this).val(s[key]);
                // Sync hex text
                var linked = $(this).attr('id');
                $('[data-linked="' + linked + '"]').val(s[key]);
            }
        });

        // Select/text/range
        $('select[data-key], input[type="text"][data-key], input[type="number"][data-key]').each(function () {
            var key = $(this).data('key');
            if (s[key] !== undefined) {
                $(this).val(s[key]);
            }
        });



        // Hidden fields
        $('input[type="hidden"][data-key]').each(function () {
            var key = $(this).data('key');
            if (s[key] !== undefined) $(this).val(s[key]);
        });

        // Avatar
        if (s.bot_avatar_url) {
            $('#appearance-avatar-img').attr('src', s.bot_avatar_url);
        } else {
            $('#appearance-avatar-img').attr('src', defaultAvatarUrl);
        }

        isDirty = false;
    }

    /* ================================================================
       5. COLLECT FORM VALUES INTO SETTINGS OBJECT
       ================================================================ */
    function collectFormValues() {
        var s = {};

        $('input[type="color"][data-key]').each(function () {
            s[$(this).data('key')] = $(this).val();
        });

        $('select[data-key]').each(function () {
            s[$(this).data('key')] = $(this).val();
        });

        $('input[type="text"][data-key], input[type="number"][data-key]').each(function () {
            s[$(this).data('key')] = $(this).val();
        });


        $('input[type="hidden"][data-key]').each(function () {
            s[$(this).data('key')] = $(this).val();
        });

        return s;
    }

    /* ================================================================
       6. LIVE PREVIEW – Applies settings to preview elements
       ================================================================ */
    function buildGradient(primary, accent) {
        return 'linear-gradient(135deg, ' + primary + ' 0%, ' + accent + ' 50%, ' + primary + ' 100%)';
    }

    function applyPreview(s) {
        var grad = buildGradient(s.color_primary, s.color_accent);

        // Dynamic hover styles for preview
        var dynamicStyleId = 'appearance-preview-hover-styles';
        var $style = $('#' + dynamicStyleId);
        if (!$style.length) {
            $style = $('<style id="' + dynamicStyleId + '"></style>').appendTo('head');
        }
        $style.html(`
            #preview-send-btn { cursor: pointer; transition: background 0.25s ease; }
            #preview-send-btn:hover { background: ${s.color_secondary} !important; }
            #preview-toggle-btn { cursor: pointer; transition: background 0.25s ease; }
            #preview-toggle-btn:hover { background: ${s.color_secondary} !important; }
        `);

        // Preview header
        $('#preview-header').css('background', grad);
        $('#preview-bot-name').text(s.bot_display_name || 'Chat Assistant');

        // Preview messages
        $('#preview-messages').css('background', s.messages_bg);
        $('.preview-msg-bot').css({
            'background': grad,
            'color': s.text_bot_message,
        });
        $('.preview-msg-user').css({
            'background': s.user_bubble_bg,
            'color': s.text_user_message,
        });

        // Bot label
        var botLabel = s.bot_display_name || 'Bot';
        $('#preview-msg-bot-label, #preview-msg-bot-label-2').text(botLabel);

        // Input area
        $('#preview-input-area').css('background', s.color_background);
        $('.preview-input-field').css('background', s.messages_bg);

        // Send button
        $('#preview-send-btn').css('background', grad);

        // Toggle button
        $('#preview-toggle-btn').css({
            'background': grad,
            'box-shadow': '0 4px 16px ' + hexToRgba(s.color_primary, 0.35),
        });

        // Typography
        var fontStack = s.font_family;
        if (fontStack.indexOf(',') === -1) {
            fontStack += ', sans-serif';
        }
        $('#preview-chatbot').css({
            'font-family': fontStack,
            'font-size': s.font_size + 'px',
            'font-weight': s.font_weight,
            'letter-spacing': s.letter_spacing + 'px',
        });

        // Avatars
        var avatarSrc = s.bot_avatar_url || defaultAvatarUrl;
        $('#preview-avatar-img, #preview-toggle-avatar').attr('src', avatarSrc);

        // Also update the live chatbot on the page if it exists (instant update)
        applyToChatbot(s);
    }

    /* ================================================================
       7. APPLY TO ACTUAL CHATBOT (if visible on page)
       ================================================================ */
    function applyToChatbot(s) {
        var grad = buildGradient(s.color_primary, s.color_accent);
        var root = document.documentElement;

        // CSS custom properties
        root.style.setProperty('--chat-primary', s.color_primary);
        root.style.setProperty('--chat-primary-dark', s.color_secondary);
        root.style.setProperty('--chat-primary-gradient', grad);
        root.style.setProperty('--chat-bg', s.color_background);
        root.style.setProperty('--chat-messages-bg', s.messages_bg);
        root.style.setProperty('--chat-user-bubble', s.user_bubble_bg);
        root.style.setProperty('--chat-user-text', s.text_user_message);
        root.style.setProperty('--chat-bot-text', s.text_bot_message);
        root.style.setProperty('--chat-font', s.font_family);
        root.style.setProperty('--chat-toggle-shadow', '0 6px 24px ' + hexToRgba(s.color_primary, 0.4));

        // Direct element updates (for existing messages)
        var $chatbot = $('#codeness-chatbot');
        if ($chatbot.length) {
            // Header name
            $chatbot.find('#codeness-chatbot-header span:first-of-type').text(s.bot_display_name || 'Chat Assistant');

            // Avatars
            var avatarSrc = s.bot_avatar_url || defaultAvatarUrl;
            $chatbot.find('#bot-image-header').attr('src', avatarSrc);
            $('#bot-image').attr('src', avatarSrc);

            // Update existing bot message headers
            $chatbot.find('.bot-message:not(.agent-message) .message-header').text(s.bot_display_name || 'Bot');
        }
    }

    /* ================================================================
       8. COLOR HEX <-> PICKER SYNC
       ================================================================ */
    // Colour picker ➔ hex text
    $(document).on('input', 'input[type="color"][data-key]', function () {
        var id = $(this).attr('id');
        $('[data-linked="' + id + '"]').val($(this).val());
        onSettingChanged();
    });

    // Hex text ➔ colour picker
    $(document).on('input', '.appearance-color-hex', function () {
        var linked = $(this).data('linked');
        var val = $(this).val();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            $('#' + linked).val(val);
            onSettingChanged();
        }
    });

    /* ================================================================
       9. INPUT EVENTS – Any change triggers live preview
       ================================================================ */
    $(document).on('input change', 'select[data-key], input[data-key]', function () {
        onSettingChanged();
    });


    let pendingUpdate = false;
    function onSettingChanged() {
        if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(function() {
                isDirty = true;
                var s = collectFormValues();
                currentSettings = s;
                applyPreview(s);
                pendingUpdate = false;
            });
        }
    }

    /* ================================================================
       10. CARD COLLAPSE TOGGLE
       ================================================================ */
    $(document).on('click', '.appearance-card-header[data-toggle]', function () {
        var targetId = $(this).data('toggle');
        var $body = $('#' + targetId);
        $body.toggleClass('collapsed');
        $(this).toggleClass('collapsed');
    });

    /* ================================================================
       11. SAVE SETTINGS
       ================================================================ */
    $('#appearance-save-btn').on('click', function () {
        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Saving…');

        var s = collectFormValues();

        $.ajax({
            url: chatbotAppearanceData.ajaxurl,
            method: 'POST',
            data: $.extend({ action: 'chatbot_appearance_save' }, s),
            success: function (res) {
                if (res.success) {
                    currentSettings = res.data.settings || s;
                    isDirty = false;
                    showToast(res.data.message || 'Settings saved!', 'success');

                    if (res.data.warnings && res.data.warnings.length) {
                        showToast('Warnings: ' + res.data.warnings.join(', '), 'warning');
                    }
                } else {
                    showToast(res.data || 'Error saving settings.', 'error');
                }
            },
            error: function () {
                showToast('Network error. Please try again.', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });

    /* ================================================================
       12. EXPORT SETTINGS
       ================================================================ */
    $('#appearance-export-btn').on('click', function () {
        var s = collectFormValues();
        var json = JSON.stringify(s, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href = url;
        a.download = 'chatbot-appearance-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Settings exported successfully.', 'success');
    });

    /* ================================================================
       13. IMPORT SETTINGS
       ================================================================ */
    $('#appearance-import-btn').on('click', function () {
        $('#appearance-import-file').val('').trigger('click');
    });

    $('#appearance-import-file').on('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            showToast('Please select a JSON file.', 'error');
            return;
        }

        if (file.size > 50000) {
            showToast('File is too large. Max 50KB.', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (ev) {
            var raw = ev.target.result;

            // Validate JSON
            try {
                var parsed = JSON.parse(raw);
                if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                    showToast('Invalid settings format.', 'error');
                    return;
                }
            } catch (ex) {
                showToast('Invalid JSON file.', 'error');
                return;
            }

            // Send to server for validation & save
            $.ajax({
                url: chatbotAppearanceData.ajaxurl,
                method: 'POST',
                data: {
                    action: 'chatbot_appearance_import',
                    import_data: raw,
                },
                success: function (res) {
                    if (res.success) {
                        currentSettings = res.data.settings || parsed;
                        populateForm(currentSettings);
                        applyPreview(currentSettings);
                        isDirty = false;
                        showToast(res.data.message || 'Settings imported!', 'success');
                    } else {
                        showToast(res.data || 'Import failed.', 'error');
                    }
                },
                error: function () {
                    showToast('Network error during import.', 'error');
                }
            });
        };
        reader.readAsText(file);
    });

    /* ================================================================
       14. RESET TO DEFAULTS
       ================================================================ */
    $('#appearance-reset-btn').on('click', function () {
        if (!confirm('Reset all appearance settings to defaults? This cannot be undone.')) return;

        $.ajax({
            url: chatbotAppearanceData.ajaxurl,
            method: 'POST',
            data: { action: 'chatbot_appearance_reset' },
            success: function (res) {
                if (res.success) {
                    currentSettings = res.data.settings || DEFAULTS;
                    populateForm(currentSettings);
                    applyPreview(currentSettings);
                    isDirty = false;
                    showToast('Settings reset to defaults.', 'success');
                }
            },
            error: function () {
                showToast('Network error. Please try again.', 'error');
            }
        });
    });

    /* ================================================================
       15. AVATAR UPLOAD (WordPress Media Library)
       ================================================================ */
    var mediaFrame = null;

    $('#appearance-avatar-upload').on('click', function (e) {
        e.preventDefault();

        if (mediaFrame) {
            mediaFrame.open();
            return;
        }

        mediaFrame = wp.media({
            title: 'Choose Bot Avatar',
            button: { text: 'Use this Image' },
            multiple: false,
            library: { type: 'image' },
        });

        mediaFrame.on('select', function () {
            var attachment = mediaFrame.state().get('selection').first().toJSON();
            var url = attachment.url;

            // Validate dimensions (prefer square-ish images)
            if (attachment.width && attachment.height) {
                var ratio = attachment.width / attachment.height;
                if (ratio < 0.5 || ratio > 2.0) {
                    showToast('For best results, use a square image.', 'warning');
                }
            }

            $('#app-bot-avatar-url').val(url);
            $('#appearance-avatar-img').attr('src', url);
            onSettingChanged();
        });

        mediaFrame.open();
    });

    $('#appearance-avatar-reset').on('click', function () {
        $('#app-bot-avatar-url').val('');
        $('#appearance-avatar-img').attr('src', defaultAvatarUrl);
        onSettingChanged();
    });

    /* ================================================================
       16. HELPER – Hex to RGBA
       ================================================================ */
    function hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    /* ================================================================
       17. UNSAVED CHANGES WARNING
       ================================================================ */
    $(window).on('beforeunload', function () {
        if (isDirty) {
            return 'You have unsaved appearance changes. Leave anyway?';
        }
    });

    /* ================================================================
       18. SPIN ANIMATION (for save button)
       ================================================================ */
    $('<style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;}</style>').appendTo('head');

    /* ================================================================
       INIT: Load settings from server
       ================================================================ */
    loadSettings();

});
