/**
 * Live Chat Manager handles WebSockets and agent communication.
 */

import { chat_clog, formatChatMessage, playNotificationSound } from './utils.js';
import { getSessionId } from './storage.js';
import { scrollToBottom } from './ui.js';

let pusherInstance = null;
let liveChatChannel = null;
let agentTypingTimeout = null;

export const startWebSocket = (liveChatId, config, handlers) => {
    if (!liveChatId || !config.livechat_secret_key) return;

    if (!pusherInstance) {
        pusherInstance = new Pusher(config.livechat_secret_key, {
            cluster: 'mt1',
            wsHost: config.livechat_ws_host,
            wsPort: 443,
            wssPort: 443,
            forceTLS: true,
            enabledTransports: ["ws", "wss"],
        });

        pusherInstance.connection.bind('connected', () => chat_clog('[LiveChat] WebSocket connected'));
        pusherInstance.connection.bind('error', err => console.error('[LiveChat] WebSocket error:', err));
    }

    liveChatChannel = pusherInstance.subscribe(`livechat.${liveChatId}`);

    liveChatChannel.bind('chat-message-sent', (e) => {
        handlers.onMessage(e);
    });

    liveChatChannel.bind('typing-indicator', (e) => {
        if (e.sender_type === 'agent') handlers.onTyping(true);
    });

    liveChatChannel.bind('not-typing-indicator', (e) => {
        if (e.sender_type === 'agent') handlers.onTyping(false);
    });
};

export const stopWebSocket = (liveChatId) => {
    if (pusherInstance && liveChatId) {
        pusherInstance.unsubscribe(`livechat.${liveChatId}`);
        liveChatChannel = null;
    }
};

export const showAgentTyping = (container) => {
    let indicator = jQuery('#agent-typing-indicator');
    if (indicator.length === 0) {
        container.append(`
            <div class="chatbot-message bot-message agent-message" id="agent-typing-indicator">
                <div class="message-header">Agent</div>
                <div class="message-content typing-indicator-container">
                    <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                </div>
            </div>
        `);
    } else {
        if (!indicator.is(':visible')) {
            container.append(indicator);
            indicator.show();
        } else if (container.children().last()[0] !== indicator[0]) {
            container.append(indicator);
        }
    }
    scrollToBottom(container);

    if (agentTypingTimeout) clearTimeout(agentTypingTimeout);
    agentTypingTimeout = setTimeout(() => hideAgentTyping(), 3000);
};

export const hideAgentTyping = () => {
    jQuery('#agent-typing-indicator').hide();
    if (agentTypingTimeout) clearTimeout(agentTypingTimeout);
};
