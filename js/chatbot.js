jQuery(document).ready(function ($) {
    const chatbot = $('#codeness-chatbot');
    const toggleButton = $('#codeness-chatbot-toggle');
    const closeButton = $('#codeness-chatbot-close');
    const inputField = $('#codeness-chatbot-input');
    const sendButton = $('#codeness-chatbot-send');
    const messagesContainer = $('#codeness-chatbot-messages');
    const modal = $('#form-modal');
    const closeModalButton = $('#close-modal');

    // ===== Live Chat State =====
    let isLiveChatMode = false;
    let liveChatSessionId = null;
    let liveChatId = null;
    let lastMessageId = 0;

    // Generate a unique session ID for this visitor (persisted via sessionStorage)
    function getSessionId() {
        let sid = sessionStorage.getItem('chatbot_livechat_session_id');
        if (!sid) {
            sid = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('chatbot_livechat_session_id', sid);
        }
        return sid;
    }

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
        hideChatbot();
        // If in live chat mode, optionally close the chat
        if (isLiveChatMode && liveChatId) {
            closeLiveChat();
        }
    });

    inputField.on('click', function (event) {
        event.stopPropagation();
    });

    // ===== Live Chat Mode UI Updates =====
    function enterLiveChatMode(silent) {
        isLiveChatMode = true;
        liveChatSessionId = getSessionId();

        // Update header to show live chat indicator
        $('#codeness-chatbot-header span:first-of-type').text('Live Chat');
        chatbot.addClass('livechat-active');

        // Disable mic/TTS completely
        disableTTS();

        // Show a system message (only if not resuming from history)
        if (!silent) {
            appendSystemMessage('You are now connected to a live agent. Please wait for a response.');
        }

        // Start WebSocket listener for agent messages
        startWebSocket();
    }

    function exitLiveChatMode() {
        isLiveChatMode = false;
        liveChatId = null;
        lastMessageId = 0;

        // Restore header
        const chatbotName = chatbot.find('#codeness-chatbot-header span:first-of-type');
        // We can't easily get the original name, so we leave it or restore from a data attribute
        chatbot.removeClass('livechat-active');

        // Re-enable mic/TTS
        enableTTS();

        // Stop WebSocket listener
        stopWebSocket();
    }

    function disableTTS() {
        const micBtn = $('#codeness-chatbot-mic');
        const langSel = $('#language-select');

        // Stop any active recognition
        if (isRecording && recognition) {
            recognition.stop();
            isRecording = false;
            micBtn.css('color', '');
            micBtn.removeClass('pulse-animation');
        }

        micBtn.prop('disabled', true).addClass('tts-disabled').attr('title', 'Mic disabled during live chat');
        langSel.prop('disabled', true).addClass('tts-disabled');
    }

    function enableTTS() {
        const micBtn = $('#codeness-chatbot-mic');
        const langSel = $('#language-select');

        micBtn.prop('disabled', false).removeClass('tts-disabled').attr('title', '');
        langSel.prop('disabled', false).removeClass('tts-disabled');
    }

    function appendSystemMessage(text) {
        messagesContainer.append(`
            <div class="chatbot-message system-message">
                <div class="message-content"><em>${text}</em></div>
            </div>
        `);
        scrollToBottom();
    }

    function appendAgentMessage(text) {
        messagesContainer.append(`
            <div class="chatbot-message bot-message agent-message">
                <div class="message-header">Agent</div>
                <div class="message-content">${text}</div>
            </div>
        `);
        scrollToBottom();
    }

    // ===== WebSocket (Pusher/Reverb) for Live Chat Messages =====
    let pusherInstance = null;
    let liveChatChannel = null;

    function startWebSocket() {
        if (!liveChatId) return;

        // Initialize Pusher if not already initialized
        if (!pusherInstance) {
            pusherInstance = new Pusher('vxndobokdf3gjybrbjuj', {
                cluster: 'mt1',
                wsHost: chatbotAjax.livechat_ws_host,
                wsPort: 8089,
                wssPort: 8089,
                forceTLS: false,
                enabledTransports: ['ws', 'wss'],
            });

            pusherInstance.connection.bind('connected', () => {
                console.log('[LiveChat] WebSocket connected');
            });

            pusherInstance.connection.bind('error', (err) => {
                console.error('[LiveChat] WebSocket error:', err);
            });
        }

        // Subscribe to chat channel
        liveChatChannel = pusherInstance.subscribe(`livechat.${liveChatId}`);

        liveChatChannel.bind('ChatMessageSent', (e) => {
            console.log('[LiveChat] New Message:', e);
            if (e.sender_type === 'agent' || e.sender_type === 'system') {
                if (e.message === '[[CHAT_RESOLVED]]') {
                    appendSystemMessage('The chat has been closed by the agent.');
                    exitLiveChatMode();
                } else {
                    // Avoid duplicates if same ID is ever emitted twice
                    if (!e.id || e.id > lastMessageId) {
                        appendAgentMessage(e.message || e.content || '');
                        if (e.id) lastMessageId = e.id;
                    }
                }
            }
        });

        liveChatChannel.bind('TypingIndicator', (e) => {
            if (e.sender_type === 'agent') {
                console.log('[LiveChat] Agent is typing...');
            }
        });
    }

    function stopWebSocket() {
        if (pusherInstance && liveChatId) {
            pusherInstance.unsubscribe(`livechat.${liveChatId}`);
            liveChatChannel = null;
        }
    }

    // ===== Send via Live Chat =====
    function sendLiveChatMessage(message) {
        // Show user message
        messagesContainer.append(`
            <div class="chatbot-message user-message">
                <div class="message-header">You</div>
                <div class="message-content">${message}</div>
            </div>
        `);
        inputField.val('');
        scrollToBottom();

        // Send typing indicator first
        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'livechat_typing',
                session_id: liveChatSessionId
            }
        });

        // Send the actual message
        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'livechat_send_message',
                session_id: liveChatSessionId,
                message: message
            },
            success: function (response) {
                console.log('[LiveChat DEBUG] Raw response:', response);
                try {
                    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                    // console.log('[LiveChat DEBUG] Parsed response:', parsed);
                    // if (parsed._debug) {
                    //     console.log('[LiveChat DEBUG] Request URL:', parsed._debug.url);
                    //     console.log('[LiveChat DEBUG] HTTP Code:', parsed._debug.http_code);
                    //     console.log('[LiveChat DEBUG] Post Data:', parsed._debug.post_data);
                    //     console.log('[LiveChat DEBUG] API Raw Response:', parsed._debug.raw_response);
                    // }
                    if (parsed.success && parsed.data) {
                        // Store chat_id if returned
                        if (parsed.data.chat_id) {
                            liveChatId = parsed.data.chat_id;
                        }
                        if (parsed.data.message_id && parsed.data.message_id > lastMessageId) {
                            lastMessageId = parsed.data.message_id;
                        }
                    } else if (parsed.error) {
                        appendSystemMessage('Error: ' + parsed.error);
                    }
                } catch (e) {
                    console.error('[LiveChat DEBUG] Parse error:', e, 'Raw:', response);
                }
            },
            error: function (xhr, status, error) {
                console.error('[LiveChat DEBUG] AJAX error:', status, error, xhr.responseText);
                appendSystemMessage('Failed to send message. Please try again.');
            }
        });
    }

    // ===== Close Live Chat =====
    function closeLiveChat() {
        if (!liveChatId) return;

        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'livechat_close',
                chat_id: liveChatId
            },
            success: function () {
                exitLiveChatMode();
            }
        });
    }

    // ===== Main Send Message (AI or Live Chat) =====
    function sendMessage() {
        var question = inputField.val();

        if (question.trim() === '') return;

        // If in live chat mode, route to live chat
        if (isLiveChatMode) {
            sendLiveChatMessage(question);
            return;
        }

        // Otherwise, use the AI chatbot
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

                    // Handle error responses from the backend
                    if (parsedResponse.error) {
                        $('#codeness-chatbot-loading').remove();
                        $('#codeness-chatbot-messages').append(`
                            <div class="chatbot-message error-message">${parsedResponse.error}</div>
                        `);
                        scrollToBottom();
                        return;
                    }

                    const messageText = parsedResponse.response.response;
                    const prompt_message = parsedResponse.response.prompt_message;

                    // ===== Check for x-key handoff =====
                    const xKey = parsedResponse.response['x-key'];
                    // const shouldHandoff = (xKey === true || xKey === 'true');
                    const shouldHandoff = true;

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

                    // If x-key is true AND live chat is enabled in settings, switch to live chat
                    if (shouldHandoff) {
                        enterLiveChatMode();
                    }

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

    // ===== Typing indicator for live chat (debounced) =====
    let typingTimeout = null;
    inputField.on('input', function () {
        if (isLiveChatMode && liveChatSessionId) {
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(function () {
                $.ajax({
                    url: chatbotAjax.ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'livechat_typing',
                        session_id: liveChatSessionId
                    }
                });
            }, 500);
        }
    });

    // ===== Speech Recognition / TTS =====
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

            // Block mic if in live chat mode
            if (isLiveChatMode) {
                return;
            }

            if (!isRecording) {
                recognition.start();
                micButton.css('color', 'red');
                isRecording = true;
            } else {
                recognition.stop();
                micButton.css('color', '');
                isRecording = false;
            }
        });

        recognition.onstart = function () {
            // Speech recognition started
        };

        recognition.onaudiostart = function () {
            micButton.addClass('pulse-animation');
        };

        recognition.onaudioend = function () {
            micButton.removeClass('pulse-animation');
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            inputField.val(inputField.val() + transcript);
        };

        recognition.onerror = function (event) {
            micButton.css('color', '');
            micButton.removeClass('pulse-animation');
            isRecording = false;
        };

        recognition.onend = function () {
            micButton.css('color', '');
            isRecording = false;
        };
    }

    $("#codeness-chatbot-maximize").on("click", function () {
        $("#codeness-chatbot").toggleClass("fullscreen");
        $("#codeness-chatbot").toggleClass("resizable");
    });

    // ===== Load existing messages on init =====
    function loadExistingMessages() {
        const sessionId = getSessionId();

        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'livechat_get_messages',
                session_id: sessionId
            },
            success: function (response) {
                try {
                    const parsed = typeof response === 'string' ? JSON.parse(response) : response;

                    if (parsed.error) {
                        // "Chat not found" or other error — no existing session, stay in AI mode
                        console.log('[LiveChat] No existing chat found:', parsed.error);
                        return;
                    }

                    if (parsed.success && parsed.messages && parsed.messages.length > 0) {
                        console.log('[LiveChat] Loading', parsed.messages.length, 'existing messages');

                        let chatResolved = false;

                        parsed.messages.forEach(function (msg) {
                            // Track the last message ID for dedup
                            if (msg.id && msg.id > lastMessageId) {
                                lastMessageId = msg.id;
                            }

                            // Store chat ID from the first message
                            if (msg.live_chat_id && !liveChatId) {
                                liveChatId = msg.live_chat_id;
                            }

                            if (msg.sender_type === 'visitor') {
                                messagesContainer.append(`
                                    <div class="chatbot-message user-message">
                                        <div class="message-header">You</div>
                                        <div class="message-content">${msg.message}</div>
                                    </div>
                                `);
                            } else if (msg.sender_type === 'agent') {
                                appendAgentMessage(msg.message);
                            } else if (msg.sender_type === 'system') {
                                if (msg.message === '[[CHAT_RESOLVED]]') {
                                    chatResolved = true;
                                } else {
                                    appendSystemMessage(msg.message);
                                }
                            }
                        });

                        scrollToBottom();

                        // If the last system message was CHAT_RESOLVED, don't enter live chat
                        if (chatResolved) {
                            appendSystemMessage('Your previous chat was resolved.');
                            console.log('[LiveChat] Chat was resolved, staying in AI mode');
                            return;
                        }

                        // Enter live chat mode silently (no "connected" message)
                        enterLiveChatMode(true);
                    }
                } catch (e) {
                    console.error('[LiveChat] Error parsing get-messages response:', e);
                }
            },
            error: function (xhr, status, error) {
                console.error('[LiveChat] Error loading messages:', status, error);
            }
        });
    }

    // Check for existing messages when the page loads
    loadExistingMessages();

});
