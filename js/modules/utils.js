/**
 * Utility functions for logging, formatting, and notifications.
 */

export const chat_clog = (...args) => {
    // Only log if explicit debug is needed, otherwise silent
    // return console.log(...args);
};

/**
 * Basic markdown-style formatting for chat messages.
 */
export const formatChatMessage = (text) => {
    if (!text) return '';
    // Unescape common characters and handle newlines/bolding
    return text
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

/**
 * Plays a subtle notification beep using Web Audio API.
 */
export const playNotificationSound = () => {
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
};
