<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Handles the AI chatbot question endpoint.
 * Called via AJAX action 'ask_question'.
 */

check_ajax_referer( 'chatbot_action', 'nonce' );

$wp_chatbot_question  = isset( $_POST['question'] ) ? sanitize_textarea_field( wp_unslash( $_POST['question'] ) ) : '';
$wp_chatbot_history   = isset( $_POST['history'] )  ? wp_kses_post( wp_unslash( $_POST['history'] ) )             : '';

$wp_chatbot_token     = get_option( 'chatbot_token' );
$wp_chatbot_chat_mode = get_option( 'chatbot_chat_mode', 'ai_only' );

if ( empty( $wp_chatbot_question ) ) {
    echo wp_json_encode( [ 'error' => 'Question is required.' ] );
    wp_die();
}

// ─── Mode: Live Chat Only ───
// Skip AI entirely and go straight to live chat
if ( 'livechat_only' === $wp_chatbot_chat_mode ) {
    echo wp_json_encode( [
        'response' => [
            'prompt_message'  => 'Live chat is enabled. Would you like to share your contact details so our team can assist you directly?',
            'response'        => "You're currently connected to live support.",
            'visitor_id'      => session_id(),
            'visitor_prompt'  => true,
            'enter_live_chat' => true,
            'livechat'        => true,
        ],
    ] );
    wp_die();
}

// ─── Mode: AI Only or Both ───
$wp_chatbot_api_url   = CHATBOT_API_BASE_URL . '/query_file';
$wp_chatbot_post_data = [
    'question'   => $wp_chatbot_question,
    'visitor_id' => session_id(),
    'token'      => $wp_chatbot_token,
    'username'   => get_option( 'chatbot_username' ),
];

if ( ! empty( $wp_chatbot_history ) ) {
    $wp_chatbot_post_data['history'] = $wp_chatbot_history;
}

// Execute the API request
$wp_chatbot_result = chatbot_api_request( 'POST', $wp_chatbot_api_url, $wp_chatbot_post_data );

if ( ! $wp_chatbot_result['success'] ) {
    echo wp_json_encode( [ 'error' => 'Error: ' . $wp_chatbot_result['error'] ] );
} else {
    $wp_chatbot_decoded_response = $wp_chatbot_result['data'];
    if ( isset( $wp_chatbot_decoded_response['error'] ) ) {
        echo wp_json_encode( [ 'error' => 'Error from API: ' . $wp_chatbot_decoded_response['error'] ] );
    } else {
        // If the AI decides an agent is needed
        if ( isset( $wp_chatbot_decoded_response['request_agent'] ) && true === $wp_chatbot_decoded_response['request_agent'] ) {

            // ─── If AI Only: Block escalation ───
            if ( 'ai_only' === $wp_chatbot_chat_mode ) {
                $wp_chatbot_decoded_response['livechat']        = false;
                $wp_chatbot_decoded_response['enter_live_chat'] = false;
                $wp_chatbot_decoded_response['request_agent']   = false;
                if ( isset( $wp_chatbot_decoded_response['response'] ) ) {
                    $wp_chatbot_decoded_response['response'] .= "\n\n(I'm an AI assistant. There are no live agents available in this chat right now.)";
                } elseif ( isset( $wp_chatbot_decoded_response['prompt_message'] ) ) {
                    $wp_chatbot_decoded_response['prompt_message'] .= "\n\n(I'm an AI assistant. There are no live agents available in this chat right now.)";
                }
            } elseif ( 'both' === $wp_chatbot_chat_mode ) {
                // ─── If Both: Check agent availability ───
                $wp_chatbot_base_url  = defined( 'CHATBOT_DASHBOARD_API_BASE_URL' ) ? CHATBOT_DASHBOARD_API_BASE_URL : 'https://chatbot-dashboard.local';
                $wp_chatbot_check_url = rtrim( $wp_chatbot_base_url, '/' ) . '/api/livechat/check-agent-availability';

                $wp_chatbot_check_result = chatbot_api_request( 'POST', $wp_chatbot_check_url, [ 'token' => $wp_chatbot_token ] );
                $wp_chatbot_agent_data   = $wp_chatbot_check_result['data'];

                if ( isset( $wp_chatbot_agent_data['success'] ) && true === $wp_chatbot_agent_data['success'] && ! empty( $wp_chatbot_agent_data['agent_id'] ) ) {
                    $wp_chatbot_decoded_response['agent_id'] = $wp_chatbot_agent_data['agent_id'];
                } else {
                    $wp_chatbot_decoded_response['livechat'] = false;
                    if ( isset( $wp_chatbot_decoded_response['response'] ) ) {
                        $wp_chatbot_decoded_response['response'] .= "\n\n(None of our agents are available right now. I will continue assisting you.)";
                    } elseif ( isset( $wp_chatbot_decoded_response['prompt_message'] ) ) {
                        $wp_chatbot_decoded_response['prompt_message'] .= "\n\n(None of our agents are available right now. I will continue assisting you.)";
                    }
                }
            }
        }

        echo wp_json_encode( [ 'response' => $wp_chatbot_decoded_response ] );
    }
}

wp_die();
