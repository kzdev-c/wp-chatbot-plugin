<?php
// Prevent WordPress from outputting anything before us
ob_start();

$text  = isset($_POST['text']) ? sanitize_text_field($_POST['text']) : '';
$voice = isset($_POST['voice']) ? sanitize_text_field($_POST['voice']) : 'en-US-JennyNeural';

if (empty($text)) {
    ob_end_clean();
    wp_send_json_error('Text is required');
}

$api_url = CHATBOT_TTS_BASE_URL . '/tts';
$post_body = json_encode(['text' => $text, 'voice' => $voice]);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_POSTFIELDS     => $post_body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . CHATBOT_TTS_BEARER_TOKEN,
    ],
]);

$response    = curl_exec($curl);
$httpCode    = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
$curlError   = curl_error($curl);

curl_close($curl);

if ($response === false) {
    ob_end_clean();
    wp_send_json_error('cURL error: ' . $curlError);
}

if ($httpCode !== 200) {
    ob_end_clean();
    wp_send_json_error('TTS server returned HTTP ' . $httpCode . ': ' . substr($response, 0, 200));
}

// Verify we actually got audio back
if (strpos($contentType, 'audio') === false) {
    ob_end_clean();
    wp_send_json_error('TTS server returned unexpected content-type: ' . $contentType . ' - Body: ' . substr($response, 0, 200));
}

// Clear ALL output buffers
while (ob_get_level()) {
    ob_end_clean();
}

// Send raw audio binary
header('Content-Type: audio/mpeg');
header('Content-Length: ' . strlen($response));
header('Accept-Ranges: none');
header('Cache-Control: no-cache, no-store');
echo $response;
exit;
