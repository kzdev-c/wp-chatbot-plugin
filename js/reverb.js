// Guard: chatbotAjax is localized on chatbot-js which may load after this script
if (typeof chatbotAjax !== 'undefined' && chatbotAjax.livechat_secret_key) {
    chat_clog("REVERB JS RUNNING");
    const pusher = new Pusher(chatbotAjax.livechat_secret_key, {
        cluster: "mt1",
        wsHost: "chatbot-dashboard.local",
        wsPort: 443,
        wssPort: 443,
        forceTLS: true,
        enabledTransports: ["ws", "wss"],
    });

    pusher.connection.bind("connected", () => {
        chat_clog("CONNECTED");
    });

    pusher.connection.bind("error", (err) => {
        chat_clog("ERROR", err);
    });

    pusher.connection.bind("state_change", (state) => {
        chat_clog("STATE:", state);
    });

    const channel = pusher.subscribe("test-channel");

    channel.bind("test-event", function (data) {
        chat_clog("Received:", data);
    });
} else {
    if (typeof chat_clog === 'function') chat_clog("REVERB JS: chatbotAjax not available yet, skipping.");
}