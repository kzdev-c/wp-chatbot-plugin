/**
 * Persistence layer handling cookies, session, and local storage.
 */

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

/**
 * Retrieves or generates a unique session ID for the current visitor.
 */
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

/**
 * Initializes tracking cookies for device and location.
 */
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
