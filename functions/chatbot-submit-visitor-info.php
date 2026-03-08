<?php


$curl = curl_init();

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
// Get the current session ID

$visitor_id = session_id();

curl_setopt_array($curl, [
    CURLOPT_URL            => CHATBOT_API_BASE_URL . '/visitor/save_data',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_POSTFIELDS     => json_encode([
        'username' => get_option('chatbot_username'),
        'token'    => get_option('chatbot_token'),
        'name'     => $_POST['name'],
        'email'    => $_POST['email'],
        'phone'    => $_POST['phone'],
        'interest' => $_POST['interest'],
        'visitor_id' => $visitor_id,
    ]),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($curl);

$response_data = json_decode($response, true);

echo $response_data['response'];    

curl_close($curl);
wp_die();
