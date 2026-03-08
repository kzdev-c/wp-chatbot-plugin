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

        // Call TTS through WordPress AJAX proxy (avoids CORS)
        var formData = new FormData();
        formData.append('action', 'chatbot_tts');
        formData.append('text', text);
        formData.append('voice', 'en-US-JennyNeural');

        fetch(chatbotAjax.ajaxurl, {
            method: 'POST',
            body: formData
        })
        .then(function (response) {
            var contentType = response.headers.get('content-type') || '';

            // If the response is JSON, it's an error from our proxy
            if (contentType.indexOf('application/json') !== -1) {
                return response.json().then(function (json) {
                    console.error('TTS proxy error:', json);
                    throw new Error(json.data || 'TTS proxy error');
                });
            }

            // If not audio, something went wrong
            if (contentType.indexOf('audio') === -1) {
                return response.text().then(function (text) {
                    console.error('TTS unexpected response:', text.substring(0, 300));
                    throw new Error('TTS returned non-audio response');
                });
            }

            // Get as arrayBuffer so we can create blob with explicit MIME type
            return response.arrayBuffer();
        })
        .then(function (buffer) {
            if (!buffer) return; // error was thrown above

            var blob = new Blob([buffer], { type: 'audio/mpeg' });
            var audioUrl = URL.createObjectURL(blob);
            var audio = new Audio();

            // Store audio reference on the button
            $btn.data('audio', audio);
            currentAudio = audio;
            currentSpeakerBtn = $btn;

            audio.oncanplaythrough = function () {
                // Switch to pause icon once audio is ready
                $btn.find('i').removeClass('fa-spinner fa-spin fa-volume-up').addClass('fa-pause');
            };

            audio.onended = function () {
                $btn.find('i').removeClass('fa-pause').addClass('fa-volume-up');
                currentAudio = null;
                currentSpeakerBtn = null;
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = function () {
                console.error('Audio playback error');
                $btn.find('i').removeClass('fa-pause fa-spinner fa-spin').addClass('fa-volume-up');
                currentAudio = null;
                currentSpeakerBtn = null;
                URL.revokeObjectURL(audioUrl);
            };

            audio.src = audioUrl;
            audio.play().catch(function (err) {
                console.error('Audio play() failed:', err);
                $btn.find('i').removeClass('fa-spinner fa-spin').addClass('fa-volume-up');
            });
        })
        .catch(function (error) {
            console.error('TTS fetch error:', error);
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

                        // Append bot message
                        var $botMsg = $(`
                            <div class="chatbot-message bot-message">
                                <div class="message-header">Bot</div>
                                <div class="message-content">${messageText}</div>
                            </div>
                        `);
                        $('#codeness-chatbot-messages').append($botMsg);
                        scrollToBottom();
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
