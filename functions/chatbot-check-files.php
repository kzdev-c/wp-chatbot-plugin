<?php

$curl = curl_init();

$api_url = CHATBOT_API_BASE_URL . '/file_chatbot/list_uploaded_files';
error_log('[chatbot_check_files] API URL: ' . $api_url);

curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
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
    ]),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($curl);

$response_data = json_decode($response, true);

if ($response) {
    if ($response_data['files'][0]['file_name']) {
        $fileName = $response_data['files'][0]['file_name'];
        update_option('file_name', $fileName);
        echo '<div class="notice notice-success is-dismissible"><p>' . $fileName . '</p></div>';
    } else {
        echo '<div class="notice notice-error is-dismissible"><p>Error: No files found.</p><p>Please upload files from your dashboard first.</p></div>';
    }
} else {
    $curlError = curl_error($curl);
    error_log('[chatbot_check_files] cURL error: ' . $curlError);
    echo '<div class="notice notice-error is-dismissible"><p>Error: Unable to reach API.</p><p>' . esc_html($curlError) . '</p></div>';
}


curl_close($curl);

wp_die();
