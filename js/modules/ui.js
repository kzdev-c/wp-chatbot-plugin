/**
 * UI Manager for chatbot drawer, scrolling, and notifications.
 */

export const scrollToBottom = (container) => {
    container.stop().animate({
        scrollTop: container[0].scrollHeight
    }, 300);
};

export const updateCounter = (unreadCount) => {
    const counterEl = jQuery('#codeness-chatbot-counter');
    if (unreadCount > 0) {
        counterEl.text(unreadCount).show();
    } else {
        counterEl.hide().text('0');
    }
    sessionStorage.setItem('cb_unread_count', unreadCount);
};

export const showChatbot = (chatbot, onOpen) => {
    chatbot.removeClass('collapsed').css({
        'opacity': '1',
        'transform': 'translateY(0) scale(1)',
        'transition': 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
    });
    if (onOpen) onOpen();
};

export const hideChatbot = (chatbot) => {
    chatbot.css({
        'opacity': '0',
        'transform': 'translate(50px, 70px) scale(0.1)',
        'transition': 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out'
    });
    setTimeout(() => chatbot.addClass('collapsed'), 300);
};

export const appendSystemMessage = (container, text, formatFn, scrollFn) => {
    container.append(`
        <div class="chatbot-message system-message">
            <div class="message-content"><em>${formatFn(text)}</em></div>
        </div>
    `);
    scrollFn(container);
};
