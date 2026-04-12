<?php

$domain = sanitize_text_field($_POST['domain']);
$useSiteDomain = sanitize_text_field($_POST['useSiteDomain']);

$result = chatbot_api_request('POST', CHATBOT_API_BASE_URL . '/web_scraper/scrape', [
    'username' => get_option('chatbot_username'),
    'token'    => get_option('chatbot_token'),
    'url'      => $domain
]);

if ($result['success'] && $result['data']) {
    $response_data = $result['data'];
    if ($response_data['response']) {
        echo '<div class="notice notice-success is-dismissible"><p>['.$domain .'] '.$response_data['response'].'</p></div>';
        update_option('domain', $domain);
        update_option('useSiteDomain', $useSiteDomain);
    } else {
        echo $result['raw'];
    }
} else {
    echo $result['raw'];
}

wp_die();
