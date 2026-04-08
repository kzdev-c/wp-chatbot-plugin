jQuery(document).ready(function ($) {

    const saveBtn = $('#submit-btn');
    const tokenInput = $('#token');
    const usernameInput = $('#username');
    const preferredModuleSelect = $('#preferred-module');
    const checkFilesBtn = $('#check-files-btn');

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
       CHAT MODE SELECTOR
       ================================================================ */
    $('input[name="chat_mode"]').on('change', function () {
        var mode = $(this).val();

        // Update active class
        $('.chat-mode-option').removeClass('active');
        $(this).closest('.chat-mode-option').addClass('active');

        // Show/hide live chat card
        if (mode === 'ai_only') {
            $('#livechat-settings-card').slideUp(250);
        } else {
            $('#livechat-settings-card').slideDown(250);
        }

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
                // Update status display
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
       CHECK FILES TOGGLE
       ================================================================ */
    function toggleCheckFilesButton() {
        if (preferredModuleSelect.val() === 'file_upload') {
            $('#check-files-container').show();
        } else {
            $('#check-files-container').hide();
        }
    }

    preferredModuleSelect.on('change', toggleCheckFilesButton);
    toggleCheckFilesButton();

    /* ================================================================
       SAVE CREDENTIALS
       ================================================================ */
    saveBtn.on('click', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Checking…');

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

                    // Toggle live chat availability
                    if (parsed.has_livechat) {
                        showToast('Credentials valid – Live Chat available!', 'success');
                    } else {
                        showToast('Credentials saved successfully.', 'success');
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
       CHECK FILES
       ================================================================ */
    checkFilesBtn.on('click', function () {
        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Checking…');

        $.ajax({
            url: checkFilesAjax.ajaxurl,
            type: 'POST',
            data: { action: 'chatbot_check_files' },
            success: function (response) {
                showToast(response || 'Files checked.', 'success');
            },
            error: function (jqXHR, textStatus) {
                showToast('Error checking files: ' + textStatus, 'error');
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
                livechat_secret_key: $('#livechat_secret_key').val(),
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
