<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Reusable HTTP helper for the Chatbot Plugin.
 *
 * Wraps cURL boilerplate into a single function so every call-site only
 * needs to provide method, URL, and (optionally) a body + extra headers.
 *
 * Debugging is handled by the KZ Debugger plugin (kz-debugger).
 * When that plugin is active and KZ_DEBUG is true, every API call is
 * automatically logged to the browser debug panel via kzlog() / kz_push_api_entry().
 */

/* ───────────────────────────────────────────────
 *  chatbot_api_request()
 * ─────────────────────────────────────────────── */

/**
 * @param string      $method   HTTP method (GET, POST, PUT, DELETE …).
 * @param string      $url      Fully-qualified API endpoint URL.
 * @param array|null  $body     Associative array for the request body (JSON-encoded). null for GET.
 * @param array       $headers  Additional HTTP headers (merged with defaults).
 * @param int         $timeout  Request timeout in seconds (default 30).
 *
 * @return array {
 *     @type bool        $success    Whether the request succeeded (no cURL error).
 *     @type int         $http_code  HTTP status code returned by the server.
 *     @type string      $raw        Raw response body string.
 *     @type array|null  $data       JSON-decoded response (null on decode failure).
 *     @type string      $error      Error message when $success is false.
 * }
 */
function chatbot_api_request( $method, $url, $body = null, $headers = [], $timeout = 30 ) {

    $parsed_headers = [
        'Content-Type' => 'application/json',
        'Accept'       => 'application/json',
    ];

    foreach ( $headers as $header ) {
        if ( is_string( $header ) && strpos( $header, ':' ) !== false ) {
            list( $key, $value ) = explode( ':', $header, 2 );
            $parsed_headers[ trim( $key ) ] = trim( $value );
        }
    }

    $args = [
        'method'      => strtoupper( $method ),
        'timeout'     => $timeout,
        'headers'     => $parsed_headers,
        'sslverify'   => false,
    ];

    if ( $body !== null ) {
        $args['body'] = wp_json_encode( $body );
    }

    $debug      = function_exists( 'kz_push_api_entry' );
    $start_time = $debug ? microtime( true ) : 0;

    $response = wp_remote_request( $url, $args );

    $duration_ms = $debug ? round( ( microtime( true ) - $start_time ) * 1000 ) : 0;

    /* ── error path ── */
    if ( is_wp_error( $response ) ) {
        $error = $response->get_error_message();

        if ( $debug ) {
            kz_push_api_entry( [
                'method'        => strtoupper( $method ),
                'url'           => $url,
                'request_body'  => $body,
                'timeout'       => $timeout,
                'success'       => false,
                'http_code'     => 0,
                'response_body' => null,
                'error'         => $error,
                'duration_ms'   => $duration_ms,
            ] );
            
        }

        return [
            'success'   => false,
            'http_code' => 0,
            'raw'       => '',
            'data'      => null,
            'error'     => $error,
        ];
    }

    /* ── Success path ── */
    $http_code = wp_remote_retrieve_response_code( $response );
    $raw       = wp_remote_retrieve_body( $response );
    $decoded   = json_decode( $raw, true );

    if ( $debug ) {
        kz_push_api_entry( [
            'method'        => strtoupper( $method ),
            'url'           => $url,
            'request_body'  => $body,
            'timeout'       => $timeout,
            'success'       => true,
            'http_code'     => $http_code,
            'response_body' => $decoded,
            'error'         => '',
            'duration_ms'   => $duration_ms,
        ] );
    }

    return [
        'success'   => true,
        'http_code' => $http_code,
        'raw'       => $raw,
        'data'      => $decoded,
        'error'     => '',
    ];
}
