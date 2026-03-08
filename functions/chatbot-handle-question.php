<?php
$question = sanitize_text_field($_POST['question']);

if (empty($question)) {
    echo json_encode(['error' => 'Please enter a question.']);
    wp_die();
}

$api_url = CHATBOT_API_BASE_URL . '/query_file';
$post_data = [
    'question' => $question,
];

// Initialize cURL
$curl = curl_init();

// Set cURL options
curl_setopt_array($curl, [
    CURLOPT_URL            => $api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_POSTFIELDS     => json_encode($post_data),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
    ],
]);

// Execute the cURL request and capture the response
$response = curl_exec($curl);

// Check for cURL errors
if ($response === false) {
    $error_msg = curl_error($curl);
    echo json_encode(['error' => 'Error: ' . $error_msg]);
} else {
    $decoded_response = json_decode($response, true);
    if (isset($decoded_response['error'])) {
        echo json_encode(['error' => 'Error from API: ' . $decoded_response['error']]);
    } else {
        echo json_encode(['response' => $decoded_response]);
    }
}

curl_close($curl);

wp_die();
