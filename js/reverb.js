console.log("REVERB JS RUNNING");
const pusher = new Pusher("vxndobokdf3gjybrbjuj", {
    cluster: "mt1",
    wsHost: "chatbot-dashboard.local",
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
    enabledTransports: ["ws", "wss"],
});

pusher.connection.bind("connected", () => {
    console.log("CONNECTED");
});

pusher.connection.bind("error", (err) => {
    console.log("ERROR", err);
});

pusher.connection.bind("state_change", (state) => {
    console.log("STATE:", state);
});

const channel = pusher.subscribe("test-channel");

channel.bind("test-event", function (data) {
    console.log("Received:", data);
});
