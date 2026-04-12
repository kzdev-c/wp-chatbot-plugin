jQuery(document).ready(function ($) {

    const saveBtn = $('#submit-btn');
    const tokenInput = $('#token');
    const usernameInput = $('#username');
    const preferredModuleSelect = $('#preferred-module');

    /* ================================================================
       TOAST HELPER
       ================================================================ */
    function showToast(message, type) {
        type = type || 'success';
        var $t = $('#settings-toast');
        $t.removeClass('show success error').addClass(type).text(message);
        setTimeout(function () { $t.addClass('show'); }, 10);
        setTimeout(function () { $t.removeClass('show'); }, 3500);
    }

    /* ================================================================
       MODULE LABEL HELPERS
       ================================================================ */
    var moduleLabels = {
        database_chatbot: 'Database Chatbot',
        file_chatbot:     'File Chatbot',
        web_scraper:      'Web Scraper',
        live_chat:        'Live Chat'
    };

    function getModuleLabel(mod) {
        return moduleLabels[mod] || mod.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    }

    /* ================================================================
       RENDER MODULES
       ================================================================ */
    function renderModules(modules) {
        var $list = $('#modules-list');
        $list.empty();

        if (!modules || modules.length === 0) {
            $list.html('<p class="modules-empty">No modules enabled.</p>');
            return;
        }

        modules.forEach(function (mod) {
            $list.append('<span class="module-tag">' + getModuleLabel(mod) + '</span>');
        });
    }

    /* ================================================================
       RENDER FILES
       ================================================================ */
    function renderFiles(files) {
        var $list = $('#files-list');
        var $count = $('#files-count');
        $list.empty();

        var total = files ? files.length : 0;
        $count.text(total);

        if (total === 0) {
            $list.html('<p class="files-empty">No files uploaded.</p>');
            return;
        }

        files.forEach(function (file) {
            $list.append(
                '<div class="file-item">' +
                    '<span class="file-name">' + (file.file_name || 'Unknown') + '</span>' +
                '</div>'
            );
        });
    }

    /* ================================================================
       CHAT MODE SELECTOR
       ================================================================ */
    $('input[name="chat_mode"]').on('change', function () {
        var mode = $(this).val();

        // Update active class
        $('.chat-mode-option').removeClass('active');
        $(this).closest('.chat-mode-option').addClass('active');

        // Save immediately
        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_save_chat_mode',
                chat_mode: mode
            },
            success: function () {
                showToast('Chat mode updated!', 'success');
                var labels = { ai_only: 'AI Only', livechat_only: 'Live Chat Only', both: 'AI + Live Chat' };
                $('.settings-status-row').last().find('strong').text(labels[mode] || mode);
            },
            error: function () {
                showToast('Error saving chat mode.', 'error');
            }
        });
    });

    /* ================================================================
       CHECK INPUTS (credentials)
       ================================================================ */
    function checkInputs() {
        saveBtn.prop('disabled', !(usernameInput.val().trim() && tokenInput.val().trim()));
    }

    usernameInput.on('input', checkInputs);
    tokenInput.on('input', checkInputs);
    checkInputs();

    /* ================================================================
       SAVE CREDENTIALS  (check token)
       ================================================================ */
    saveBtn.on('click', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Syncing…');

        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'check_token',
                token: tokenInput.val(),
                username: usernameInput.val(),
                chatbot_dashboard_url: $('#chatbot_dashboard_url').val()
            },
            success: function (response) {
                try {
                    var parsed = typeof response === 'string' ? JSON.parse(response) : response;
                    $('#chatbot-response').html(parsed.html);
                    setTimeout(function () { $('#chatbot-response').fadeOut(400); }, 4000);

                    // Update Status UI
                    var $apiDot = $('#status-dot-api');
                    var $apiText = $('#status-text-api');
                    if (parsed.success) {
                        $apiDot.addClass('active');
                        $apiText.html('API: <strong>Connected</strong>');
                    } else {
                        $apiDot.removeClass('active');
                        $apiText.html('API: <em>Not configured</em>');
                    }

                    // Render modules
                    var modules = parsed.modules || [];
                    renderModules(modules);
                    $('#modules-card').show();

                    // Render files
                    var files = parsed.files || [];
                    renderFiles(files);
                    $('#files-card').show();

                    // Update preferred module select dynamically
                    var currentPref = preferredModuleSelect.val();
                    preferredModuleSelect.find('option:not(:disabled)').remove();
                    if (modules.indexOf('web_scraper') !== -1) {
                        preferredModuleSelect.append('<option value="web_scrapper">Web Scrapper</option>');
                    }
                    if (modules.indexOf('file_chatbot') !== -1) {
                        preferredModuleSelect.append('<option value="file_upload">File Upload</option>');
                    }
                    if (currentPref) {
                        preferredModuleSelect.val(currentPref);
                    }

                    // Check for live_chat module
                    var hasLiveChat = modules.indexOf('live_chat') !== -1;

                    if (hasLiveChat) {
                        $('#chat-mode-both').prop('checked', true);
                        $('.chat-mode-option').removeClass('active');
                        $('#chat-mode-both').closest('.chat-mode-option').addClass('active');
                        showToast('Credentials valid – Live Chat enabled! Mode set to AI + Live Chat.', 'success');
                    } else {
                        $('#chat-mode-ai').prop('checked', true);
                        $('.chat-mode-option').removeClass('active');
                        $('#chat-mode-ai').closest('.chat-mode-option').addClass('active');
                        if (parsed.success) {
                            showToast('Credentials valid. Mode set to AI.', 'success');
                        }
                    }

                } catch (ex) {
                    showToast('Invalid response from server.', 'error');
                }
            },
            error: function () {
                showToast('Connection error. Please try again.', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });

    /* ================================================================
       SAVE GENERAL SETTINGS (Module + Name)
       ================================================================ */
    $('#save-general-btn').on('click', function () {
        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Saving…');

        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_settings',
                preferred_module: preferredModuleSelect.val()
            },
            success: function () {
                showToast('General settings saved!', 'success');
            },
            error: function () {
                showToast('Error saving settings.', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });

    /* ================================================================
       SAVE LIVE CHAT SETTINGS
       ================================================================ */
    $('#save-livechat-btn').on('click', function () {
        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Saving…');

        var chat_mode = $('input[name="chat_mode"]:checked').val();
        var ai_chat_enabled = (chat_mode === 'both') ? '1' : '0';

        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_livechat_settings_save',
                chatbot_dashboard_url: $('#chatbot_dashboard_url').val(),
                ai_chat_enabled: ai_chat_enabled
            },
            success: function () {
                showToast('Live chat settings saved!', 'success');
            },
            error: function () {
                showToast('Error saving live chat settings.', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });

});
