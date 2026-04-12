/**
 * Main Chatbot Orchestrator
 * Refactored into ES6 modules for better maintainability.
 */

import { chat_clog, formatChatMessage, playNotificationSound } from './modules/utils.js';
import { getSessionId, initUserTracking, getCookie, setCookie } from './modules/storage.js';
import { scrollToBottom, updateCounter as uiUpdateCounter, showChatbot, hideChatbot, appendSystemMessage } from './modules/ui.js';
import { startWebSocket, stopWebSocket, showAgentTyping, hideAgentTyping } from './modules/livechat.js';
import { getWorkflowNode, renderWorkflowNode } from './modules/workflow.js';
import { apiRequest, askQuestion, getWorkflow, sendLiveChatMessage as apiSendLiveMsg, closeLiveChat as apiCloseLiveChat, rateChat, sendAIHistoryToLiveChat, getLiveChatMessages } from './modules/api.js';
import { initSpeechRecognition } from './modules/voice.js';
import { renderRatingUI, fillStars, setLabel, getLabel } from './modules/rating.js';

jQuery(document).ready(function ($) {
    // --- Elements ---
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

    // --- State ---
    const botDisplayName = (typeof chatbotAjax !== 'undefined' && chatbotAjax.botDisplayName) ? chatbotAjax.botDisplayName : 'Bot';
    let isLiveChatMode = false;
    let liveChatSessionId = null;
    let liveChatId = null;
    let lastMessageId = 0;
    let agentId = null;
    let unreadCount = parseInt(sessionStorage.getItem('cb_unread_count') || '0', 10);
    let isHistoryLoading = false;
    let typingThrottleTime = 0;
    let notTypingTimeout = null;
    let recognition = null;

    let workflowData = null;
    let workflowActive = false;
    let workflowNodeId = null;
    let workflowConversation = [];
    let workflowLoaded = false;

    // --- Helpers ---
    const updateCounter = () => uiUpdateCounter(unreadCount);

    const setWorkflowActive = (isActive) => {
        workflowActive = isActive;
        const inputContainer = $('#chatbot-input-container');
        let hideInputs = isActive;

        if (isActive && workflowNodeId && workflowData?.nodes) {
            const currentNode = workflowData.nodes.find(n => n.id === workflowNodeId);
            if (currentNode && (!currentNode.options || currentNode.options.length === 0)) hideInputs = false;
        }

        if (hideInputs) {
            inputContainer.find('#codeness-chatbot-input, .language-selector, #codeness-chatbot-mic, #codeness-chatbot-send').hide();
            if (inputContainer.find('.workflow-notice').length === 0) {
                inputContainer.prepend('<div class="workflow-notice" style="flex:1; text-align:center; font-size:13px; color:#9ca3b4; font-weight:500;">Please select an option above</div>');
            } else {
                inputContainer.find('.workflow-notice').show();
            }
        } else {
            inputContainer.find('.workflow-notice').hide();
            inputContainer.find('#codeness-chatbot-input, .language-selector, #codeness-chatbot-send').show();
            if (!isLiveChatMode) inputContainer.find('#codeness-chatbot-mic').show();
            inputField.prop('disabled', false).attr('placeholder', 'Type your message...');
            sendButton.prop('disabled', false).css({ 'opacity': '1', 'cursor': 'pointer' });
            $('#codeness-chatbot-mic').prop('disabled', false).css({ 'opacity': '1', 'cursor': 'pointer' });
        }
    };

    const getConversationHistory = () => {
        if (workflowConversation?.length > 0) return [...workflowConversation];
        let conversations = [];
        $('#codeness-chatbot-messages .chatbot-message').each(function () {
            const el = $(this);
            if (el.is('.system-message, .loading-message') || el.find('.prompt-buttons').length > 0 || el.hasClass('agent-message')) return;
            
            if (el.hasClass('workflow-node')) {
                let text = el.find('.workflow-question .message-content').text().trim();
                if (text) conversations.push({ sender: 'aibot', message: text });
                return;
            }

            let text = el.find('.message-content').text().trim();
            if (!text) return;
            let sender = (el.is('.user-message, .workflow-user-choice')) ? 'visitor' : 'aibot';
            conversations.push({ sender, message: text });
        });
        return conversations;
    };

    const saveChatHistory = () => {
        const sid = getSessionId();
        if (!sid) return;
        if (workflowActive && workflowConversation.length <= 1) {
            localStorage.removeItem('cb_history_' + sid);
            return;
        }
        let tempContainer = messagesContainer.clone();
        tempContainer.find('.loading-message, #agent-typing-indicator, #chat-rating-box').remove();
        localStorage.setItem('cb_history_' + sid, tempContainer.html());
    };

    const saveWorkflowState = () => {
        const sid = getSessionId();
        if (!sid) return;
        if (workflowActive && workflowConversation.length <= 1) {
            localStorage.removeItem('cb_workflow_' + sid);
            return;
        }
        localStorage.setItem('cb_workflow_' + sid, JSON.stringify({
            active: workflowActive,
            nodeId: workflowNodeId,
            conversation: workflowConversation,
            workflow: workflowData,
        }));
    };

    const clearWorkflowState = () => {
        const sid = getSessionId();
        if (sid) localStorage.removeItem('cb_workflow_' + sid);
        workflowData = null;
        setWorkflowActive(false);
        workflowNodeId = null;
        workflowConversation = [];
        workflowLoaded = false;
    };

    // --- Live Chat Logic ---
    const enterLiveChatMode = (silent, passedConversations = null) => {
        isLiveChatMode = true;
        liveChatSessionId = getSessionId();
        $('#codeness-chatbot-header span:first-of-type').text('Live Chat');
        chatbot.addClass('livechat-active');
        
        localStorage.setItem('cb_livechat_' + liveChatSessionId, JSON.stringify({
            liveChatId: liveChatId,
            agentId: agentId
        }));
        
        if (recognition) recognition.stop();
        $('#codeness-chatbot-mic').prop('disabled', true).addClass('tts-disabled');
        $('#language-select').prop('disabled', true).addClass('tts-disabled');

        if (!silent) {
            appendSystemMessage(messagesContainer, "You're now chatting with a live agent. Let us know how we can help!", formatChatMessage, scrollToBottom);
            let conversations = passedConversations || getConversationHistory();
            if (conversations.length > 0) {
                sendAIHistoryToLiveChat(liveChatSessionId, conversations, agentId, (passedConversations || workflowConversation.length > 0) ? 'workflow' : 'ai');
            }
        }
        startWebSocket(liveChatId, chatbotAjax, {
            onMessage: (e) => {
                hideAgentTyping();
                if (e.sender_type === 'agent' || e.sender_type === 'system') {
                    if (e.message === '[[CHAT_RESOLVED]]') {
                        appendSystemMessage(messagesContainer, 'The chat has been closed by the agent.', formatChatMessage, scrollToBottom);
                        const closedId = liveChatId;
                        exitLiveChatMode();
                        renderRatingUI(messagesContainer, closedId);
                    } else if (!e.id || e.id > lastMessageId) {
                        appendAgentMessage(e.message || e.content || '');
                        if (e.id) lastMessageId = e.id;
                    }
                }
            },
            onTyping: (isTyping) => isTyping ? showAgentTyping(messagesContainer) : hideAgentTyping()
        });
    };

    const exitLiveChatMode = () => {
        isLiveChatMode = false;
        localStorage.removeItem('cb_livechat_' + getSessionId());
        liveChatId = null;
        lastMessageId = 0;
        chatbot.removeClass('livechat-active');
        $('#codeness-chatbot-mic').prop('disabled', false).removeClass('tts-disabled');
        $('#language-select').prop('disabled', false).removeClass('tts-disabled');
        stopWebSocket(liveChatId);
    };

    const appendAgentMessage = (text) => {
        messagesContainer.append(`
            <div class="chatbot-message bot-message agent-message">
                <div class="message-header">Agent</div>
                <div class="message-content">${formatChatMessage(text)}</div>
            </div>
        `);
        scrollToBottom(messagesContainer);
        if (chatbot.hasClass('collapsed') && !isHistoryLoading) {
            unreadCount++;
            updateCounter();
            playNotificationSound();
        }
    };

    // --- Main Actions ---
    const sendMessage = () => {
        const originalQuestion = inputField.val();
        if (!originalQuestion.trim()) return;

        inputField.val('').css('height', '40px');

        if (isLiveChatMode) {
            messagesContainer.append(`<div class="chatbot-message user-message"><div class="message-header">You</div><div class="message-content">${originalQuestion}</div></div>`);
            scrollToBottom(messagesContainer);
            apiRequest('livechat_not_typing', { session_id: liveChatSessionId });
            apiSendLiveMsg(liveChatSessionId, originalQuestion).then(response => {
                try {
                    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                    if (parsed.success && parsed.data) {
                        if (parsed.data.chat_id && !liveChatId) {
                            liveChatId = parsed.data.chat_id;
                            enterLiveChatMode(true);
                        }
                        if (parsed.data.message_id > lastMessageId) lastMessageId = parsed.data.message_id;
                    } else if (parsed.error) appendSystemMessage(messagesContainer, 'Error: ' + parsed.error, formatChatMessage, scrollToBottom);
                } catch (e) { console.error('Parse error:', e); }
            });
            return;
        }

        let historyStr = "";
        if (workflowActive || (workflowConversation && workflowConversation.length > 0)) {
            const aiConvos = getConversationHistory();
            if (aiConvos?.length > 0) {
                historyStr = JSON.stringify(aiConvos);
            }
            
            if (workflowActive) {
                setWorkflowActive(false);
                appendSystemMessage(messagesContainer, 'Switching to AI assistant...', formatChatMessage, scrollToBottom);
            }
            clearWorkflowState();
        }

        messagesContainer.append(`<div class="chatbot-message user-message"><div class="message-header">You</div><div class="message-content">${formatChatMessage(originalQuestion)}</div></div>`);
        scrollToBottom(messagesContainer);

        const loadingId = 'codeness-chatbot-loading-' + Date.now();
        messagesContainer.append(`<div id="${loadingId}" class="chatbot-message loading-message"><div class="message-content"><div class="loader"></div></div></div>`);
        scrollToBottom(messagesContainer);

        askQuestion(originalQuestion, historyStr).done(response => {
            $(`#${loadingId}`).remove();
            try {
                const parsed = JSON.parse(response);
                if (parsed.error) {
                    messagesContainer.append(`<div class="chatbot-message error-message">${parsed.error}</div>`);
                    scrollToBottom(messagesContainer);
                    return;
                }

                const { response: msgText, prompt_message, livechat, agent_id: aiAgentId } = parsed.response;
                const shouldHandoff = String(livechat).toLowerCase() === 'true' || !!aiAgentId;

                if (prompt_message && !shouldHandoff) {
                    messagesContainer.append(`
                        <div class="chatbot-message bot-message prompt-message">
                            <div class="message-header">${botDisplayName}</div><div class="message-content">${msgText}</div>
                        </div>
                        <div class="chatbot-message bot-message prompt-message">
                            <div class="message-header">${botDisplayName}</div><div class="message-content">${prompt_message}</div>
                            <div class="prompt-buttons"><button class="yes-no-buttons" id="yes-button">Click here to contact us</button></div>
                        </div>
                    `);
                } else if (!shouldHandoff) {
                    messagesContainer.append(`<div class="chatbot-message bot-message"><div class="message-header">${botDisplayName}</div><div class="message-content">${msgText}</div></div>`);
                }
                scrollToBottom(messagesContainer);

                if (chatbot.hasClass('collapsed')) {
                    unreadCount++;
                    updateCounter();
                    playNotificationSound();
                }

                if (shouldHandoff) {
                    liveChatId = parsed.response.chat_id || liveChatId;
                    agentId = parsed.response.agent_id || agentId;
                    enterLiveChatMode();
                }
            } catch (e) { messagesContainer.append('<div class="chatbot-message error-message">Error communicating with the chatbot.</div>'); }
        });
    };

    // --- Workflow Logic ---
    const initWorkflow = () => {
        const modules = chatbotAjax.modules || [];
        if (!Array.isArray(modules) || modules.indexOf('predefined_questions') === -1 || isLiveChatMode) return;

        const sid = getSessionId();
        const saved = localStorage.getItem('cb_workflow_' + sid);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state?.workflow) {
                    workflowData = state.workflow;
                    setWorkflowActive(state.active || false);
                    workflowNodeId = state.nodeId || null;
                    workflowConversation = state.conversation || [];
                    workflowLoaded = true;
                    return;
                }
            } catch (e) { chat_clog('[Workflow] Restore error:', e); }
        }

        if (messagesContainer.find('.chatbot-message').not('.system-message, .workflow-node, .workflow-user-choice, .workflow-answer, .workflow-variable-value').length > 0) {
            workflowLoaded = true;
            return;
        }

        getWorkflow().done(response => {
            if (isLiveChatMode) return;
            try {
                const parsed = typeof response === 'string' ? JSON.parse(response) : response;
                if (parsed.success && parsed.workflow) {
                    workflowData = parsed.workflow;
                    setWorkflowActive(true);
                    workflowLoaded = true;
                    if (parsed.workflow.root_node_id) renderWorkflowNode(messagesContainer, workflowData, parsed.workflow.root_node_id, botDisplayName, workflowCallbacks);
                }
            } catch (e) { chat_clog('[Workflow] API error:', e); }
        });
    };

    const workflowCallbacks = {
        onNodeRender: (nodeId, node) => {
            workflowNodeId = nodeId;
            if (workflowActive) setWorkflowActive(true);
            workflowConversation.push({ sender: 'aibot', message: node.question });
            saveWorkflowState();
        },
        onNodeNotFound: () => {
            appendSystemMessage(messagesContainer, 'Workflow step not found.', formatChatMessage, scrollToBottom);
            setWorkflowActive(false);
            saveWorkflowState();
        }
    };

    // --- Init ---
    updateCounter();
    const sid = getSessionId();
    const savedHtml = localStorage.getItem('cb_history_' + sid);
    if (savedHtml?.trim()) {
        messagesContainer.html(savedHtml);
        scrollToBottom(messagesContainer);
    }
    const observer = new MutationObserver(() => saveChatHistory());
    observer.observe(messagesContainer[0], { childList: true, subtree: true, characterData: true });

    let shouldResumeLiveChat = false;
    const savedLc = localStorage.getItem('cb_livechat_' + sid);
    if (savedLc) {
        try {
            const parsedLc = JSON.parse(savedLc);
            if (parsedLc.liveChatId) {
                liveChatId = parsedLc.liveChatId;
                agentId = parsedLc.agentId || null;
                shouldResumeLiveChat = true;
            }
        } catch (e) {}
    }

    if (shouldResumeLiveChat) {
        enterLiveChatMode(true);
        // Fetch any messages missed during page reload
        getLiveChatMessages(sid).done(res => {
            try {
                const parsed = typeof res === 'string' ? JSON.parse(res) : res;
                if (parsed.success && parsed.messages) {
                    parsed.messages.forEach(msg => {
                        if (msg.id > lastMessageId) {
                            if (msg.sender_type === 'agent') {
                                appendAgentMessage(msg.message || msg.content || '');
                            }
                            lastMessageId = msg.id;
                        }
                    });
                }
            } catch (e) { console.error('[LiveChat] Error loading messages:', e); }
        });
    } else {
        initWorkflow();
    }

    recognition = initSpeechRecognition($('#codeness-chatbot-mic'), inputField, $('#language-select'), {
        onEnd: () => { }
    });

    // --- Event Handlers ---
    toggleButton.on('click', () => {
        initUserTracking();
        chatbot.hasClass('collapsed') ? (showChatbot(chatbot, () => { unreadCount = 0; updateCounter(); })) : hideChatbot(chatbot);
    });

    closeButton.on('click', () => hideChatbot(chatbot));
    inputField.on('click', e => e.stopPropagation());
    inputField.on('input', function () {
        this.style.height = '40px';
        this.style.height = (this.scrollHeight) + 'px';
        
        if (!isLiveChatMode || !liveChatSessionId) return;
        if ($(this).val().trim() === '') {
            if (notTypingTimeout) clearTimeout(notTypingTimeout);
            apiRequest('livechat_not_typing', { session_id: liveChatSessionId });
            typingThrottleTime = 0;
            return;
        }
        const now = Date.now();
        if (now - typingThrottleTime >= 2000) {
            typingThrottleTime = now;
            apiRequest('livechat_typing', { session_id: liveChatSessionId });
        }
        if (notTypingTimeout) clearTimeout(notTypingTimeout);
        notTypingTimeout = setTimeout(() => {
            apiRequest('livechat_not_typing', { session_id: liveChatSessionId });
            typingThrottleTime = 0;
        }, 2500);
    });

    sendButton.on('click', sendMessage);
    inputField.on('keypress', e => { if (e.which === 13) { e.preventDefault(); sendMessage(); } });

    messagesContainer.on('click', '#yes-button', () => modal.show());
    closeModalButton.on('click', () => modal.hide());
    $('#contact-form').on('submit', function (e) {
        e.preventDefault();
        apiRequest('submit_visitor_info', {
            name: $('#name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            interest: $('#interest').val(),
        }).done(res => {
            $('#info-response').html('<div class=" alert-success color-green">' + res + '</div>').show();
            setTimeout(() => $('#info-response').hide(1000), 4000);
        });
    });

    messagesContainer.on('click', '.workflow-option-btn:not(.selected):not(.disabled)', function () {
        const btn = $(this);
        const nodeId = btn.data('node');
        const idx = parseInt(btn.data('index'));
        const node = getWorkflowNode(workflowData, nodeId);
        if (!node) return;
        const opt = node.options[idx];

        messagesContainer.find(`[data-workflow-node="${nodeId}"] .workflow-option-btn`).each(function () {
            $(this).addClass(parseInt($(this).data('index')) === idx ? 'selected' : 'disabled');
        });

        messagesContainer.append(`<div class="chatbot-message workflow-user-choice"><div class="message-header">You</div><div class="message-content">${formatChatMessage(opt.label)}</div></div>`);
        scrollToBottom(messagesContainer);
        workflowConversation.push({ sender: 'visitor', message: opt.label });
        saveWorkflowState();

        switch (opt.type) {
            case 'next_node': setTimeout(() => renderWorkflowNode(messagesContainer, workflowData, opt.next_node_id, botDisplayName, workflowCallbacks), 300); break;
            case 'direct_answer':
                workflowConversation.push({ sender: 'aibot', message: opt.answer });
                messagesContainer.append(`<div class="chatbot-message workflow-answer"><div class="message-header">${botDisplayName}</div><div class="message-content">${formatChatMessage(opt.answer)}</div></div>`);
                setWorkflowActive(false); saveWorkflowState(); appendSystemMessage(messagesContainer, 'Switching to AI assistant...', formatChatMessage, scrollToBottom);
                break;
            case 'ai_continuation':
                const history = JSON.stringify(getConversationHistory());
                setWorkflowActive(false); clearWorkflowState(); appendSystemMessage(messagesContainer, 'Switching to AI assistant...', formatChatMessage, scrollToBottom);
                askQuestion('Please continue assisting based on history.', history).done(res => {
                    try {
                        const p = JSON.parse(res);
                        if (p.response?.response) {
                            messagesContainer.append(`<div class="chatbot-message bot-message"><div class="message-header">${botDisplayName}</div><div class="message-content">${formatChatMessage(p.response.response)}</div></div>`);
                            scrollToBottom(messagesContainer);
                        }
                    } catch (e) { }
                });
                break;
            case 'live_chat':
                const historyL = getConversationHistory();
                setWorkflowActive(false); clearWorkflowState();
                askQuestion('connect me to a live agent').done(res => {
                    try {
                        const p = JSON.parse(res);
                        if (p.response) {
                            liveChatId = p.response.chat_id || liveChatId;
                            agentId = p.response.agent_id || agentId;
                            console.log(p.response);
                            if (String(p.response.livechat).toLowerCase() === 'true' || !!p.response.agent_id) enterLiveChatMode(false, historyL);
                            else appendSystemMessage(messagesContainer, p.response.response || 'No agents available.', formatChatMessage, scrollToBottom);
                        }
                    } catch (e) { appendSystemMessage(messagesContainer, 'Error connecting to agent.', formatChatMessage, scrollToBottom); }
                });
                break;
        }
    });

    endChatButton.on('click', () => {
        const isLive = liveChatId && isLiveChatMode;
        $('.chat-dialog-title').text(isLive ? 'End Live Chat?' : 'Start New Session?');
        $('.chat-dialog-text').text(isLive ? 'End this live chat session? This cannot be undone.' : 'Clear conversation history and start fresh?');
        $('#close-chat-confirm').text(isLive ? 'End Chat' : 'Clear Chat');
        closeChatDialog.addClass('show');
    });

    $('#close-chat-cancel').on('click', () => closeChatDialog.removeClass('show'));
    $('#close-chat-confirm').on('click', () => {
        closeChatDialog.removeClass('show');
        if (liveChatId && isLiveChatMode) {
            apiCloseLiveChat(liveChatId).done(() => {
                appendSystemMessage(messagesContainer, 'Chat closed.', formatChatMessage, scrollToBottom);
                const closedId = liveChatId; exitLiveChatMode(); renderRatingUI(messagesContainer, closedId);
            });
        } else {
            const s = getSessionId();
            localStorage.removeItem('cb_history_' + s);
            localStorage.removeItem('cb_livechat_' + s);
            sessionStorage.removeItem('chatbot_livechat_session_id');
            document.cookie = "cb_user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            clearWorkflowState();
            observer.disconnect();
            messagesContainer.empty();
            appendSystemMessage(messagesContainer, "New conversation started.", formatChatMessage, scrollToBottom);
            observer.observe(messagesContainer[0], { childList: true, subtree: true, characterData: true });
            saveChatHistory();
            initWorkflow();
        }
    });

    messagesContainer.on('mouseenter', '#cr-stars [data-val]', function () {
        const val = +$(this).data('val');
        fillStars(val);
        setLabel(val, true, $(this).closest('#chat-rating-box').data('selected'));
    });

    messagesContainer.on('mouseleave', '#cr-stars', function () {
        const box = $(this).closest('#chat-rating-box');
        const selected = box.data('selected') || 0;
        fillStars(selected);
        setLabel(0, false, selected);
    });

    messagesContainer.on('click', '#cr-stars [data-val]', function () {
        const val = +$(this).data('val');
        const box = $(this).closest('#chat-rating-box');
        box.data('selected', val);
        fillStars(val);
        setLabel(val, true, val);
        $('#chat-rating-submit').prop('disabled', false).addClass('ready');
    });

    messagesContainer.on('click', '#chat-rating-submit', function () {
        const box = $(this).closest('#chat-rating-box');
        const val = box.data('selected');
        if (!val) return;
        const chatIdV = $(this).data('chat');
        $(this).prop('disabled', true).text('Submitting...');
        rateChat(chatIdV, val).done(() => {
            $('#cr-stars, .cr-pip-row, #cr-label, #chat-rating-submit').hide();
            $('#cr-success-detail').text(`Rated ${val}/5 — ${getLabel(val)}. Restarting...`);
            $('#cr-success').css('display', 'flex');
            scrollToBottom(messagesContainer);
            setTimeout(() => {
                const s = getSessionId();
                localStorage.removeItem('cb_history_' + s);
                localStorage.removeItem('cb_livechat_' + s);
                sessionStorage.removeItem('chatbot_livechat_session_id');
                document.cookie = "cb_user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.reload();
            }, 1500);
        });
    });

    $("#codeness-chatbot-maximize").on("click", () => { chatbot.toggleClass("fullscreen resizable"); });
});
