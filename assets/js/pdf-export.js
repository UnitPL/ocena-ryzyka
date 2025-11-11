(function($) {
    'use strict';
    
    $(document).ready(function() {
        console.log('PDF Export - inicjalizacja');
        
        // Obsługa przycisku "Eksportuj do PDF"
        $('#btn-eksportuj-pdf').on('click', function() {
            eksportujDoPDF();
        });
    });
    
    /**
     * Główna funkcja eksportu do PDF
     */
    function eksportujDoPDF() {
        // Pobierz kod projektu
        const kodProjektu = $('#projekt-kod').text();
        
        if (!kodProjektu) {
            alert('⚠️ Nie znaleziono kodu projektu.\n\nNajpierw zapisz projekt, aby móc go wyeksportować do PDF.');
            return;
        }
        
        // Pokaż loading
        const $button = $('#btn-eksportuj-pdf');
        const originalText = $button.html();
        $button.prop('disabled', true).html('⏳ Generowanie PDF...');
        
        // Wyślij AJAX request
        $.ajax({
            url: ocenaRyzykaAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'ocena_ryzyka_export_pdf',
                nonce: ocenaRyzykaAjax.nonce,
                kod_projektu: kodProjektu
            },
            success: function(response) {
                if (response.success) {
                    // PDF wygenerowany pomyślnie
                    pokazKomunikatSukcesu(response.data);
                    
                    // Automatyczne pobieranie
                    pobierzPDF(response.data.download_url, response.data.filename);
                } else {
                    // Błąd generowania
                    alert('❌ Błąd generowania PDF:\n\n' + response.data.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Błąd AJAX:', xhr, status, error);
                alert('❌ Błąd połączenia z serwerem:\n\n' + error);
            },
            complete: function() {
                // Przywróć przycisk
                $button.prop('disabled', false).html(originalText);
            }
        });
    }
    
    /**
     * Pokazuje komunikat sukcesu
     */
    function pokazKomunikatSukcesu(data) {
        const message = 
            '✅ PDF wygenerowany pomyślnie!\n\n' +
            '📄 Nazwa pliku: ' + data.filename + '\n' +
            '📊 Rozmiar: ' + data.file_size + ' MB\n' +
            '📐 ' + data.format_info + '\n\n' +
            'Plik zostanie automatycznie pobrany...';
        
        alert(message);
    }
    
    /**
     * Pobiera PDF (automatyczne pobieranie)
     */
    function pobierzPDF(url, filename) {
        // Utwórz ukryty link i kliknij go
        const $link = $('<a>')
            .attr('href', url)
            .attr('download', filename)
            .css('display', 'none')
            .appendTo('body');
        
        $link[0].click();
        
        // Usuń link po chwili
        setTimeout(function() {
            $link.remove();
        }, 100);
    }
    
})(jQuery);