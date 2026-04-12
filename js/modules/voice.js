/**
 * Voice Manager for handling speech recognition.
 */

export const initSpeechRecognition = (micButton, inputField, langSelect, callbacks) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        micButton.prop('disabled', true).attr('title', 'Speech recognition not supported.');
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = langSelect.val() || 'en-US';

    langSelect.on('change', function() {
        recognition.lang = jQuery(this).val();
    });

    recognition.onaudiostart = () => micButton.addClass('pulse-animation');
    recognition.onaudioend = () => micButton.removeClass('pulse-animation');
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.val(inputField.val() + transcript);
    };

    recognition.onerror = () => {
        micButton.css('color', '');
        micButton.removeClass('pulse-animation');
        callbacks.onEnd();
    };

    recognition.onend = () => {
        micButton.css('color', '');
        callbacks.onEnd();
    };

    return recognition;
};
