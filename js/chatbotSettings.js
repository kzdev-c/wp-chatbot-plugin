jQuery(document).ready(function ($) {

    const saveBtn = $('#submit-btn');
    const tokenInput = $('#token');
    const usernameInput = $('#username');
    const preferredModuleSelect = $('#preferred-module');

    // --- Notifications ---
    function showToast(message, type = 'success') {
        const $t = $('#settings-toast');
        $t.removeClass('show success error').addClass(type).text(message);
        setTimeout(() => $t.addClass('show'), 10);
        setTimeout(() => $t.removeClass('show'), 3500);
    }

    // --- Module & File Row Rendering ---
    const moduleLabels = {
        database_chatbot: 'Database Chatbot',
        file_chatbot:     'File Chatbot',
        web_scraper:      'Web Scraper',
        live_chat:        'Live Chat'
    };

    function getModuleLabel(mod) {
        return moduleLabels[mod] || mod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function renderModules(modules) {
        const $list = $('#modules-list');
        $list.empty();
        if (!modules?.length) {
            $list.html('<p class="modules-empty">No modules enabled.</p>');
            return;
        }
        modules.forEach(mod => $list.append(`<span class="module-tag">${getModuleLabel(mod)}</span>`));
    }

    function renderFiles(files) {
        const $list = $('#files-list');
        const total = files?.length || 0;
        $('#files-count').text(total);
        $list.empty();
        if (total === 0) {
            $list.html('<p class="files-empty">No files uploaded.</p>');
            return;
        }
        files.forEach(file => $list.append(`<div class="file-item"><span class="file-name">${file.file_name || 'Unknown'}</span></div>`));
    }

    // --- Chat Mode Selection ---
    $('input[name="chat_mode"]').on('change', function () {
        const mode = $(this).val();
        $('.chat-mode-option').removeClass('active');
        $(this).closest('.chat-mode-option').addClass('active');

        // Instant save when mode changes
        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: { action: 'chatbot_save_chat_mode', chat_mode: mode },
            success: () => {
                showToast('Chat mode updated!');
                const labels = { ai_only: 'AI Only', livechat_only: 'Live Chat Only', both: 'AI + Live Chat' };
                $('.settings-status-row').last().find('strong').text(labels[mode] || mode);
            },
            error: () => showToast('Error saving chat mode.', 'error')
        });
    });

    const checkInputs = () => saveBtn.prop('disabled', !usernameInput.val().trim() || !tokenInput.val().trim());
    usernameInput.on('input', checkInputs);
    tokenInput.on('input', checkInputs);
    checkInputs();

    // --- Credential Verification & Sync ---
    saveBtn.on('click', function (e) {
        e.preventDefault();
        const $btn = $(this);
        const originalHtml = $btn.html();
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
            success: (response) => {
                try {
                    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                    $('#chatbot-response').html(parsed.html).show();
                    setTimeout(() => $('#chatbot-response').fadeOut(400), 4000);

                    // Update connectivity status
                    const $apiDot = $('#status-dot-api');
                    const $apiText = $('#status-text-api');
                    if (parsed.success) {
                        $apiDot.addClass('active');
                        $apiText.html('API: <strong>Connected</strong>');
                    } else {
                        $apiDot.removeClass('active');
                        $apiText.html('API: <em>Not configured</em>');
                    }

                    renderModules(parsed.modules || []);
                    $('#modules-card').show();

                    renderFiles(parsed.files || []);
                    $('#files-card').show();

                    // Refresh preferred module options based on enabled modules
                    const modules = parsed.modules || [];
                    const currentPref = preferredModuleSelect.val();
                    preferredModuleSelect.find('option:not(:disabled)').remove();
                    if (modules.includes('web_scraper')) preferredModuleSelect.append('<option value="web_scrapper">Web Scrapper</option>');
                    if (modules.includes('file_chatbot')) preferredModuleSelect.append('<option value="file_upload">File Upload</option>');
                    if (currentPref) preferredModuleSelect.val(currentPref);

                    // Auto-adjust mode based on Live Chat availability
                    const hasLiveChat = modules.includes('live_chat');
                    const targetMode = hasLiveChat ? 'both' : 'ai_only';
                    $(`#chat-mode-${targetMode === 'both' ? 'both' : 'ai'}`).prop('checked', true).trigger('change');
                    
                    if (parsed.success) showToast(hasLiveChat ? 'Credentials valid - Live Chat available!' : 'Credentials valid.');
                } catch (ex) { showToast('Invalid server response.', 'error'); }
            },
            error: () => showToast('Connection error.', 'error'),
            complete: () => $btn.prop('disabled', false).html(originalHtml)
        });
    });

    // --- Action Button Handlers ---
    $('#save-general-btn').on('click', function () {
        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Saving…');

        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: { action: 'chatbot_settings', preferred_module: preferredModuleSelect.val() },
            success: () => showToast('General settings saved!'),
            error: () => showToast('Error saving settings.', 'error'),
            complete: () => $btn.prop('disabled', false).html(originalHtml)
        });
    });

    $('#save-livechat-btn').on('click', function () {
        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Saving…');

        const chat_mode = $('input[name="chat_mode"]:checked').val();
        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_livechat_settings_save',
                chatbot_dashboard_url: $('#chatbot_dashboard_url').val(),
                ai_chat_enabled: chat_mode === 'both' ? '1' : '0'
            },
            success: () => showToast('Live chat settings saved!'),
            error: () => showToast('Error saving settings.', 'error'),
            complete: () => $btn.prop('disabled', false).html(originalHtml)
        });
    });
});
