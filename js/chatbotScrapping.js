jQuery(document).ready(function ($) {
    const useSiteDomainCheckbox = $('#useSiteDomainCheckbox');
    const customDomainInput = $('#custom-domain');
    const startScrapingBtn = $('#start-scraping');

    const hostname = window.location.hostname;
    const domain = hostname.split('.').slice(-2).join('.');

    function toggleDomainInput() {
        if (useSiteDomainCheckbox.is(':checked')) {
            customDomainInput.prop('disabled', true);
            startScrapingBtn.prop('disabled', false);
        } else {
            customDomainInput.prop('disabled', false);
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

    startScrapingBtn.on('click', function (e) {
        e.preventDefault();
        $('#loading-animation').show();

        console.log('test')

        var useSiteDomain = useSiteDomainCheckbox.is(':checked');
        var customDomain = customDomainInput.val() ?? null;

        const scrappingUrl = (useSiteDomain ? domain : customDomain).replace(/^https?:\/\//, '');
        const finalUrl = `https://${scrappingUrl}`;

        $.ajax({
            url: chatbotScrappingAjax.ajaxurl,
            method: 'POST',
            data: {
                action: 'chatbot_scrapping',
                domain: finalUrl,
                useSiteDomain: useSiteDomain
            },
            success: function (response) {
                $('#loading-animation').hide();
                $('#scrapping-response').html('<p>' + response + '</p>');
                setTimeout(function () {
                    $('#scrapping-response').hide(1000);
                })
            },
            error: function () {
                $('#loading-animation').hide();
                $('#scrapping-response').html('<p>' + response + '</p>');
                setTimeout(function () {
                    $('#scrapping-response').hide(1000);
                })
            }
        });
    });
});
