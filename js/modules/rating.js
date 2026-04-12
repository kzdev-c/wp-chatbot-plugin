/**
 * Rating System module for managing chat feedback UI and logic.
 */

import { scrollToBottom } from './ui.js';

const LABELS = {
    0.5: 'Terrible', 1: 'Poor', 1.5: 'Below average', 2: 'Fair', 2.5: 'Okay',
    3: 'Good', 3.5: 'Pretty good', 4: 'Great', 4.5: 'Excellent', 5: 'Outstanding'
};

export const renderRatingUI = (container, chatId) => {
    if (jQuery('#chat-rating-box').length > 0) return;

    container.append(`
        <div class="chatbot-message system-message chat-rating-container" id="chat-rating-box">
            <svg width="0" height="0" style="position:absolute;">
                <defs>
                    <linearGradient id="cr-half-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="50%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#e5e7eb"/>
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
    scrollToBottom(container);
};

export const fillStars = (val) => {
    jQuery('#cr-stars .cr-star-wrap').each(function() {
        const idx = +jQuery(this).data('index');
        const svg = jQuery(this).find('svg');
        if (val >= idx) svg.attr({ fill: '#f59e0b', stroke: '#d97706' });
        else if (val >= idx - 0.5) svg.attr({ fill: 'url(#cr-half-grad)', stroke: '#e5e7eb' });
        else svg.attr({ fill: '#e5e7eb', stroke: '#e5e7eb' });
    });
    for (let i = 1; i <= 5; i++) {
        jQuery('#cr-pip-' + i).toggleClass('on', val >= i - 0.4);
    }
};

export const setLabel = (val, active, selectedVal) => {
    const labelEl = jQuery('#cr-label');
    labelEl.text(active && val ? LABELS[val] || '' : (selectedVal ? LABELS[selectedVal] : 'Tap to rate'));
    labelEl.toggleClass('active', active || !!selectedVal);
};

export const getLabel = (val) => LABELS[val] || '';
