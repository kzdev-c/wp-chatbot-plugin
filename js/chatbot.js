jQuery(document).ready(function ($) {
    const chatbot = $('#codeness-chatbot');
    const toggleButton = $('#codeness-chatbot-toggle');
    const closeButton = $('#codeness-chatbot-close');
    const inputField = $('#codeness-chatbot-input');
    const sendButton = $('#codeness-chatbot-send');
    const messagesContainer = $('#codeness-chatbot-messages');

    // TTS state
    var currentAudio = null;
    var currentSpeakerBtn = null;

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

    closeButton.on('click', function () {
        // Stop any playing audio when closing chatbot
        stopCurrentAudio();
        hideChatbot();
    });

    inputField.on('click', function (event) {
        event.stopPropagation();
    });

    // ──────────────────────────────────────
    // TTS Functions
    // ──────────────────────────────────────

    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        if (currentSpeakerBtn) {
            currentSpeakerBtn.find('i').removeClass('fa-pause fa-spinner fa-spin').addClass('fa-volume-up');
            currentSpeakerBtn = null;
        }
    }

    function fetchAndPlayTTS(text, $btn) {
        // Stop any currently playing audio
        stopCurrentAudio();

        // Show loading spinner
        $btn.find('i').removeClass('fa-volume-up fa-pause').addClass('fa-spinner fa-spin');
        currentSpeakerBtn = $btn;

        fetch(chatbotAjax.ttsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, voice: 'en-US-JennyNeural' })
        })
        .then(function (response) {
            if (!response.ok) throw new Error('TTS request failed');
            return response.blob();
        })
        .then(function (blob) {
            var audioUrl = URL.createObjectURL(blob);
            var audio = new Audio(audioUrl);

            // Store audio reference on the button
            $btn.data('audio', audio);
            currentAudio = audio;
            currentSpeakerBtn = $btn;

            // Switch to pause icon
            $btn.find('i').removeClass('fa-spinner fa-spin fa-volume-up').addClass('fa-pause');

            audio.onended = function () {
                $btn.find('i').removeClass('fa-pause').addClass('fa-volume-up');
                currentAudio = null;
                currentSpeakerBtn = null;
            };

            audio.onerror = function () {
                $btn.find('i').removeClass('fa-pause fa-spinner fa-spin').addClass('fa-volume-up');
                currentAudio = null;
                currentSpeakerBtn = null;
            };

            audio.play();
        })
        .catch(function (error) {
            $btn.find('i').removeClass('fa-spinner fa-spin').addClass('fa-volume-up');
            currentSpeakerBtn = null;
        });
    }

    // Delegate click on speaker buttons
    messagesContainer.on('click', '.speaker-btn', function (e) {
        e.stopPropagation();
        var $btn = $(this);
        var text = $btn.closest('.bot-message').find('.message-content').text();
        var audio = $btn.data('audio');

        // If a DIFFERENT message's audio is playing, stop it first
        if (currentAudio && currentSpeakerBtn && currentSpeakerBtn[0] !== $btn[0]) {
            stopCurrentAudio();
        }

        if (audio && !audio.paused) {
            // Currently playing → pause
            audio.pause();
            $btn.find('i').removeClass('fa-pause').addClass('fa-volume-up');
            currentAudio = audio;
            currentSpeakerBtn = $btn;
        } else if (audio && audio.paused && audio.currentTime > 0 && audio.currentTime < audio.duration) {
            // Paused mid-way → resume
            audio.play();
            $btn.find('i').removeClass('fa-volume-up').addClass('fa-pause');
            currentAudio = audio;
            currentSpeakerBtn = $btn;
        } else {
            // No audio yet, or audio ended → fetch and play
            fetchAndPlayTTS(text, $btn);
        }
    });

    // ──────────────────────────────────────
    // Send Message
    // ──────────────────────────────────────

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

                        // Append bot message with speaker button
                        var $botMsg = $(`
                            <div class="chatbot-message bot-message">
                                <div class="message-header">
                                    Bot
                                    <button class="speaker-btn" title="Play / Pause audio">
                                        <i class="fas fa-volume-up"></i>
                                    </button>
                                </div>
                                <div class="message-content">${messageText}</div>
                            </div>
                        `);
                        $('#codeness-chatbot-messages').append($botMsg);
                        scrollToBottom();

                        // Auto-play TTS for the response
                        var $speakerBtn = $botMsg.find('.speaker-btn');
                        fetchAndPlayTTS(messageText, $speakerBtn);
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

    // ──────────────────────────────────────
    // Speech Recognition (microphone)
    // ──────────────────────────────────────

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
