<?php

$domain = sanitize_text_field($_POST['domain']);
$useSiteDomain = sanitize_text_field($_POST['useSiteDomain']);


$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => CHATBOT_API_BASE_URL . '/web_scraper/scrape',
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
        'url' => $domain
    ]),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($curl);

$response_data = json_decode($response, true);

if ($response_data) {
    if ($response_data['response']) {
        echo '<div class="notice notice-success is-dismissible"><p>['.$domain .'] '.$response_data['response'].'</p></div>';
        update_option('domain', $domain);
        update_option('useSiteDomain', $useSiteDomain);
    } else {
        echo $response;
    }
} else {
    echo $response;
}

curl_close($curl);
wp_die();
