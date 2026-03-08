<?php

$username = sanitize_text_field($_POST['username']);
$token    = sanitize_text_field($_POST['token']);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => 'https://chatbots-dashboard.codenesslab.com/api/check-user-credentials',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode([
        'username' => $username,
        'token'    => $token,
    ]),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($curl);

$response_data = json_decode($response, true);

if ($response_data && isset($response_data['valid'])) {
    if ($response_data['valid'] == 1) {
        echo '<div class="notice notice-success is-dismissible"><p>Credentials are correct and settings saved.</p></div>';
        update_option('chatbot_username', $username);
        update_option('chatbot_token', $token);
    } elseif ($response_data['valid'] == 0) {
        echo '<div class="notice notice-error is-dismissible"><p>Invalid credentials. Please check your username and token.</p></div>';
    }
} else {
    return $response;
    echo '<div class="notice notice-error is-dismissible"><p>There was an error with the credentials check. Please try again later.</p></div>';
}

curl_close($curl);
wp_die();
