jQuery(document).ready(function ($) {
    const useSiteDomainCheckbox = $('#useSiteDomainCheckbox');
    const customDomainInput = $('#custom-domain');
    const customDomainContainer = $('#custom-domain-container');
    const startScrapingBtn = $('#start-scraping');

    const hostname = window.location.hostname;
    const domain = hostname.split('.').slice(-2).join('.');

    /* ── Toast helper ── */
    function showToast(message, type) {
        type = type || 'success';
        var $t = $('#settings-toast');
        $t.removeClass('show success error').addClass(type).text(message);
        setTimeout(function () { $t.addClass('show'); }, 10);
        setTimeout(function () { $t.removeClass('show'); }, 4000);
    }

    /* ── Toggle domain input ── */
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
        if (!useSiteDomainCheckbox.is(':checked') && customDomainInput.val().trim() === '') {
            startScrapingBtn.prop('disabled', true);
        } else {
            startScrapingBtn.prop('disabled', false);
        }
    }

    useSiteDomainCheckbox.on('change', toggleDomainInput);
    customDomainInput.on('input', checkScrapingButtonState);

    toggleDomainInput();
    checkScrapingButtonState();

    /* ── Start scraping ── */
    startScrapingBtn.on('click', function (e) {
        e.preventDefault();

        var $btn = $(this);
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="dashicons dashicons-update settings-spin"></span> Scraping…');
        $('#loading-animation').slideDown(200);
        $('#scrapping-response').empty();

        var useSiteDomain = useSiteDomainCheckbox.is(':checked');
        var customDomain = customDomainInput.val() || '';

        var scrappingUrl = (useSiteDomain ? domain : customDomain).replace(/^https?:\/\//, '');
        var finalUrl = 'https://' + scrappingUrl;

        $.ajax({
            url: chatbotScrappingAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'chatbot_scrapping',
                domain: finalUrl,
                useSiteDomain: useSiteDomain
            },
            success: function (response) {
                showToast(response || 'Scraping completed!', 'success');
                $('#scrapping-response').html('<div class="alert-success">' + (response || 'Done!') + '</div>');
            },
            error: function (jqXHR, textStatus) {
                showToast('Scraping failed: ' + textStatus, 'error');
                $('#scrapping-response').html('<div class="alert-danger">Error: ' + textStatus + '</div>');
            },
            complete: function () {
                $('#loading-animation').slideUp(200);
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });
});
