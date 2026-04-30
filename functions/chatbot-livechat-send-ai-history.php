<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Handles sending the AI conversation history to the API when a live chat starts.
 * Called via AJAX action 'livechat_send_ai_history'.
 */

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_session_id    = isset( $_POST['session_id'] )   ? sanitize_text_field( wp_unslash( $_POST['session_id'] ) ) : '';
$wp_chatbot_conversations_raw = isset( $_POST['conversations'] ) ? wp_unslash( $_POST['conversations'] ) : []; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

$wp_chatbot_token    = get_option( 'chatbot_token' );
$wp_chatbot_base_url = CHATBOT_DASHBOARD_API_BASE_URL . '/api/livechat';

if ( empty( $wp_chatbot_token ) ) {
    echo wp_json_encode( [ 'error' => 'Live chat is not configured. Please set the Token in Credentials settings.' ] );
    wp_die();
}

if ( empty( $wp_chatbot_session_id ) || empty( $wp_chatbot_conversations_raw ) ) {
    echo wp_json_encode( [ 'error' => 'Session ID and conversations are required.' ] );
    wp_die();
}

// Sanitize conversations array
$wp_chatbot_conversations = [];
foreach ( $wp_chatbot_conversations_raw as $wp_chatbot_conv ) {
    if ( isset( $wp_chatbot_conv['sender'] ) && isset( $wp_chatbot_conv['message'] ) ) {
        $wp_chatbot_sender = sanitize_text_field( $wp_chatbot_conv['sender'] );
        if ( in_array( $wp_chatbot_sender, [ 'aibot', 'visitor', 'workflow', 'workflow_bot' ], true ) ) {
            $wp_chatbot_conversations[] = [
                'sender'  => $wp_chatbot_sender,
                'message' => sanitize_textarea_field( $wp_chatbot_conv['message'] ),
            ];
        }
    }
}

$wp_chatbot_api_url = rtrim( $wp_chatbot_base_url, '/' ) . '/send-previous-conversation';

$wp_chatbot_post_data = [
    'token'         => $wp_chatbot_token,
    'sessionId'     => $wp_chatbot_session_id,
    'conversations' => $wp_chatbot_conversations,
];

if ( isset( $_POST['agentId'] ) && ! empty( $_POST['agentId'] ) ) {
    $wp_chatbot_post_data['agentId'] = intval( $_POST['agentId'] );
}

if ( isset( $_POST['type'] ) && ! empty( $_POST['type'] ) ) {
    $wp_chatbot_post_data['type'] = sanitize_text_field( wp_unslash( $_POST['type'] ) );
}

$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, $wp_chatbot_post_data );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => 'Live chat error: ' . $wp_chatbot_result['error'] ] );
} else {
    $wp_chatbot_decoded_response = $wp_chatbot_result['data'];
    if ( isset( $wp_chatbot_decoded_response['error'] ) ) {
        echo wp_json_encode( [ 'error' => 'Live chat API error: ' . $wp_chatbot_decoded_response['error'] ] );
    } else {
        echo wp_json_encode( [
            'success' => true,
            'data'    => $wp_chatbot_decoded_response,
        ] );
    }
}

wp_die();
