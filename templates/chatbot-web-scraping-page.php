<?php if (!defined('ABSPATH')) exit; ?>
<div class="wrap chatbot-settings-wrap" id="chatbot-scraping">

    <!-- Page Header -->
    <div class="settings-page-header">
        <div>
            <h1><span class="dashicons dashicons-admin-site-alt3" style="margin-right:8px;font-size:26px;line-height:1.3;"></span>Web Scraping</h1>
            <p class="settings-page-subtitle">Scrape your website content to train the chatbot's knowledge base.</p>
        </div>
    </div>

    <!-- Toast -->
    <div id="settings-toast" class="settings-toast"></div>

    <div class="settings-grid">

        <!-- Left: Main Card -->
        <div class="settings-col-main">
            <div class="settings-card">
                <div class="settings-card-header">
                    <h2><span class="dashicons dashicons-admin-links"></span> Domain Configuration</h2>
                </div>
                <div class="settings-card-body">

                    <!-- Toggle: Use site domain -->
                    <label class="scraping-domain-toggle" for="useSiteDomainCheckbox">
                        <div class="scraping-toggle-switch">
                            <input type="checkbox" id="useSiteDomainCheckbox"
                                <?php if (get_option('useSiteDomain') == 'true') echo 'checked'; ?> />
                            <span class="scraping-toggle-slider"></span>
                        </div>
                        <div>
                            <span class="scraping-toggle-label">Use Current Site Domain</span>
                            <span class="scraping-toggle-desc">Automatically use <strong><?php echo esc_html(parse_url(home_url(), PHP_URL_HOST)); ?></strong></span>
                        </div>
                    </label>

                    <!-- Custom domain input -->
                    <div class="settings-field" id="custom-domain-container">
                        <label for="custom-domain">Custom Domain</label>
                        <div class="scraping-url-input">
                            <span class="scraping-url-prefix">https://</span>
                            <input type="text"
                                value="<?php echo esc_attr(str_replace(['https://', 'http://'], '', get_option('domain'))); ?>"
                                id="custom-domain"
                                placeholder="example.com" />
                        </div>
                    </div>

                    <div class="settings-save-row" style="margin-top:20px;">
                        <button type="button" class="settings-btn settings-btn-primary settings-btn-lg" id="start-scraping">
                            <span class="dashicons dashicons-download"></span> Start Scraping Now
                        </button>
                    </div>

                    <!-- Loading -->
                    <div id="loading-animation" style="display:none;margin-top:16px;text-align:center;">
                        <div class="scraping-loader">
                            <span class="dashicons dashicons-update settings-spin" style="font-size:24px;width:24px;height:24px;color:#6366f1;"></span>
                            <span style="margin-left:8px;color:#6b7280;font-size:13px;">Scraping in progress… this may take a few minutes.</span>
                        </div>
                    </div>

                    <div id="scrapping-response" class="settings-response" style="margin-top:12px;"></div>
                </div>
            </div>
        </div>

        <!-- Right: Info Card -->
        <div class="settings-col-side">
            <div class="settings-card">
                <div class="settings-card-header">
                    <h2><span class="dashicons dashicons-info-outline"></span> How It Works</h2>
                </div>
                <div class="settings-card-body" style="font-size:13px;color:#6b7280;line-height:1.7;">
                    <ol style="margin:0;padding-left:18px;">
                        <li>Enter the domain you want the chatbot to learn from</li>
                        <li>Click <strong>Start Scraping</strong> to begin</li>
                        <li>The system crawls all accessible pages</li>
                        <li>Content is processed and indexed for AI responses</li>
                    </ol>
                    <div style="margin-top:14px;padding:10px 14px;background:#f5f3ff;border-radius:8px;border:1px solid #e0e7ff;">
                        <strong style="color:#4f46e5;font-size:12px;">💡 TIP</strong>
                        <p style="margin:4px 0 0;font-size:12px;color:#6366f1;">For best results, make sure your site pages are publicly accessible and not blocked by robots.txt.</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>