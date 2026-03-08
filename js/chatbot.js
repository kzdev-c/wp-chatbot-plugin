jQuery(document).ready(function ($) {
    const chatbot = $('#codeness-chatbot');
    const toggleButton = $('#codeness-chatbot-toggle');
    const closeButton = $('#codeness-chatbot-close');
    const inputField = $('#codeness-chatbot-input');
    const sendButton = $('#codeness-chatbot-send');
    const messagesContainer = $('#codeness-chatbot-messages');
    const modal = $('#form-modal');
    const closeModalButton = $('#close-modal');

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
                    const messageText = parsedResponse.response.response;
                    const prompt_message = parsedResponse.response.prompt_message;

                    $('#codeness-chatbot-loading').remove();
                    if (prompt_message) {
                        $('#codeness-chatbot-messages').append(`
                            <div class="chatbot-message bot-message prompt-message">
                                <div class="message-header">Prompt</div>
                                <div class="message-content">${messageText}</div>
                            </div>
                            <div class="chatbot-message bot-message prompt-message">
                                <div class="message-header">Prompt</div>
                                <div class="message-content">${prompt_message}</div>
                                <div class="prompt-buttons">
                                    <button class="yes-no-buttons" id="yes-button">Click here to contact us</button>
                                </div>
                            </div>
                        `);
                    } else {
                        $('#codeness-chatbot-messages').append(`
                        <div class="chatbot-message bot-message">
                            <div class="message-header">Bot</div>
                            <div class="message-content">${messageText}</div>
                        </div>
                    `);
                    }
                    scrollToBottom();
                } catch (error) {
                    // console.error("Error parsing the response:", error);
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

    messagesContainer.on('click', '#yes-button', function () {
        modal.show();
    });

    messagesContainer.on('click', '#no-button', function () {
        // console.log('No button clicked');
    });

    closeModalButton.on('click', function () {
        modal.hide();
    });

    $('#contact-form').on('submit', function (event) {
        event.preventDefault();

        const formData = {
            name: $('#name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            interest: $('#interest').val(),
        };

        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                interest: formData.interest,
                action: 'submit_visitor_info'
            },
            success: function (response) {
                $('#info-response').html('<div class=" alert-success color-green">' + response + '</div>');
                setTimeout(function () {
                    $('#info-response').hide(1000);
                }, 4000);
            },
            error: function () {
                $('#info-response').html('<div class=" alert-danger color-red">Error submitting form.</div>');
                setTimeout(function () {
                    $('#info-response').hide(1000);
                }, 4000);
            }
        });
    });

    sendButton.on('click', sendMessage);

    inputField.on('keypress', function (event) {
        if (event.which === 13) {
            event.preventDefault();
            sendMessage();
        }
    });


    const micButton = $('#codeness-chatbot-mic');
    let isRecording = false;
    let recognition;

    const langSelect = $('#language-select');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micButton.prop('disabled', true).attr('title', 'Speech recognition not supported in this browser.');
        // console.warn('Speech recognition is not supported in this browser.');
    } else {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true; 
        recognition.interimResults = false;
        recognition.lang = langSelect.val() || 'en-US';

        langSelect.on('change', function () {
            recognition.lang = $(this).val();
            // console.log('Language changed to:', recognition.lang);
        });

        micButton.on('click', function (e) {
            e.preventDefault();

            if (!isRecording) {
                recognition.start();
                micButton.css('color', 'red');
                isRecording = true;
                // console.log('Mic button clicked, starting recognition...');
            } else {
                recognition.stop();
                micButton.css('color', '');
                isRecording = false;
                // console.log('Mic button clicked, stopping recognition...');
            }
        });

        recognition.onstart = function () {
            // console.log('Speech recognition started...');
        };

        recognition.onaudiostart = function () {
            // console.log('Audio detected, starting animation...');
            micButton.addClass('pulse-animation');
        };

        recognition.onaudioend = function () {
            // console.log('Audio stopped, ending animation...');
            micButton.removeClass('pulse-animation');
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            // console.log('Transcript received:', transcript);
            inputField.val(inputField.val() + transcript);
        };

        recognition.onerror = function (event) {
            // console.error('Speech recognition error:', event.error);
            micButton.css('color', '');
            micButton.removeClass('pulse-animation');
            isRecording = false;
        };

        recognition.onend = function () {
            // console.log('Speech recognition ended.');
            micButton.css('color', '');
            isRecording = false;
        };
    }

    $("#codeness-chatbot-maximize").on("click", function () {
        $("#codeness-chatbot").toggleClass("fullscreen");
        $("#codeness-chatbot").toggleClass("resizable");
    });

});
