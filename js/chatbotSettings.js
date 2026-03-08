jQuery(document).ready(function ($) {
    // Initialize WordPress color pickers
    $('.chatbot-color-picker').wpColorPicker({
        change: function () {
            setTimeout(function () { updatePreview(); }, 50);
        },
        clear: function () {
            setTimeout(function () { updatePreview(); }, 50);
        }
    });

    // Live preview on name change
    $('#chatbot_name').on('input', function () {
        updatePreview();
    });

    function updatePreview() {
        var name      = $('#chatbot_name').val() || 'Chatbot';
        var themeColor = $('#chatbot_theme_color').val() || '#d2232a';
        var textColor  = $('#chatbot_text_color').val() || '#ffffff';

        $('#preview-bot-name').text(name);
        $('#preview-header').css({ 'background-color': themeColor, 'color': textColor });
        $('#preview-bot-msg').css({ 'background-color': themeColor, 'color': textColor });
    }

    // Save settings via AJAX
    $('#chatbot-save-settings').on('click', function () {
        var $btn = $(this);
        var $status = $('#chatbot-save-status');

        $btn.prop('disabled', true).text('Saving...');
        $status.text('');

        $.ajax({
            url: chatbotSettingsAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'chatbot_save_settings',
                nonce: chatbotSettingsAjax.nonce,
                chatbot_name: $('#chatbot_name').val(),
                chatbot_theme_color: $('#chatbot_theme_color').val(),
                chatbot_text_color: $('#chatbot_text_color').val()
            },
            success: function (response) {
                if (response.success) {
                    $status.html('<span class="save-success">✓ Settings saved!</span>');
                } else {
                    $status.html('<span class="save-error">✗ ' + response.data + '</span>');
                }
                $btn.prop('disabled', false).html('<span class="dashicons dashicons-yes" style="margin-top: 4px;"></span> Save Settings');
                setTimeout(function () { $status.fadeOut(500, function () { $(this).text('').show(); }); }, 3000);
            },
            error: function () {
                $status.html('<span class="save-error">✗ Error saving settings.</span>');
                $btn.prop('disabled', false).html('<span class="dashicons dashicons-yes" style="margin-top: 4px;"></span> Save Settings');
            }
        });
    });
});
