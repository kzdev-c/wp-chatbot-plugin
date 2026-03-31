jQuery(document).ready(function ($) {
    const chatbot = $('#codeness-chatbot');
    const toggleButton = $('#codeness-chatbot-toggle');
    const closeButton = $('#codeness-chatbot-close');
    const inputField = $('#codeness-chatbot-input');
    const sendButton = $('#codeness-chatbot-send');
    const messagesContainer = $('#codeness-chatbot-messages');
    const modal = $('#form-modal');
    const closeModalButton = $('#close-modal');
    const endChatButton = $('#codeness-chatbot-end-chat');
    const closeChatDialog = $('#close-chat-dialog');

    // ===== Live Chat State =====
    let isLiveChatMode = false;
    let liveChatSessionId = null;
    let liveChatId = null;
    let lastMessageId = 0;
    let agentId = null;

    let typingThrottleTime = 0;
    let notTypingTimeout = null;
    let unreadCount = parseInt(sessionStorage.getItem('cb_unread_count') || '0', 10);
    let isHistoryLoading = false;

    function playNotificationSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(context.destination);

            osc.start();
            osc.stop(context.currentTime + 0.1);
        } catch (e) {
            chat_clog('Audio notification failed:', e);
        }
    }

    function updateCounter() {
        const counterEl = $('#codeness-chatbot-counter');
        if (unreadCount > 0) {
            counterEl.text(unreadCount).show();
        } else {
            counterEl.hide().text('0');
        }
        sessionStorage.setItem('cb_unread_count', unreadCount);
    }

    // Initialize counter UI
    // Need to wait until toggle counter element exists if we refer to it.
    // Since this is inside .ready(), it's fine.
    updateCounter();

    // Generate a unique session ID for this visitor (persisted via sessionStorage)
    function getSessionId() {
        let sid = getCookie('cb_user_session');
        if (sid) return sid;

        sid = sessionStorage.getItem('chatbot_livechat_session_id');
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
        // Reset counter when opened
        unreadCount = 0;
        updateCounter();
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

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function initUserTracking() {
        if (!getCookie('cb_user_agent')) {
            let deviceStr = navigator.userAgent;
            if (navigator.userAgentData) {
                let brands = navigator.userAgentData.brands ? navigator.userAgentData.brands.map(b => b.brand).join(', ') : '';
                let platform = navigator.userAgentData.platform || '';
                if (brands || platform) {
                    deviceStr = (platform ? platform + " - " : "") + brands;
                }
            }
            setCookie('cb_user_agent', deviceStr || 'not provided', 365);
        }

        if (!getCookie('cb_user_session')) {
            setCookie('cb_user_session', getSessionId(), 365);
        }

        if (!getCookie('cb_user_location')) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const fallbackLoc = lat + "," + lon;

                    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
                        .then(response => response.json())
                        .then(data => {
                            if (data && data.city) {
                                let locName = data.city;
                                if (data.countryName) locName += ", " + data.countryName;
                                setCookie('cb_user_location', locName, 365);
                            } else if (data && data.locality) {
                                let locName = data.locality;
                                if (data.countryName) locName += ", " + data.countryName;
                                setCookie('cb_user_location', locName, 365);
                            } else {
                                setCookie('cb_user_location', fallbackLoc, 365);
                            }
                        })
                        .catch(() => {
                            setCookie('cb_user_location', fallbackLoc, 365);
                        });
                }, function (error) {
                    setCookie('cb_user_location', 'not provided', 365);
                });
            } else {
                setCookie('cb_user_location', 'not provided', 365);
            }
        }
    }

    toggleButton.on('click', function () {
        initUserTracking();
        if (chatbot.hasClass('collapsed')) {
            showChatbot();
        } else {
            hideChatbot();
        }
    });

    closeButton.on('click', function () {
        hideChatbot();
    });

    inputField.on('click', function (event) {
        event.stopPropagation();
    });

    // Auto-resize input field based on content
    inputField.on('input', function () {
        this.style.height = '40px';
        this.style.height = (this.scrollHeight) + 'px';
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
            appendSystemMessage("You're now chatting with a live agent. Let us know how we can help!");
            
            let conversations = [];
            $('#codeness-chatbot-messages .chatbot-message').each(function() {
                // Skip system and loading messages, or prompt buttons
                if ($(this).hasClass('system-message') || $(this).hasClass('loading-message') || $(this).find('.prompt-buttons').length > 0) {
                    return;
                }
                
                // Agent messages shouldn't be here since it's a new session, but just in case
                if ($(this).hasClass('agent-message')) {
                    return;
                }

                let text = $(this).find('.message-content').text().trim();
                if (!text) return; // skip empty

                let sender = $(this).hasClass('user-message') ? 'visitor' : 'aibot';
                conversations.push({
                    sender: sender,
                    message: text
                });
            });

            if (conversations.length > 0) {
                $.ajax({
                    url: chatbotAjax.ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'livechat_send_ai_history',
                        session_id: liveChatSessionId,
                        conversations: conversations,
                        agent_id: agentId
                    },
                    success: function() {
                        chat_clog('[LiveChat] AI history sent successfully.');
                    },
                    error: function() {
                        chat_clog('[LiveChat] Failed to send AI history.');
                    }
                });
            }
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

    function formatChatMessage(text) {
        if (!text) return '';
        // Strip escaping for single quotes, double quotes, and backslashes
        text = text.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        // Replace newlines with <br>
        text = text.replace(/\n/g, '<br>');
        // Very basic markdown for bold texts
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return text;
    }

    function appendSystemMessage(text) {
        messagesContainer.append(`
            <div class="chatbot-message system-message">
                <div class="message-content"><em>${formatChatMessage(text)}</em></div>
            </div>
        `);
        scrollToBottom();
    }

    function appendAgentMessage(text) {
        messagesContainer.append(`
            <div class="chatbot-message bot-message agent-message">
                <div class="message-header">Agent</div>
                <div class="message-content">${formatChatMessage(text)}</div>
            </div>
        `);
        scrollToBottom();

        if (chatbot.hasClass('collapsed') && !isHistoryLoading) {
            unreadCount++;
            updateCounter();
            playNotificationSound();
        }
    }

    // ===== WebSocket (Pusher/Reverb) for Live Chat Messages =====
    let pusherInstance = null;
    let liveChatChannel = null;

    function startWebSocket() {
        if (!liveChatId) return;

        // Initialize Pusher if not already initialized
        if (!pusherInstance) {
            pusherInstance = new Pusher(chatbotAjax.livechat_secret_key, {
                cluster: 'mt1',
                wsHost: chatbotAjax.livechat_ws_host,
                wsPort: 443,
                wssPort: 443,
                forceTLS: true,
                enabledTransports: ["ws", "wss"],
            });

            pusherInstance.connection.bind('connected', () => {
                chat_clog('[LiveChat] WebSocket connected');
            });

            pusherInstance.connection.bind('error', (err) => {
                console.error('[LiveChat] WebSocket error:', err);
            });
        }
        // Subscribe to chat channel
        liveChatChannel = pusherInstance.subscribe(`livechat.${liveChatId}`);

        liveChatChannel.bind('chat-message-sent', (e) => {
            chat_clog('[LiveChat] New Message:', e);
            hideAgentTyping();

            if (e.sender_type === 'agent' || e.sender_type === 'system') {
                if (e.message === '[[CHAT_RESOLVED]]') {
                    appendSystemMessage('The chat has been closed by the agent.');
                    let closedChatId = liveChatId;
                    exitLiveChatMode();
                    showRatingUI(closedChatId);
                } else {
                    if (!e.id || e.id > lastMessageId) {
                        appendAgentMessage(e.message || e.content || '');
                        if (e.id) lastMessageId = e.id;
                    }
                }
            }
        });

        liveChatChannel.bind('typing-indicator', (e) => {
            if (e.sender_type === 'agent') {
                chat_clog('[LiveChat] Agent is typing...');
                showAgentTyping();
            }
        });

        liveChatChannel.bind('not-typing-indicator', (e) => {
            if (e.sender_type === 'agent') {
                chat_clog('[LiveChat] Agent stopped typing.');
                hideAgentTyping();
            }
        });
    }

    let agentTypingTimeout = null;
    function showAgentTyping() {
        let indicator = $('#agent-typing-indicator');
        if (indicator.length === 0) {
            messagesContainer.append(`
                <div class="chatbot-message bot-message agent-message" id="agent-typing-indicator">
                    <div class="message-header">Agent</div>
                    <div class="message-content typing-indicator-container">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `);
            scrollToBottom();
        } else {
            if (!indicator.is(':visible')) {
                messagesContainer.append(indicator); // Move to bottom since it was hidden
                indicator.show();
                scrollToBottom();
            } else {
                // If already visible but not the last child, push it down
                if (messagesContainer.children().last()[0] !== indicator[0]) {
                    messagesContainer.append(indicator);
                    scrollToBottom();
                }
            }
        }

        if (agentTypingTimeout) clearTimeout(agentTypingTimeout);
        agentTypingTimeout = setTimeout(() => {
            hideAgentTyping();
        }, 3000); // Hide automatically after 3 seconds if no new typing event
    }

    function hideAgentTyping() {
        $('#agent-typing-indicator').hide();
        if (agentTypingTimeout) clearTimeout(agentTypingTimeout);
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
        scrollToBottom();

        // Send not-typing indicator (stops typing when message is sent)
        if (notTypingTimeout) clearTimeout(notTypingTimeout);
        $.ajax({
            url: chatbotAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'livechat_not_typing',
                session_id: liveChatSessionId
            }
        });
        typingThrottleTime = 0;
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
                chat_clog('[LiveChat DEBUG] Raw response:', response);
                try {
                    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                    // chat_clog('[LiveChat DEBUG] Parsed response:', parsed);
                    // if (parsed._debug) {
                    //     chat_clog('[LiveChat DEBUG] Request URL:', parsed._debug.url);
                    //     chat_clog('[LiveChat DEBUG] HTTP Code:', parsed._debug.http_code);
                    //     chat_clog('[LiveChat DEBUG] Post Data:', parsed._debug.post_data);
                    //     chat_clog('[LiveChat DEBUG] API Raw Response:', parsed._debug.raw_response);
                    // }
                    if (parsed.success && parsed.data) {
                        // Store chat_id if returned
                        if (parsed.data.chat_id) {
                            let isNewChatId = !liveChatId;
                            liveChatId = parsed.data.chat_id;

                            // Initialize WebSocket if this is the first time we've received the chat_id
                            if (isNewChatId) {
                                startWebSocket();
                            }
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
                appendSystemMessage('Chat has been closed.');
                let closedChatId = liveChatId;
                exitLiveChatMode();
                showRatingUI(closedChatId);
            },
            error: function () {
                appendSystemMessage('Failed to close chat. Please try again.');
            }
        });
    }

    // ===== End Chat Button + Confirmation Dialog =====
    endChatButton.on('click', function () {
        closeChatDialog.addClass('show');
    });

    $('#close-chat-cancel').on('click', function () {
        closeChatDialog.removeClass('show');
    });

    $('#close-chat-confirm').on('click', function () {
        closeChatDialog.removeClass('show');
        closeLiveChat();
    });

    // Close dialog when clicking overlay background
    closeChatDialog.on('click', function (e) {
        if ($(e.target).hasClass('chat-dialog-overlay')) {
            closeChatDialog.removeClass('show');
        }
    });

    // ===== Rating UI =====
    let currentRating = 0;
    let isRated = false;
    let originalPlaceholder = '';

    function showRatingUI(chatId) {
        if ($('#chat-rating-box').length > 0) return;

        originalPlaceholder = inputField.attr('placeholder') || 'Type your message...';
        inputField.prop('disabled', true).attr('placeholder', 'Please rate the chat to continue...');
        sendButton.prop('disabled', true);

        messagesContainer.append(`
        <div class="chatbot-message system-message chat-rating-container" id="chat-rating-box">
            <svg width="0" height="0" style="position:absolute;">
                <defs>
                    <linearGradient id="cr-half-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="50%" stop-color="#f59e0b"/>
                        <stop offset="50%" stop-color="#e5e7eb"/>
                    </linearGradient>
                </defs>
            </svg>

            <div class="cr-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p class="cr-title">How was your experience?</p>
            <p class="cr-sub">Your feedback helps us improve.</p>

            <div class="cr-stars" id="cr-stars">
                ${[1, 2, 3, 4, 5].map(i => `
                <div class="cr-star-wrap" data-index="${i}">
                    <svg viewBox="0 0 24 24" fill="#e5e7eb" stroke="#e5e7eb" stroke-width="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <div class="cr-half-zone" data-val="${i - 0.5}"></div>
                    <div class="cr-full-zone" data-val="${i}"></div>
                </div>`).join('')}
            </div>

            <div class="cr-pip-row" id="cr-pips">
                ${[1, 2, 3, 4, 5].map(i => `<div class="cr-pip" id="cr-pip-${i}"></div>`).join('')}
            </div>

            <div class="cr-label" id="cr-label">Tap to rate</div>
            <button class="chat-rating-submit" id="chat-rating-submit" data-chat="${chatId}" disabled>Submit Rating</button>

            <div class="cr-success" id="cr-success">
                <div class="cr-success-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p class="cr-success-title">Thanks for rating!</p>
                <p class="cr-success-sub" id="cr-success-detail"></p>
            </div>
        </div>
    `);

        scrollToBottom();

        // ── Star interaction logic ──────────────────────────────
        const LABELS = {
            0.5: 'Terrible', 1: 'Poor', 1.5: 'Below average', 2: 'Fair', 2.5: 'Okay',
            3: 'Good', 3.5: 'Pretty good', 4: 'Great', 4.5: 'Excellent', 5: 'Outstanding'
        };

        let selectedVal = 0;
        let hoverVal = 0;

        function fillStars(val) {
            $('#cr-stars .cr-star-wrap').each(function () {
                const idx = +$(this).data('index');
                const svg = $(this).find('svg');
                if (val >= idx) {
                    svg.attr({ fill: '#f59e0b', stroke: '#d97706' });
                } else if (val >= idx - 0.5) {
                    svg.attr({ fill: 'url(#cr-half-grad)', stroke: '#e5e7eb' });
                } else {
                    svg.attr({ fill: '#e5e7eb', stroke: '#e5e7eb' });
                }
            });
            // pips — light up pip for each full star reached
            for (let i = 1; i <= 5; i++) {
                $('#cr-pip-' + i).toggleClass('on', val >= i - 0.4);
            }
        }

        function setLabel(val, active) {
            const labelEl = $('#cr-label');
            labelEl.text(active && val ? LABELS[val] || '' : (selectedVal ? LABELS[selectedVal] : 'Tap to rate'));
            labelEl.toggleClass('active', active || !!selectedVal);
        }

        // Hover
        $('#cr-stars').on('mouseenter', '[data-val]', function () {
            hoverVal = +$(this).data('val');
            fillStars(hoverVal);
            setLabel(hoverVal, true);
        });

        $('#cr-stars').on('mouseleave', function () {
            hoverVal = 0;
            fillStars(selectedVal);
            setLabel(0, false);
        });

        // Click
        $('#cr-stars').on('click', '[data-val]', function () {
            selectedVal = +$(this).data('val');
            fillStars(selectedVal);
            setLabel(selectedVal, true);
            $('#chat-rating-submit').prop('disabled', false).addClass('ready');
            // Keep chat-rating-value in sync for any external listeners
            $('.chat-rating-value').text(selectedVal.toFixed(1) + ' / 5.0');
        });

        // Submit
        $(document).on('click', '#chat-rating-submit', function () {
            if (!selectedVal) return;
            const chatIdVal = $(this).data('chat');
            const btn = $(this);
            const originalText = btn.text();

            btn.prop('disabled', true).text('Submitting...');
            isRated = true;

            $.ajax({
                url: chatbotAjax.ajaxurl,
                method: 'POST',
                data: {
                    action: 'livechat_rate',
                    chat_id: chatIdVal,
                    rating: selectedVal
                },
                success: function (response) {
                    $('#cr-stars, .cr-pip-row, #cr-label, #chat-rating-submit').hide();
                    $('#cr-success-detail').text('You rated this chat ' + selectedVal + ' out of 5 — ' + LABELS[selectedVal] + '.');
                    $('#cr-success').css('display', 'flex');

                    // Re-enable input
                    inputField.prop('disabled', false).attr('placeholder', originalPlaceholder);
                    sendButton.prop('disabled', false);

                    scrollToBottom();
                },
                error: function () {
                    btn.prop('disabled', false).text(originalText);
                    isRated = false;
                    appendSystemMessage('Failed to submit rating. Please try again.');
                    scrollToBottom();
                }
            });
        });
    }

    // ===== Main Send Message (AI or Live Chat) =====
    function sendMessage() {
        var question = inputField.val();

        if (question.trim() === '') return;

        // Reset input height
        inputField.val('');
        inputField.css('height', '40px');

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

                    // ===== Check for enter_live_chat handoff =====
                    const livechat = parsedResponse?.response?.livechat;
                    const shouldHandoff = String(livechat).toLowerCase() === 'true';

                    $('#codeness-chatbot-loading').remove();

                    if (prompt_message && !shouldHandoff) {
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
                    } else if (!shouldHandoff) {
                        $('#codeness-chatbot-messages').append(`
                        <div class="chatbot-message bot-message">
                            <div class="message-header">Bot</div>
                            <div class="message-content">${messageText}</div>
                        </div>
                    `);
                    }
                    scrollToBottom();

                    // If bot replied while minimized (unlikely during active chat but possible if they minimize fast)
                    if (chatbot.hasClass('collapsed')) {
                        unreadCount++;
                        updateCounter();
                        playNotificationSound();
                    }

                    // If live chat is true AND live chat is enabled in settings, switch to live chat
                    if (shouldHandoff) {
                        if (parsedResponse?.response?.chat_id) {
                            liveChatId = parsedResponse.response.chat_id;
                        }
                        if (parsedResponse?.response?.agent_id) {
                            agentId = parsedResponse.response.agent_id;
                        }
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
        // chat_clog('No button clicked');
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

    // ===== Typing indicator for live chat (throttle + debounce) =====
    inputField.on('input', function () {
        if (!isLiveChatMode || !liveChatSessionId) return;

        // If they cleared the field, immediately stop typing indicator
        if ($(this).val().trim() === '') {
            if (notTypingTimeout) clearTimeout(notTypingTimeout);
            $.ajax({
                url: chatbotAjax.ajaxurl,
                method: 'POST',
                data: { action: 'livechat_not_typing', session_id: liveChatSessionId }
            });
            typingThrottleTime = 0;
            return;
        }

        const now = Date.now();

        // 1. Send /typing, throttled to exactly once per 2000ms
        if (now - typingThrottleTime >= 2000) {
            typingThrottleTime = now;
            $.ajax({
                url: chatbotAjax.ajaxurl,
                method: 'POST',
                data: {
                    action: 'livechat_typing',
                    session_id: liveChatSessionId
                }
            });
        }

        // 2. Debounce /not-typing for 2.5 seconds of TOTAL inactivity
        if (notTypingTimeout) clearTimeout(notTypingTimeout);

        notTypingTimeout = setTimeout(function () {
            $.ajax({
                url: chatbotAjax.ajaxurl,
                method: 'POST',
                data: {
                    action: 'livechat_not_typing',
                    session_id: liveChatSessionId
                }
            });
            typingThrottleTime = 0; // Reset throttle for next input
        }, 2500);
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
        isHistoryLoading = true;

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
                        chat_clog('[LiveChat] No existing chat found:', parsed.error);
                        isHistoryLoading = false;
                        return;
                    }

                    if (parsed.success) {
                        // Render ai_messages first
                        if (parsed.ai_messages && parsed.ai_messages.length > 0) {
                            chat_clog('[LiveChat] Loading', parsed.ai_messages.length, 'existing AI messages');
                            parsed.ai_messages.forEach(function (msg) {
                                let formattedMsg = formatChatMessage(msg.message);
                                if (msg.sender === 'visitor') {
                                    messagesContainer.append(`
                                        <div class="chatbot-message user-message ai-history-message" style="background-color: #f3f4f6; filter: grayscale(20%); opacity: 0.9;">
                                            <div class="message-header">You</div>
                                            <div class="message-content">${formattedMsg}</div>
                                        </div>
                                    `);
                                } else if (msg.sender === 'aibot') {
                                    messagesContainer.append(`
                                        <div class="chatbot-message bot-message ai-history-message" style="background-color: #f8f9fa; filter: grayscale(20%); opacity: 0.9;">
                                            <div class="message-header">Bot</div>
                                            <div class="message-content">${formattedMsg}</div>
                                        </div>
                                    `);
                                }
                            });
                            
                            appendSystemMessage("You're now chatting with a live agent. Let us know how we can help!");
                        }

                        if (parsed.messages && parsed.messages.length > 0) {
                            chat_clog('[LiveChat] Loading', parsed.messages.length, 'existing messages');

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

                                let formattedMsg = formatChatMessage(msg.message);

                                if (msg.sender_type === 'visitor') {
                                messagesContainer.append(`
                                    <div class="chatbot-message user-message">
                                        <div class="message-header">You</div>
                                        <div class="message-content">${formattedMsg}</div>
                                    </div>
                                `);
                            } else if (msg.sender_type === 'agent') {
                                appendAgentMessage(formattedMsg);
                            } else if (msg.sender_type === 'system') {
                                if (msg.message === '[[CHAT_RESOLVED]]') {
                                    chatResolved = true;
                                } else {
                                    appendSystemMessage(formattedMsg);
                                }
                            }
                        });

                        scrollToBottom();

                        // If the chat is resolved (via message or rate key), don't enter live chat
                        if (chatResolved || parsed.has_rate_key) {
                            appendSystemMessage('Your previous chat was resolved.');
                            chat_clog('[LiveChat] Chat was resolved, staying in AI mode');
                            showRatingUI(liveChatId);
                            isHistoryLoading = false;
                            return;
                        }

                        }

                        // Enter live chat mode silently (no "connected" message)
                        // This happens as long as success is true and we loaded either ai or normal messages
                        if ((parsed.ai_messages && parsed.ai_messages.length > 0) || (parsed.messages && parsed.messages.length > 0)) {
                            enterLiveChatMode(true);
                        }
                    }
                } catch (e) {
                    console.error('[LiveChat] Error parsing get-messages response:', e);
                } finally {
                    isHistoryLoading = false;
                }
            },
            error: function (xhr, status, error) {
                console.error('[LiveChat] Error loading messages:', status, error);
                isHistoryLoading = false;
            }
        });
    }

    // Check for existing messages when the page loads
    loadExistingMessages();

});
