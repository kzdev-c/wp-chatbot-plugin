/**
 * API layer for all chatbot-related AJAX requests.
 */

export const apiRequest = (action, data) => {
    return jQuery.ajax({
        url: chatbotAjax.ajaxurl,
        method: 'POST',
        data: { action, ...data }
    });
};

export const askQuestion = (question, history) => {
    return apiRequest('ask_question', { question, history });
};

export const getWorkflow = () => {
    return apiRequest('chatbot_get_workflow', {});
};

export const sendLiveChatMessage = (sessionId, message) => {
    return apiRequest('livechat_send_message', { session_id: sessionId, message });
};

export const closeLiveChat = (chatId) => {
    return apiRequest('livechat_close', { chat_id: chatId });
};

export const rateChat = (chatId, rating) => {
    return apiRequest('livechat_rate', { chat_id: chatId, rating });
};

export const sendAIHistoryToLiveChat = (sessionId, conversations, agentId, type) => {
    return apiRequest('livechat_send_ai_history', {
        session_id: sessionId,
        conversations,
        agentId,
        type
    });
};
