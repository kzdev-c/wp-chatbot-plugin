jQuery(document).ready(function ($) {
    const useSiteDomainCheckbox = $('#useSiteDomainCheckbox');
    const customDomainInput = $('#custom-domain');
    const customDomainContainer = $('#custom-domain-container');
    const startScrapingBtn = $('#start-scraping');

    const hostname = window.location.hostname;
    const domain = hostname.split('.').slice(-2).join('.');

    // --- Notifications ---
    function showToast(message, type = 'success') {
        const $t = $('#settings-toast');
        $t.removeClass('show success error').addClass(type).text(message);
        setTimeout(() => $t.addClass('show'), 10);
        setTimeout(() => $t.removeClass('show'), 4000);
    }

    // --- Domain Toggle Logic ---
    function toggleDomainInput() {
        if (useSiteDomainCheckbox.is(':checked')) {
            customDomainContainer.slideUp(200);
            startScrapingBtn.prop('disabled', false);
        } else {
            customDomainContainer.slideDown(200);
            checkScrapingButtonState();
        }
    }

    function checkScrapingButtonState() {
        startScrapingBtn.prop('disabled', !useSiteDomainCheckbox.is(':checked') && !customDomainInput.val().trim());
    }

    useSiteDomainCheckbox.on('change', toggleDomainInput);
    customDomainInput.on('input', checkScrapingButtonState);

    toggleDomainInput();
    checkScrapingButtonState();

    // --- Scraping Execution ---
    startScrapingBtn.on('click', function (e) {
        e.preventDefault();

        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Scraping…');
        $('#loading-animation').slideDown(200);
        $('#scrapping-response').empty();

        const useSiteDomain = useSiteDomainCheckbox.is(':checked');
        const customDomain = customDomainInput.val() || '';
        const scrappingUrl = (useSiteDomain ? domain : customDomain).replace(/^https?:\/\//, '');
        const finalUrl = 'https://' + scrappingUrl;

        $.ajax({
            url: chatbotScrappingAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'chatbot_scrapping',
                domain: finalUrl,
                useSiteDomain: useSiteDomain
            },
            success: (response) => {
                showToast(response || 'Scraping completed!', 'success');
                $('#scrapping-response').html('<div class="alert-success">' + (response || 'Done!') + '</div>');
            },
            error: (xhr, status) => {
                showToast('Scraping failed: ' + status, 'error');
                $('#scrapping-response').html('<div class="alert-danger">Error: ' + status + '</div>');
            },
            complete: () => {
                $('#loading-animation').slideUp(200);
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });
});
