(function($) {
    'use strict';
    
    let currentProjectCode = null;
    
    $(document).ready(function() {
        console.log('Project Manager - inicjalizacja');
        
        // Obsługa przycisku "Nowy projekt"
        $('#btn-nowy-projekt').on('click', function() {
            nowyProjekt();
        });
        
        // Obsługa przycisku "Zapisz projekt"
        $('#btn-zapisz-projekt').on('click', function() {
            $('#modal-nazwa-maszyny').fadeIn(200);
        });
        
        // Obsługa przycisku "Otwórz projekt"
        $('#btn-otworz-projekt').on('click', function() {
            $('#modal-otworz-projekt').fadeIn(200);
        });
        
        // Zamykanie modali
        $('.modal-close, .modal-close-nazwa').on('click', function() {
            $(this).closest('.ocena-modal').fadeOut(200);
        });
        
        $('#btn-anuluj-zapis, #btn-anuluj-otworz').on('click', function() {
            $(this).closest('.ocena-modal').fadeOut(200);
        });
        
        // Zamknij modal po kliknięciu tła
        $('.ocena-modal').on('click', function(e) {
            if (e.target === this) {
                $(this).fadeOut(200);
            }
        });
        
        // Obsługa potwierdzenia zapisu
        $('#btn-potwierdz-zapis').on('click', function() {
            zapiszProjekt();
        });
        
        // Obsługa potwierdzenia otwarcia
        $('#btn-potwierdz-otworz').on('click', function() {
            otworzProjekt();
        });
        
        // Enter w polu kodu projektu
        $('#input-kod-projektu').on('keypress', function(e) {
            if (e.which === 13) {
                otworzProjekt();
            }
        });
        
        // Enter w polu nazwy maszyny
        $('#input-nazwa-maszyny').on('keypress', function(e) {
            if (e.which === 13) {
                zapiszProjekt();
            }
        });
        
        // Obsługa kopiowania kodu
        $('#btn-kopiuj-kod').on('click', function() {
            const kod = $('#projekt-kod').text();
            
            // Kopiuj do schowka
            if (navigator.clipboard) {
                navigator.clipboard.writeText(kod).then(function() {
                    alert('Kod projektu skopiowany: ' + kod);
                });
            } else {
                // Fallback dla starszych przeglądarek
                const $temp = $('<input>');
                $('body').append($temp);
                $temp.val(kod).select();
                document.execCommand('copy');
                $temp.remove();
                alert('Kod projektu skopiowany: ' + kod);
            }
        });
    });
    
    // Nowy projekt - wyczyść wszystko
    function nowyProjekt() {
        if (!confirm('Czy na pewno chcesz rozpocząć nowy projekt? Niezapisane dane zostaną utracone.')) {
            return;
        }
        
        // Wyczyść tabelę
        $('#table-body').empty();
        
        // Wyczyść localStorage
        if (typeof window.ocenaRyzukaClearLocalStorage === 'function') {
            window.ocenaRyzukaClearLocalStorage();
        }
        
        // Wyczyść informację o projekcie
        $('#projekt-info').hide();
        currentProjectCode = null;
        
        // Dodaj pierwszy pusty wiersz
        if (typeof window.ocenaRyzykaAddSelectionRow === 'function') {
            window.ocenaRyzykaAddSelectionRow();
        }
        
        // Przewiń do lewej
        $('.ocena-ryzyka-table-wrapper').scrollLeft(0);
    }
    
    // Zapisz projekt do bazy
    function zapiszProjekt() {
        const nazwaMaszyny = $('#input-nazwa-maszyny').val().trim();
        
        // Zbierz dane z tabeli
        const tableData = collectTableData();
        
        if (!tableData.rows || tableData.rows.length === 0) {
            alert('Brak danych do zapisania. Wypełnij przynajmniej jeden wiersz.');
            return;
        }
        
        // Wyświetl spinner/loading
        $('#btn-potwierdz-zapis').prop('disabled', true).text('Zapisywanie...');
        
        // Przygotuj dane - wyodrębnij obrazy
        const projectData = {
            rows: tableData.rows,
            timestamp: tableData.timestamp,
            rowCounter: tableData.rowCounter
        };
        
        // Wyodrębnij obrazy do osobnego obiektu
        const images = {};
        projectData.rows.forEach(function(row, index) {
            if (row.obraz && row.obraz.startsWith('data:image')) {
                images['row' + row.lp + '_obraz'] = row.obraz;
                row.obraz = 'PLACEHOLDER_' + row.lp + '_obraz'; // Placeholder
            }
            if (row.obraz_elementow && row.obraz_elementow.startsWith('data:image')) {
                images['row' + row.lp + '_obraz_elementow'] = row.obraz_elementow;
                row.obraz_elementow = 'PLACEHOLDER_' + row.lp + '_obraz_elementow'; // Placeholder
            }
        });
        
        // Wyślij AJAX
        $.ajax({
            url: ocenaRyzykaAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',  // DODAJ TO
            data: {
                action: 'ocena_ryzyka_save_project',
                nonce: ocenaRyzykaAjax.nonce,
                nazwa_maszyny: nazwaMaszyny,
                data_json: JSON.stringify(projectData),
                images: JSON.stringify(images)
            },
            success: function(response) {
                if (response.success) {
                    currentProjectCode = response.data.kod_projektu;
                    
                    // Pokaż kod projektu
                    $('#projekt-kod').text(currentProjectCode);
                    $('#projekt-info').fadeIn(300);
                    
                    // Zamknij modal
                    $('#modal-nazwa-maszyny').fadeOut(200);
                    
                    // Wyczyść pole
                    $('#input-nazwa-maszyny').val('');
                    
                    // Pokaż komunikat
                    alert('✅ Projekt zapisany!\n\nKod projektu: ' + currentProjectCode + '\n\nZapisz ten kod, aby móc otworzyć projekt później.');
                } else {
                    alert('❌ Błąd zapisu: ' + response.data.message);
                }
            },
            error: function(xhr, status, error) {
                alert('❌ Błąd połączenia: ' + error);
            },
            complete: function() {
                $('#btn-potwierdz-zapis').prop('disabled', false).text('Zapisz');
            }
        });
    }
    
    // Otwórz projekt z bazy
    // Otwórz projekt z bazy
    function otworzProjekt() {
        const kodProjektu = $('#input-kod-projektu').val().trim().toUpperCase();
        
        if (!kodProjektu) {
            $('#modal-error').text('Podaj kod projektu').fadeIn(200);
            return;
        }
        
        // Wyświetl spinner/loading
        $('#btn-potwierdz-otworz').prop('disabled', true).text('Wczytywanie...');
        $('#modal-error').hide();
        
        // Wyślij AJAX
        $.ajax({
            url: ocenaRyzykaAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'ocena_ryzyka_load_project',
                nonce: ocenaRyzykaAjax.nonce,
                kod_projektu: kodProjektu
            },
            success: function(response) {
                console.log('Odpowiedź serwera:', response); // DEBUG
                
                if (response.success) {
                    const projekt = response.data.projekt;
                    console.log('Projekt:', projekt); // DEBUG
                    console.log('data_json type:', typeof projekt.data_json); // DEBUG
                    console.log('data_json content:', projekt.data_json); // DEBUG
                    
                    let data;
                    
                    try {
                        // Sprawdź czy data_json to string czy już obiekt
                        if (typeof projekt.data_json === 'string') {
                            data = JSON.parse(projekt.data_json);
                        } else if (typeof projekt.data_json === 'object') {
                            // Już jest obiektem
                            data = projekt.data_json;
                        } else {
                            throw new Error('Nieprawidłowy format danych');
                        }
                        
                        console.log('Sparsowane dane:', data); // DEBUG
                        
                        // Wyczyść obecną tabelę
                        $('#table-body').empty();
                        
                        // Wczytaj dane
                        loadProjectData(data);
                        
                        // Ustaw kod projektu
                        currentProjectCode = projekt.kod_projektu;
                        $('#projekt-kod').text(currentProjectCode);
                        $('#projekt-info').fadeIn(300);
                        
                        // Zamknij modal
                        $('#modal-otworz-projekt').fadeOut(200);
                        
                        // Wyczyść pole
                        $('#input-kod-projektu').val('');
                        
                        // Pokaż komunikat
                        alert('✅ Projekt wczytany!\n\n' + (projekt.nazwa_maszyny || 'Bez nazwy'));
                        
                    } catch (parseError) {
                        console.error('Błąd parsowania JSON:', parseError);
                        console.error('Dane które próbowano sparsować:', projekt.data_json);
                        $('#modal-error').text('Błąd odczytu danych projektu: ' + parseError.message).fadeIn(200);
                    }
                } else {
                    $('#modal-error').text(response.data.message).fadeIn(200);
                }
            },
            error: function(xhr, status, error) {
                console.error('Błąd AJAX:', xhr, status, error); // DEBUG
                $('#modal-error').text('Błąd połączenia: ' + error).fadeIn(200);
            },
            complete: function() {
                $('#btn-potwierdz-otworz').prop('disabled', false).text('Otwórz');
            }
        });
    }
    
    // Wczytaj dane projektu do tabeli
    function loadProjectData(data) {
        if (!data.rows || data.rows.length === 0) {
            return;
        }
        
        // Przywróć rowCounter
        if (data.rowCounter) {
            window.ocenaRyzykaRowCounter = data.rowCounter;
        }
        
        // Dodaj wiersze (użyj funkcji z autosave)
        data.rows.forEach(function(rowData) {
            if (typeof window.ocenaRyzykaRestoreRow === 'function') {
                // Jeśli jest funkcja z autosave
                window.ocenaRyzykaRestoreRow(rowData);
            } else {
                // Fallback - prosta implementacja
                restoreRowSimple(rowData);
            }
        });
        
        // Przewiń do lewej
        $('.ocena-ryzyka-table-wrapper').scrollLeft(0);
    }
    
    // Prosta implementacja przywracania wiersza (fallback)
    function restoreRowSimple(rowData) {
        if (!rowData.rodzaj_zagrozenia) {
            return;
        }
        
        if (typeof window.ocenaRyzykaGenerateDataRow === 'function') {
            const rowHtml = window.ocenaRyzykaGenerateDataRow(rowData.lp, rowData.rodzaj_zagrozenia);
            $('#table-body').append(rowHtml);
            
            const $row = $('#row-' + rowData.lp);
            
            // Wypełnij dane
            $row.find('[data-field="czesc_systemu"]').val(rowData.czesc_systemu);
            $row.find('[data-field="zrodlo_zagrozenia"]').val(rowData.zrodlo_zagrozenia);
            $row.find('[data-field="zrodlo_zagrozenia_custom"]').val(rowData.zrodlo_zagrozenia_custom);

            // Jeśli było wybrane "Inne źródło" i jest wartość custom, pokaż pole
            if (rowData.zrodlo_zagrozenia === '__INNE__' && rowData.zrodlo_zagrozenia_custom) {
                $row.find('[data-field="zrodlo_zagrozenia_custom"]').show();
            }

            $row.find('[data-field="zrodlo_zagrozenia_opis"]').val(rowData.zrodlo_zagrozenia_opis);
            $row.find('[data-field="potencjalne_nastepstwo"]').val(rowData.potencjalne_nastepstwo);
            $row.find('[data-field="czesc_ciala"]').val(rowData.czesc_ciala);
            $row.find('[data-field="skutki"]').val(rowData.skutki);
            $row.find('[data-field="fazy_zycia"]').val(rowData.fazy_zycia);
            $row.find('[data-field="dph_przed"]').val(rowData.dph_przed);
            $row.find('[data-field="lo_przed"]').val(rowData.lo_przed);
            $row.find('[data-field="fe_przed"]').val(rowData.fe_przed);
            $row.find('[data-field="np_przed"]').val(rowData.np_przed);
            $row.find('[data-field="srodki_profilaktyczne"]').val(rowData.srodki_profilaktyczne);
            $row.find('[data-field="dph_po"]').val(rowData.dph_po);
            $row.find('[data-field="lo_po"]').val(rowData.lo_po);
            $row.find('[data-field="fe_po"]').val(rowData.fe_po);
            $row.find('[data-field="np_po"]').val(rowData.np_po);
            
            // Obrazy
            if (rowData.obraz) {
                $row.find('[data-field="obraz"]').siblings('.preview-image').attr('src', rowData.obraz).show();
                $row.find('[data-field="obraz"]').text('✓');
            }
            
            if (rowData.obraz_elementow) {
                $row.find('[data-field="obraz_elementow"]').siblings('.preview-image').attr('src', rowData.obraz_elementow).show();
                $row.find('[data-field="obraz_elementow"]').text('✓');
            }
            
            // Dodaj obsługę
            if (typeof window.ocenaRyzykaAttachRowEvents === 'function') {
                window.ocenaRyzykaAttachRowEvents($row);
            }
            
            // Przelicz
            if (typeof window.ocenaRyzykaCalculateRisk === 'function') {
                window.ocenaRyzykaCalculateRisk($row);
            }
        }
    }
    
    // Zbieranie danych z tabeli (kopia funkcji z autosave.js)
    function collectTableData() {
        const rows = [];

        $('#table-body tr:not(.selection-row)').each(function() {
            const $row = $(this);
            const rowData = {
                lp: $row.find('.cell-lp .lp-number').text(),
                rodzaj_zagrozenia: $row.attr('data-rodzaj') || '',
                czesc_systemu: $row.find('[data-field="czesc_systemu"]').val() || '',
                obraz: $row.find('[data-field="obraz"]').siblings('.preview-image').attr('src') || '',
                zrodlo_zagrozenia: $row.find('[data-field="zrodlo_zagrozenia"]').val() || '',
                zrodlo_zagrozenia_custom: $row.find('[data-field="zrodlo_zagrozenia_custom"]').val() || '',
                zrodlo_zagrozenia_opis: $row.find('[data-field="zrodlo_zagrozenia_opis"]').val() || '',
                obraz_elementow: $row.find('[data-field="obraz_elementow"]').siblings('.preview-image').attr('src') || '',
                potencjalne_nastepstwo: $row.find('[data-field="potencjalne_nastepstwo"]').val() || '',
                czesc_ciala: $row.find('[data-field="czesc_ciala"]').val() || '',
                skutki: $row.find('[data-field="skutki"]').val() || '',
                fazy_zycia: $row.find('[data-field="fazy_zycia"]').val() || '',
                dph_przed: $row.find('[data-field="dph_przed"]').val() || '',
                lo_przed: $row.find('[data-field="lo_przed"]').val() || '',
                fe_przed: $row.find('[data-field="fe_przed"]').val() || '',
                np_przed: $row.find('[data-field="np_przed"]').val() || '',
                hrn_przed: $row.find('.calc-hrn-przed').text() || '',
                stopien_przed: $row.find('.calc-stopien-przed').text() || '',
                srodki_profilaktyczne: $row.find('[data-field="srodki_profilaktyczne"]').val() || '',
                dph_po: $row.find('[data-field="dph_po"]').val() || '',
                lo_po: $row.find('[data-field="lo_po"]').val() || '',
                fe_po: $row.find('[data-field="fe_po"]').val() || '',
                np_po: $row.find('[data-field="np_po"]').val() || '',
                hrn_po: $row.find('.calc-hrn-po').text() || '',
                stopien_po: $row.find('.calc-stopien-po').text() || '',
                redukcja: $row.find('.calc-redukcja').text() || ''
            };
            
            rows.push(rowData);
        });
        
        return {
            rows: rows,
            timestamp: new Date().toISOString(),
            rowCounter: window.ocenaRyzykaRowCounter || rows.length + 1
        };
    }
    
})(jQuery);