// Storage helpers for cookies, session, and localStorage.
const INACTIVITY_DELAY_MS = 10 * 60 * 1000;

// Inactivity timeout in milliseconds.
export const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
};

export const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// Get or create the visitor session ID.
export const getSessionId = () => {
    let sid = getCookie('cb_user_session');
    if (sid) return sid;

    sid = sessionStorage.getItem('chatbot_livechat_session_id');
    if (!sid) {
        sid = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('chatbot_livechat_session_id', sid);
    }
    return sid;
};

// Save the last time the user was active.
export const recordUserActivity = (sessionId) => {
    localStorage.setItem('cb_last_activity_' + sessionId, Date.now().toString());
};

// Read the last active time.
export const getLastActivity = (sessionId) => {
    const timestamp = localStorage.getItem('cb_last_activity_' + sessionId);
    return timestamp ? parseInt(timestamp, 10) : null;
};

// Clear old history when the user has been idle too long.
export const checkAndClearInactiveHistory = (sessionId) => {
    const lastActivity = getLastActivity(sessionId);
    const now = Date.now();
    
    if (lastActivity && (now - lastActivity) > INACTIVITY_DELAY_MS) {
        // User has been inactive for more than 10 minutes, clear history
        deleteChatHistory(sessionId);
        return true;
    }
    return false;
};

// Start the idle timer.
export const startInactivityTimer = (sessionId, delayMs = INACTIVITY_DELAY_MS) => {
    if (window['cb_inactivity_timer_' + sessionId]) {
        clearTimeout(window['cb_inactivity_timer_' + sessionId]);
    }

    window['cb_inactivity_timer_' + sessionId] = setTimeout(() => {
        const lastActivity = getLastActivity(sessionId);
        const now = Date.now();
        
        if (lastActivity && (now - lastActivity) > delayMs) {
            deleteChatHistory(sessionId);
        }
    }, delayMs);
};

// Reset the idle timer after a message.
export const resetInactivityTimer = (sessionId, delayMs = INACTIVITY_DELAY_MS) => {
    recordUserActivity(sessionId);

    startInactivityTimer(sessionId, delayMs);
};

// Remove all stored chat data for this session.
export const deleteChatHistory = (sessionId) => {
    localStorage.removeItem('cb_history_' + sessionId);
    localStorage.removeItem('cb_livechat_' + sessionId);
    localStorage.removeItem('cb_workflow_' + sessionId);
    localStorage.removeItem('cb_last_activity_' + sessionId);
    
    if (window['cb_inactivity_timer_' + sessionId]) {
        clearTimeout(window['cb_inactivity_timer_' + sessionId]);
        delete window['cb_inactivity_timer_' + sessionId];
    }
};

// Clear any sessions that already expired before reload.
export const processPendingInactivity = () => {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
        if (key.startsWith('cb_last_activity_')) {
            const sessionId = key.replace('cb_last_activity_', '');
            checkAndClearInactiveHistory(sessionId);
        }
    });
};

// Set up the tracking cookies we need.
export const initUserTracking = () => {
    if (!getCookie('cb_user_agent')) {
        let deviceStr = navigator.userAgent;
        if (navigator.userAgentData) {
            const brands = navigator.userAgentData.brands ? navigator.userAgentData.brands.map(b => b.brand).join(', ') : '';
            const platform = navigator.userAgentData.platform || '';
            if (brands || platform) deviceStr = `${platform} - ${brands}`;
        }
        setCookie('cb_user_agent', deviceStr || 'not provided', 365);
    }

    if (!getCookie('cb_user_session')) {
        setCookie('cb_user_session', getSessionId(), 365);
    }

    if (!getCookie('cb_user_location')) {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const fallbackLoc = `${lat},${lon}`;

                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
                    .then(res => res.json())
                    .then(data => {
                        let locName = data.city || data.locality || fallbackLoc;
                        if (data.countryName) locName += `, ${data.countryName}`;
                        setCookie('cb_user_location', locName, 365);
                    })
                    .catch(() => setCookie('cb_user_location', fallbackLoc, 365));
            }, () => setCookie('cb_user_location', 'not provided', 365));
        } else {
            setCookie('cb_user_location', 'not provided', 365);
        }
    }
};
