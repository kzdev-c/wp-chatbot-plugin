/**
 * Chatbot Plugin – Appearance Settings Page JavaScript
 *
 * Handles: live preview, save/load/import/export/reset, avatar upload,
 * card collapse, color-hex sync, and dynamic CSS variable updates.
 */
jQuery(document).ready(function ($) {

    // --- 1. Constants & Initial State ---
    const DEFAULTS = {
        color_primary:      '#d2232a',
        color_secondary:    '#a81b21',
        color_background:   '#ffffff',
        color_accent:       '#e8555b',
        color_mode:         'solid',
        text_user_message:  '#1a1d26',
        text_bot_message:   '#ffffff',
        text_ui:            '#6b7280',
        font_family:        "'Inter', sans-serif",
        letter_spacing:     '0',
        header_font_size:   '15',
        header_font_weight: '600',
        bot_font_size:      '14',
        bot_font_weight:    '400',
        user_font_size:     '14',
        user_font_weight:   '400',
        input_font_size:    '13',
        input_font_weight:  '400',
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

    // --- 2. Notifications ---
    function showToast(message, type = 'success') {
        const $t = $('#appearance-toast');
        $t.removeClass('show success error warning').addClass(type).text(message);
        setTimeout(() => $t.addClass('show'), 10);
        setTimeout(() => $t.removeClass('show'), 3500);
    }

    // --- 3. Persistence ---
    function loadSettings(callback) {
        $.ajax({
            url: chatbotAppearanceData.ajaxurl,
            method: 'POST',
            data: { action: 'chatbot_appearance_load' },
            success: function (res) {
                if (res.success && res.data?.settings) {
                    currentSettings = $.extend({}, DEFAULTS, res.data.settings);
                    populateForm(currentSettings);
                    applyPreview(currentSettings);
                    if (callback) callback(currentSettings);
                }
            }
        });
    }

    // --- 4. Form Management ---
    function populateForm(s) {
        // Sync inputs from settings object
        $('input[type="color"][data-key]').each(function () {
            const key = $(this).data('key');
            if (s[key]) {
                $(this).val(s[key]);
                $(`[data-linked="${$(this).attr('id')}"]`).val(s[key]);
            }
        });

        $('select[data-key], input[type="text"][data-key], input[type="number"][data-key], input[type="hidden"][data-key]').each(function () {
            const key = $(this).data('key');
            if (s[key] !== undefined) $(this).val(s[key]);
        });

        const mode = s.color_mode || 'solid';
        $('#color-mode-pills .appearance-pill').removeClass('active');
        $(`#color-mode-pills .appearance-pill[data-mode="${mode}"]`).addClass('active');
        $('#app-color-mode').val(mode);
        toggleAccentField(mode);

        $('#appearance-avatar-img').attr('src', s.bot_avatar_url || defaultAvatarUrl);
        isDirty = false;
    }

    function toggleAccentField(mode) {
        const $accent = $('input[data-key="color_accent"]').closest('.appearance-color-field');
        mode === 'gradient' ? $accent.slideDown(200) : $accent.slideUp(200);
    }

    function collectFormValues() {
        const s = {};
        $('input[type="color"][data-key], select[data-key], input[type="text"][data-key], input[type="number"][data-key], input[type="hidden"][data-key]').each(function () {
            s[$(this).data('key')] = $(this).val();
        });
        return s;
    }

    // --- 5. Live Preview ---
    function resolveBackground(s) {
        if (s.color_mode === 'gradient') {
            return `linear-gradient(135deg, ${s.color_primary} 0%, ${s.color_accent} 50%, ${s.color_primary} 100%)`;
        }
        return s.color_primary;
    }

    function applyPreview(s) {
        const bg = resolveBackground(s);
        const fontStack = s.font_family + (s.font_family.includes(',') ? '' : ', sans-serif');

        // Update hover styles dynamically
        const dynamicStyleId = 'appearance-preview-hover-styles';
        let $style = $('#' + dynamicStyleId);
        if (!$style.length) $style = $(`<style id="${dynamicStyleId}"></style>`).appendTo('head');
        $style.html(`
            #preview-send-btn, #preview-toggle-btn { cursor: pointer; transition: background 0.25s ease; }
            #preview-send-btn:hover, #preview-toggle-btn:hover { background: ${s.color_secondary} !important; }
        `);

        // Apply visual settings to preview elements
        $('#preview-header').css({
            'background': bg,
            'font-size': s.header_font_size + 'px',
            'font-weight': s.header_font_weight,
        });
        $('#preview-bot-name').text(s.bot_display_name || 'Chat Assistant');
        $('#preview-messages').css('background', s.messages_bg);

        $('.preview-msg-bot').css({ 'background': bg, 'color': s.text_bot_message });
        $('.preview-msg-bot .preview-msg-text').css({ 'font-size': s.bot_font_size + 'px', 'font-weight': s.bot_font_weight });

        $('.preview-msg-user').css({ 'background': s.user_bubble_bg, 'color': s.text_user_message });
        $('.preview-msg-user .preview-msg-text').css({ 'font-size': s.user_font_size + 'px', 'font-weight': s.user_font_weight });

        $('#preview-msg-bot-label, #preview-msg-bot-label-2').text(s.bot_display_name || 'Bot');
        $('#preview-input-area').css('background', s.color_background);
        $('.preview-input-field').css({ 'background': s.messages_bg, 'font-size': s.input_font_size + 'px', 'font-weight': s.input_font_weight });
        $('#preview-send-btn').css('background', bg);
        $('#preview-toggle-btn').css({ 'background': bg, 'box-shadow': `0 4px 16px ${hexToRgba(s.color_primary, 0.35)}` });
        $('#preview-chatbot').css({ 'font-family': fontStack, 'letter-spacing': s.letter_spacing + 'px' });
        $('#preview-avatar-img, #preview-toggle-avatar').attr('src', s.bot_avatar_url || defaultAvatarUrl);

        applyToChatbot(s);
    }

    // Push changes to the live chatbot if enqueued on the current page
    function applyToChatbot(s) {
        const bg = resolveBackground(s);
        const root = document.documentElement;
        const vars = {
            '--chat-primary': s.color_primary,
            '--chat-primary-dark': s.color_secondary,
            '--chat-primary-gradient': bg,
            '--chat-bg': s.color_background,
            '--chat-messages-bg': s.messages_bg,
            '--chat-user-bubble': s.user_bubble_bg,
            '--chat-user-text': s.text_user_message,
            '--chat-bot-text': s.text_bot_message,
            '--chat-font': s.font_family,
            '--chat-toggle-shadow': `0 6px 24px ${hexToRgba(s.color_primary, 0.4)}`
        };
        Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));

        const $chatbot = $('#codeness-chatbot');
        if ($chatbot.length) {
            $chatbot.find('#codeness-chatbot-header span:first-of-type').text(s.bot_display_name || 'Chat Assistant');
            const src = s.bot_avatar_url || defaultAvatarUrl;
            $chatbot.find('#bot-image-header, #bot-image').attr('src', src);
            $chatbot.find('.bot-message:not(.agent-message) .message-header').text(s.bot_display_name || 'Bot');
        }
    }

    // --- 6. Event Handlers ---
    $(document).on('input', 'input[type="color"][data-key]', function () {
        $(`[data-linked="${$(this).attr('id')}"]`).val($(this).val());
        onSettingChanged();
    });

    $(document).on('input', '.appearance-color-hex', function () {
        const val = $(this).val();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            $(`#${$(this).data('linked')}`).val(val);
            onSettingChanged();
        }
    });

    $(document).on('input change', 'select[data-key], input[data-key]', onSettingChanged);

    $(document).on('click', '#color-mode-pills .appearance-pill', function () {
        const mode = $(this).data('mode');
        $('#color-mode-pills .appearance-pill').removeClass('active');
        $(this).addClass('active');
        $('#app-color-mode').val(mode);
        toggleAccentField(mode);
        onSettingChanged();
    });

    let pendingUpdate = false;
    function onSettingChanged() {
        if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
                isDirty = true;
                currentSettings = collectFormValues();
                applyPreview(currentSettings);
                pendingUpdate = false;
            });
        }
    }

    $(document).on('click', '.appearance-card-header[data-toggle]', function () {
        $(`#${$(this).data('toggle')}`).toggleClass('collapsed');
        $(this).toggleClass('collapsed');
    });

    // --- 7. Save / Export / Import ---
    $('#appearance-save-btn').on('click', function () {
        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Saving…');

        $.ajax({
            url: chatbotAppearanceData.ajaxurl,
            method: 'POST',
            data: $.extend({ action: 'chatbot_appearance_save' }, collectFormValues()),
            success: (res) => {
                if (res.success) {
                    currentSettings = res.data.settings || currentSettings;
                    isDirty = false;
                    showToast(res.data.message || 'Settings saved!');
                    if (res.data.warnings?.length) showToast('Warnings: ' + res.data.warnings.join(', '), 'warning');
                } else showToast(res.data || 'Error saving settings.', 'error');
            },
            error: () => showToast('Network error.', 'error'),
            complete: () => $btn.prop('disabled', false).html(originalHtml)
        });
    });

    $('#appearance-export-btn').on('click', () => {
        const blob = new Blob([JSON.stringify(collectFormValues(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbot-appearance-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Settings exported.');
    });

    $('#appearance-import-btn').on('click', () => $('#appearance-import-file').val('').trigger('click'));

    $('#appearance-import-file').on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const raw = ev.target.result;
                const parsed = JSON.parse(raw);
                $.ajax({
                    url: chatbotAppearanceData.ajaxurl,
                    method: 'POST',
                    data: { action: 'chatbot_appearance_import', import_data: raw },
                    success: (res) => {
                        if (res.success) {
                            currentSettings = res.data.settings || parsed;
                            populateForm(currentSettings);
                            applyPreview(currentSettings);
                            showToast(res.data.message || 'Import successful!');
                        } else showToast(res.data || 'Import failed.', 'error');
                    }
                });
            } catch (ex) { showToast('Invalid JSON file.', 'error'); }
        };
        reader.readAsText(file);
    });

    $('#appearance-reset-btn').on('click', () => {
        if (!confirm('Reset all appearance settings?')) return;
        $.ajax({
            url: chatbotAppearanceData.ajaxurl,
            method: 'POST',
            data: { action: 'chatbot_appearance_reset' },
            success: (res) => {
                if (res.success) {
                    currentSettings = res.data.settings || DEFAULTS;
                    populateForm(currentSettings);
                    applyPreview(currentSettings);
                    showToast('Settings reset.');
                }
            }
        });
    });

    // Avatar handlers using WP Media Library
    let mediaFrame = null;
    $('#appearance-avatar-upload').on('click', function (e) {
        e.preventDefault();
        if (mediaFrame) { mediaFrame.open(); return; }
        mediaFrame = wp.media({ title: 'Choose Bot Avatar', button: { text: 'Use this Image' }, multiple: false, library: { type: 'image' } });
        mediaFrame.on('select', () => {
            const attachment = mediaFrame.state().get('selection').first().toJSON();
            $('#app-bot-avatar-url').val(attachment.url);
            $('#appearance-avatar-img').attr('src', attachment.url);
            onSettingChanged();
        });
        mediaFrame.open();
    });

    $('#appearance-avatar-reset').on('click', () => {
        $('#app-bot-avatar-url').val('');
        $('#appearance-avatar-img').attr('src', defaultAvatarUrl);
        onSettingChanged();
    });

    function hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const r = parseInt(hex.substring(0, 2), 16), g = parseInt(hex.substring(2, 4), 16), b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    $(window).on('beforeunload', () => { if (isDirty) return 'Unsaved changes! Leave anyway?'; });

    $('<style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;}</style>').appendTo('head');

    loadSettings();
});
