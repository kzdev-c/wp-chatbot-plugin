jQuery(document).ready(function ($) {

    const saveBtn = $('#submit-btn');
    const tokenInput = $('#token');
    const usernameInput = $('#username');
    const preferredModuleSelect = $('#preferred-module');
    const checkFilesBtn = $('#check-files-btn');

    function checkInputs() {
        if (usernameInput.val().trim() !== '' && tokenInput.val().trim() !== '') {
            saveBtn.prop('disabled', false);
        } else {
            saveBtn.prop('disabled', true);
        }
    }

    const checkFilesContainer = $('#check-files-container');

    function toggleCheckFilesButton() {
        console.log('Toggle function called');
        if (preferredModuleSelect.val() === 'file_upload') {
            checkFilesContainer.show();
        } else {
            checkFilesContainer.hide();
        }
    }

    preferredModuleSelect.on('change', toggleCheckFilesButton);

    // Run once on page load in case of pre-selected value
    toggleCheckFilesButton();

    usernameInput.on('input', checkInputs);
    tokenInput.on('input', checkInputs);

    checkInputs();

    saveBtn.on('click', function (e) {
        e.preventDefault();

        var username = usernameInput.val()
        var token = tokenInput.val();

        $('#chatbot-response').html('<p>Loading...</p>');

        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'check_token',
                token: token,
                username: username
            },
            success: function (response) {
                // Show the server response
                $('#chatbot-response').html('<p>' + response + '</p>');
                setTimeout(function () {
                    $('#chatbot-response').hide(1000);
                }, 4000);
            },
            error: function () {
                // Show error message if AJAX fails
                $('#chatbot-response').html('<p>There was an error processing your request.</p>');
                setTimeout(function () {
                    $('#chatbot-response').hide(1000);
                }, 4000);
            }
        });
    });


    $('#preferred-module-form').on('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Get the selected value
        var selectedModule = $('#preferred-module').val();
        var chatbot_name = $('#chatbot_name').val();

        // Send AJAX request
        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_settings',
                preferred_module: selectedModule,
                chatbot_name: chatbot_name
            },
            success: function (response) {
                $('#module-response').html('<div class=" alert-success">' + response + '</div>');
                setTimeout(function () {
                    $('#module-response').hide(1000);
                }, 4000);
            },
            error: function (error) {
                $('#module-response').html('<div class=" alert-danger">Error saving module.</div>');
                setTimeout(function () {
                    $('#module-response').hide(1000);
                }, 4000);
            }
        });
    });

    checkFilesBtn.on('click', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Send AJAX request
        $.ajax({
            url: checkFilesAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_check_files',
            },
            success: function (response) {
                $('#module-response').html('<div class=" alert-success">' + response + '</div>');
                setTimeout(function () {
                    $('#module-response').hide(1000);
                }, 4000);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Check files AJAX error', textStatus, errorThrown, jqXHR.responseText);
                var message = 'Error checking files (' + textStatus + ')';
                if (jqXHR.responseText) {
                    message += ': ' + jqXHR.responseText;
                }
                $('#module-response').html('<div class=" alert-danger">' + message + '</div>');
                setTimeout(function () {
                    $('#module-response').hide(1000);
                }, 4000);
            }
        });
    });

    $('#livechat-section-form').on('submit', function (event) {
        event.preventDefault();

        var dashboard_url = $('#chatbot_dashboard_url').val();
        var secret_key = $('#livechat_secret_key').val();
        var ai_chat_enabled = $('#ai_chat_enabled').is(':checked') ? '1' : '0';

        $.ajax({
            url: checkCredentialsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_livechat_settings_save',
                chatbot_dashboard_url: dashboard_url,
                livechat_secret_key: secret_key,
                ai_chat_enabled: ai_chat_enabled
            },
            success: function (response) {
                $('#livechat-section-response').html('<div class=" alert-success">Live chat settings saved successfully.</div>');
                setTimeout(function () {
                    $('#livechat-section-response').hide(1000);
                }, 4000);
            },
            error: function (error) {
                $('#livechat-section-response').html('<div class=" alert-danger">Error saving live chat settings.</div>');
                setTimeout(function () {
                    $('#livechat-section-response').hide(1000);
                }, 4000);
            }
        });
    });

});
