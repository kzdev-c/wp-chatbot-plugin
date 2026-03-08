<div class="wrap">
    <h1>Web Scraping</h1>
    <div class="modern-form">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="useSiteDomainCheckbox"
                <?php if (get_option('useSiteDomain') == 'true') echo 'checked'; ?>>

            <label class="form-check-label ml-4 mb-1" for="useSiteDomainCheckbox">
                Use Current Site Domain
            </label>
        </div>

        <div class="form-group" id="custom-domain-container">
            <label for="custom-domain">Custom Domain:</label>
            <div class="input-group">
                <div class="input-group-prepend">
                    <span class="input-group-text">https://</span>
                </div>
                <input type="text" value="<?php echo esc_attr(str_replace(['https://', 'http://'], '', get_option('domain'))); ?>"
                    id="custom-domain" class="form-control" placeholder="Enter custom domain">
            </div>
        </div>

        <button id="start-scraping" class="btn btn-primary">Start Scraping Now</button>

        <div class="loading" id="loading-animation">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    </div>

    <div id="scrapping-response"></div>
</div>