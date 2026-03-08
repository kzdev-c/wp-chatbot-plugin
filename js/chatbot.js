jQuery(document).ready(function ($) {
    const chatbot = $('#codeness-chatbot');
    const toggleButton = $('#codeness-chatbot-toggle');
    const closeButton = $('#codeness-chatbot-close');
    const inputField = $('#codeness-chatbot-input');
    const sendButton = $('#codeness-chatbot-send');
    const messagesContainer = $('#codeness-chatbot-messages');

    function scrollToBottom() {
        messagesContainer.stop().animate({
            scrollTop: messagesContainer[0].scrollHeight
        }, 300);
    }

    function showChatbot() {
        chatbot.removeClass('collapsed').css({
            'opacity': '1',
            'transform': 'translateY(0) scale(1)',
            'transition': 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
        });
    }

    function hideChatbot() {
        chatbot.css({
            'opacity': '0',
            'transform': 'translate(50px, 70px) scale(0.1)',
            'transition': 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
        });

        setTimeout(() => {
            chatbot.addClass('collapsed');
        }, 300);
    }

    toggleButton.on('click', function () {
        if (chatbot.hasClass('collapsed')) {
            showChatbot();
        } else {
            hideChatbot();
        }
    });

    closeButton.on('click', hideChatbot);

    inputField.on('click', function (event) {
        event.stopPropagation();
    });

    function sendMessage() {
        var question = inputField.val();

        if (question.trim() === '') return;

        $('#codeness-chatbot-messages').append(`
            <div class="chatbot-message user-message">
                <div class="message-header">You</div>
                <div class="message-content">${question}</div>
            </div>
        `);
        inputField.val('');
        scrollToBottom();

        $('#codeness-chatbot-messages').append(`
            <div id="codeness-chatbot-loading" class="chatbot-message loading-message">
                <div class="message-content">
                    <div class="loader"></div>
                </div>
            </div>
        `);
        scrollToBottom();

        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'ask_question',
                question: question
            },
            success: function (response) {
                try {
                    const parsedResponse = JSON.parse(response);

                    $('#codeness-chatbot-loading').remove();

                    if (parsedResponse.error) {
                        $('#codeness-chatbot-messages').append(`
                            <div class="chatbot-message error-message">
                                <div class="message-content">${parsedResponse.error}</div>
                            </div>
                        `);
                    } else {
                        const messageText = parsedResponse.response.response;
                        $('#codeness-chatbot-messages').append(`
                            <div class="chatbot-message bot-message">
                                <div class="message-header">Bot</div>
                                <div class="message-content">${messageText}</div>
                            </div>
                        `);
                    }
                    scrollToBottom();
                } catch (error) {
                    $('#codeness-chatbot-loading').remove();
                    $('#codeness-chatbot-messages').append('<div class="chatbot-message error-message">Error communicating with the chatbot.</div>');
                    scrollToBottom();
                }
            },
            error: function () {
                $('#codeness-chatbot-loading').remove();
                $('#codeness-chatbot-messages').append('<div class="chatbot-message error-message">Error communicating with the chatbot.</div>');
                scrollToBottom();
            }
        });
    }

    sendButton.on('click', sendMessage);

    inputField.on('keypress', function (event) {
        if (event.which === 13) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Speech recognition (microphone)
    const micButton = $('#codeness-chatbot-mic');
    let isRecording = false;
    let recognition;

    const langSelect = $('#language-select');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micButton.prop('disabled', true).attr('title', 'Speech recognition not supported in this browser.');
    } else {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = langSelect.val() || 'en-US';

        langSelect.on('change', function () {
            recognition.lang = $(this).val();
        });

        micButton.on('click', function (e) {
            e.preventDefault();

            if (!isRecording) {
                try {
                    recognition.start();
                } catch (err) {
                    // Already started, ignore
                }
                micButton.css('color', 'red');
                isRecording = true;
            } else {
                recognition.stop();
                micButton.css('color', '');
                isRecording = false;
            }
        });

        recognition.onstart = function () {
            isRecording = true;
            micButton.css('color', 'red');
        };

        recognition.onaudiostart = function () {
            micButton.addClass('pulse-animation');
        };

        recognition.onaudioend = function () {
            micButton.removeClass('pulse-animation');
        };

        recognition.onresult = function (event) {
            var transcript = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            inputField.val(inputField.val() + transcript);
        };

        recognition.onerror = function (event) {
            micButton.css('color', '');
            micButton.removeClass('pulse-animation');
            isRecording = false;
        };

        recognition.onend = function () {
            micButton.removeClass('pulse-animation');
            // If user hasn't explicitly stopped, restart recognition (continuous mode)
            if (isRecording) {
                try {
                    recognition.start();
                } catch (err) {
                    micButton.css('color', '');
                    isRecording = false;
                }
            } else {
                micButton.css('color', '');
            }
        };
    }
});
