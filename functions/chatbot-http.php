<?php
/**
 * Reusable HTTP helper for the Chatbot Plugin.
 *
 * Wraps cURL boiler-plate into a single function so every call-site only
 * needs to provide method, URL, and (optionally) a body + extra headers.
 *
 * @param string      $method   HTTP method (GET, POST, PUT, DELETE …).
 * @param string      $url      Fully-qualified API endpoint URL.
 * @param array|null  $body     Associative array for the request body (JSON-encoded automatically). Pass null for GET.
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

    $default_headers = [
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    // Merge caller-supplied headers (caller can override defaults by key)
    $merged_headers = array_unique( array_merge( $default_headers, $headers ) );

    $curl_opts = [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_ENCODING       => '',
        CURLOPT_MAXREDIRS      => 10,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST  => strtoupper( $method ),
        CURLOPT_HTTPHEADER     => $merged_headers,
    ];

    if ( $body !== null ) {
        $curl_opts[ CURLOPT_POSTFIELDS ] = json_encode( $body );
    }

    $debug = defined( 'CHATBOT_DEBUG' ) && CHATBOT_DEBUG;

    // ── Debug: log outgoing request ──
    if ( $debug ) {
        error_log( '[Chatbot DEBUG] ── REQUEST ──' );
        error_log( '[Chatbot DEBUG] Method : ' . strtoupper( $method ) );
        error_log( '[Chatbot DEBUG] URL    : ' . $url );
        error_log( '[Chatbot DEBUG] Body   : ' . ( $body !== null ? json_encode( $body ) : '(none)' ) );
        error_log( '[Chatbot DEBUG] Timeout: ' . $timeout . 's' );
    }

    $curl = curl_init();
    curl_setopt_array( $curl, $curl_opts );

    $response  = curl_exec( $curl );
    $http_code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );

    if ( $response === false ) {
        $error = curl_error( $curl );
        curl_close( $curl );

        $result = [
            'success'   => false,
            'http_code' => 0,
            'raw'       => '',
            'data'      => null,
            'error'     => $error,
        ];

        // ── Debug: log error ──
        if ( $debug ) {
            error_log( '[Chatbot DEBUG] ── RESPONSE (ERROR) ──' );
            error_log( '[Chatbot DEBUG] cURL Error: ' . $error );
        }

        return $result;
    }

    curl_close( $curl );

    $result = [
        'success'   => true,
        'http_code' => $http_code,
        'raw'       => $response,
        'data'      => json_decode( $response, true ),
        'error'     => '',
    ];

    // ── Debug: log success ──
    if ( $debug ) {
        error_log( '[Chatbot DEBUG] ── RESPONSE (OK) ──' );
        error_log( '[Chatbot DEBUG] HTTP Code: ' . $http_code );
        error_log( '[Chatbot DEBUG] Response : ' . $response );
    }

    return $result;
}
