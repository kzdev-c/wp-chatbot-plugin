<?php
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

    $default_headers = [
        'Content-Type: application/json',
        'Accept: application/json',
    ];

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

    $debug      = function_exists( 'kz_push_api_entry' );
    $start_time = $debug ? microtime( true ) : 0;

    $curl = curl_init();
    curl_setopt_array( $curl, $curl_opts );

    $response  = curl_exec( $curl );
    $http_code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );

    $duration_ms = $debug ? round( ( microtime( true ) - $start_time ) * 1000 ) : 0;

    /* ── cURL error path ── */
    if ( $response === false ) {
        $error = curl_error( $curl );
        curl_close( $curl );

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
    curl_close( $curl );

    $decoded = json_decode( $response, true );

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
        'raw'       => $response,
        'data'      => $decoded,
        'error'     => '',
    ];
}
