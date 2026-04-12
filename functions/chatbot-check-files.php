<?php

$api_url = CHATBOT_API_BASE_URL . '/file_chatbot/list_uploaded_files';

$result = chatbot_api_request('POST', $api_url, [
    'username' => get_option('chatbot_username'),
    'token'    => get_option('chatbot_token'),
]);

if ($result['success']) {
    $response_data = $result['data'];
    if ($response_data['files'][0]['file_name']) {
        $fileName = $response_data['files'][0]['file_name'];
        update_option('file_name', $fileName);
        echo '<div class="notice notice-success is-dismissible"><p>' . $fileName . '</p></div>';
    } else {
        echo '<div class="notice notice-error is-dismissible"><p>Error: No files found.</p><p>Please upload files from your dashboard first.</p></div>';
    }
} else {
    echo '<div class="notice notice-error is-dismissible"><p>Error: Unable to reach API.</p><p>' . esc_html($result['error']) . '</p></div>';
}

wp_die();
