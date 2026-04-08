<?php

/**
 * Chatbot Appearance Settings – AJAX Handlers
 * Uses the existing WP options system (get_option / update_option).
 */

/* ─── Default appearance values ─── */
function chatbot_appearance_defaults() {
    return [
        // UI colours
        'color_primary'        => '#d2232a',
        'color_secondary'      => '#a81b21',
        'color_background'     => '#ffffff',
        'color_accent'         => '#e8555b',
        'color_mode'           => 'solid',

        // Text colours
        'text_user_message'    => '#1a1d26',
        'text_bot_message'     => '#ffffff',
        'text_ui'              => '#6b7280',

        // Typography – global
        'font_family'          => "'Inter', sans-serif",
        'letter_spacing'       => '0',

        // Typography – per part
        'header_font_size'     => '15',
        'header_font_weight'   => '600',
        'bot_font_size'        => '14',
        'bot_font_weight'      => '400',
        'user_font_size'       => '14',
        'user_font_weight'     => '400',
        'input_font_size'      => '13',
        'input_font_weight'    => '400',

        // Bot identity
        'bot_display_name'     => '',
        'bot_avatar_url'       => '',

        // Messages area
        'messages_bg'          => '#f7f8fc',
        'user_bubble_bg'       => '#eef1f8',
    ];
}


/* ─── Validation helpers ─── */
function chatbot_validate_hex_color($color) {
    return (bool) preg_match('/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/', $color);
}

function chatbot_validate_font_size($size) {
    $size = intval($size);
    return $size >= 10 && $size <= 28;
}

function chatbot_validate_font_weight($weight) {
    $allowed = ['100','200','300','400','500','600','700','800','900'];
    return in_array((string) $weight, $allowed, true);
}

function chatbot_validate_letter_spacing($spacing) {
    $spacing = floatval($spacing);
    return $spacing >= -2 && $spacing <= 5;
}

function chatbot_validate_bot_name($name) {
    $name = trim($name);
    return mb_strlen($name) <= 50;
}

function chatbot_sanitize_font_family($family) {
    // Allow alphanumeric, spaces, commas quotes, hyphens
    return preg_replace('/[^a-zA-Z0-9\s,\'\"\-]/', '', $family);
}


/* ─── Save handler ─── */
function chatbot_appearance_save() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized', 403);
    }

    $defaults = chatbot_appearance_defaults();
    $current  = get_option('chatbot_appearance', $defaults);
    $settings = is_array($current) ? $current : $defaults;
    $errors   = [];

    // Colour fields
    $color_fields = [
        'color_primary', 'color_secondary', 'color_background', 'color_accent',
        'text_user_message', 'text_bot_message', 'text_ui',
        'messages_bg', 'user_bubble_bg',
    ];

    foreach ($color_fields as $field) {
        if (isset($_POST[$field])) {
            $val = sanitize_text_field($_POST[$field]);
            if (chatbot_validate_hex_color($val)) {
                $settings[$field] = $val;
            } else {
                $errors[] = "Invalid colour for {$field}: {$val}";
            }
        }
    }

    // Font family
    if (isset($_POST['font_family'])) {
        $settings['font_family'] = chatbot_sanitize_font_family($_POST['font_family']);
    }

    // Color mode
    if (isset($_POST['color_mode'])) {
        $mode = sanitize_text_field($_POST['color_mode']);
        $settings['color_mode'] = in_array($mode, ['solid', 'gradient'], true) ? $mode : 'solid';
    }

    // Per-part font sizes
    $font_size_fields = ['header_font_size', 'bot_font_size', 'user_font_size', 'input_font_size'];
    foreach ($font_size_fields as $fsf) {
        if (isset($_POST[$fsf])) {
            $size = intval($_POST[$fsf]);
            if (chatbot_validate_font_size($size)) {
                $settings[$fsf] = (string) $size;
            } else {
                $errors[] = ucfirst(str_replace('_', ' ', $fsf)) . ' must be between 10 and 28.';
            }
        }
    }

    // Per-part font weights
    $font_weight_fields = ['header_font_weight', 'bot_font_weight', 'user_font_weight', 'input_font_weight'];
    foreach ($font_weight_fields as $fwf) {
        if (isset($_POST[$fwf])) {
            $weight = sanitize_text_field($_POST[$fwf]);
            if (chatbot_validate_font_weight($weight)) {
                $settings[$fwf] = $weight;
            } else {
                $errors[] = 'Invalid ' . str_replace('_', ' ', $fwf) . '.';
            }
        }
    }

    // Letter spacing
    if (isset($_POST['letter_spacing'])) {
        $spacing = floatval($_POST['letter_spacing']);
        if (chatbot_validate_letter_spacing($spacing)) {
            $settings['letter_spacing'] = (string) $spacing;
        } else {
            $errors[] = 'Letter spacing must be between -2 and 5.';
        }
    }

    // Bot display name
    if (isset($_POST['bot_display_name'])) {
        $name = sanitize_text_field($_POST['bot_display_name']);
        if (chatbot_validate_bot_name($name)) {
            $settings['bot_display_name'] = $name;
            // Also update the main chatbot_name option so existing system stays in sync
            update_option('chatbot_name', $name);
        } else {
            $errors[] = 'Bot name must be 50 characters or fewer.';
        }
    }

    // Avatar URL (set by media uploader or explicit clear)
    if (isset($_POST['bot_avatar_url'])) {
        $url = esc_url_raw($_POST['bot_avatar_url']);
        $settings['bot_avatar_url'] = $url;
    }

    update_option('chatbot_appearance', $settings);

    if (!empty($errors)) {
        wp_send_json_success([
            'message'  => 'Settings saved with warnings.',
            'warnings' => $errors,
            'settings' => $settings,
        ]);
    } else {
        wp_send_json_success([
            'message'  => 'Appearance settings saved successfully.',
            'settings' => $settings,
        ]);
    }
}


/* ─── Load handler ─── */
function chatbot_appearance_load() {
    $defaults = chatbot_appearance_defaults();
    $settings = get_option('chatbot_appearance', $defaults);

    // Merge with defaults so new keys are always present
    $settings = wp_parse_args($settings, $defaults);

    // If bot_display_name is empty, fall back to main chatbot_name
    if (empty($settings['bot_display_name'])) {
        $settings['bot_display_name'] = get_option('chatbot_name', 'Chat Assistant');
    }

    wp_send_json_success(['settings' => $settings]);
}


/* ─── Import handler ─── */
function chatbot_appearance_import() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized', 403);
    }

    $raw = isset($_POST['import_data']) ? wp_unslash($_POST['import_data']) : '';
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        wp_send_json_error('Invalid JSON data.');
    }

    $defaults = chatbot_appearance_defaults();
    $settings = [];
    $errors   = [];

    // Validate each key
    $color_fields = [
        'color_primary', 'color_secondary', 'color_background', 'color_accent',
        'text_user_message', 'text_bot_message', 'text_ui',
        'messages_bg', 'user_bubble_bg',
    ];

    foreach ($defaults as $key => $default) {
        if (isset($data[$key])) {
            $val = $data[$key];
            if (in_array($key, $color_fields, true)) {
                if (chatbot_validate_hex_color($val)) {
                    $settings[$key] = sanitize_text_field($val);
                } else {
                    $errors[] = "Invalid colour for {$key}";
                    $settings[$key] = $default;
                }
            } elseif ($key === 'font_size') {
                if (chatbot_validate_font_size($val)) {
                    $settings[$key] = (string) intval($val);
                } else {
                    $errors[] = 'Invalid font size';
                    $settings[$key] = $default;
                }
            } elseif ($key === 'font_weight') {
                if (chatbot_validate_font_weight($val)) {
                    $settings[$key] = (string) $val;
                } else {
                    $errors[] = 'Invalid font weight';
                    $settings[$key] = $default;
                }
            } elseif ($key === 'letter_spacing') {
                if (chatbot_validate_letter_spacing($val)) {
                    $settings[$key] = (string) floatval($val);
                } else {
                    $errors[] = 'Invalid letter spacing';
                    $settings[$key] = $default;
                }
            } elseif ($key === 'bot_display_name') {
                $name = sanitize_text_field($val);
                if (chatbot_validate_bot_name($name)) {
                    $settings[$key] = $name;
                } else {
                    $errors[] = 'Invalid bot name';
                    $settings[$key] = $default;
                }
            } elseif ($key === 'font_family') {
                $settings[$key] = chatbot_sanitize_font_family($val);
            } elseif ($key === 'bot_avatar_url') {
                $settings[$key] = esc_url_raw($val);
            } else {
                $settings[$key] = sanitize_text_field($val);
            }
        } else {
            $settings[$key] = $default;
        }
    }

    update_option('chatbot_appearance', $settings);

    // Sync bot name
    if (!empty($settings['bot_display_name'])) {
        update_option('chatbot_name', $settings['bot_display_name']);
    }

    wp_send_json_success([
        'message'  => empty($errors) ? 'Settings imported successfully.' : 'Imported with warnings.',
        'warnings' => $errors,
        'settings' => $settings,
    ]);
}


/* ─── Reset handler ─── */
function chatbot_appearance_reset() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized', 403);
    }

    $defaults = chatbot_appearance_defaults();
    update_option('chatbot_appearance', $defaults);

    wp_send_json_success([
        'message'  => 'Appearance settings reset to defaults.',
        'settings' => $defaults,
    ]);
}
